const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");

const currentMonth = () => new Date().toISOString().slice(0, 7);
const isPastMonth = (month) => String(month) < currentMonth();
const isValidMonth = (value) => /^\d{4}-\d{2}$/.test(String(value || ""));

const employeeCode = (employeeId) => {
  const raw = String(employeeId || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `EMP-${raw.slice(-6) || "000001"}`;
};

const defaultComponentsForEmployee = (employee) => {
  const role = (employee?.role || "").toLowerCase();
  const department = (employee?.department || "").toLowerCase();

  let basicPay = 32000;
  if (role.includes("manager")) basicPay = 68000;
  else if (role.includes("developer") || department.includes("engineering")) basicPay = 56000;
  else if (department.includes("finance")) basicPay = 52000;
  else if (department.includes("sales")) basicPay = 45000;
  else if (department.includes("hr")) basicPay = 40000;

  return {
    basicPay,
    hra: Math.round(basicPay * 0.2),
    bonus: Math.round(basicPay * 0.08),
    overtimePay: 0,
    additionalAllowances: 0,
    taxPercent: 10,
    pfDeduction: Math.round(basicPay * 0.12),
    leaveDeduction: 0,
    loanDeduction: 0,
    otherDeductions: 0,
  };
};

const calculatePayroll = (components) => {
  const basicPay = Number(components.basicPay || 0);
  const hra = Number(components.hra || 0);
  const bonus = Number(components.bonus || 0);
  const overtimePay = Number(components.overtimePay || 0);
  const additionalAllowances = Number(components.additionalAllowances || 0);
  const taxPercent = Number(components.taxPercent || 0);
  const pfDeduction = Number(components.pfDeduction || 0);
  const leaveDeduction = Number(components.leaveDeduction || 0);
  const loanDeduction = Number(components.loanDeduction || 0);
  const otherDeductions = Number(components.otherDeductions || 0);

  const allowancesTotal = hra + bonus + overtimePay + additionalAllowances;
  const grossSalary = basicPay + allowancesTotal;
  const taxAmount = (grossSalary * taxPercent) / 100;
  const deductionsTotal = taxAmount + pfDeduction + leaveDeduction + loanDeduction + otherDeductions;
  const netSalary = Math.max(0, grossSalary - deductionsTotal);

  return {
    basicPay,
    hra,
    bonus,
    overtimePay,
    additionalAllowances,
    taxPercent,
    pfDeduction,
    leaveDeduction,
    loanDeduction,
    otherDeductions,
    allowancesTotal,
    grossSalary,
    deductionsTotal,
    netSalary,
  };
};

const ensurePayrollForMonth = async (month) => {
  const employees = await Employee.find()
    .select("_id name department role")
    .lean();

  const existing = await Payroll.find({ month }).lean();
  const existingMap = new Map(existing.map((record) => [String(record.employeeId), record]));
  const toInsert = [];
  const toUpdate = [];

  employees.forEach((employee) => {
    const employeeId = String(employee._id);
    const existingRecord = existingMap.get(employeeId);
    const defaults = defaultComponentsForEmployee(employee);

    if (!existingRecord) {
      const calc = calculatePayroll(defaults);
      const defaultStatus = isPastMonth(month) ? "Paid" : "Pending";
      toInsert.push({
        employeeId: employee._id,
        month,
        employeeCode: employeeCode(employee._id),
        employeeName: employee.name || "Employee",
        department: employee.department || "General",
        designation: employee.role || "Staff",
        ...defaults,
        ...calc,
        status: defaultStatus,
        paymentDate: defaultStatus === "Paid" ? new Date(`${month}-28T12:00:00.000Z`) : null,
      });
      return;
    }

    const needsSnapshotUpdate =
      !existingRecord.employeeCode ||
      !existingRecord.employeeName ||
      !existingRecord.department ||
      !existingRecord.designation ||
      existingRecord.allowancesTotal === undefined ||
      existingRecord.deductionsTotal === undefined ||
      existingRecord.grossSalary === undefined;

    if (needsSnapshotUpdate) {
      const calc = calculatePayroll({
        basicPay: existingRecord.basicPay ?? existingRecord.salary ?? defaults.basicPay,
        hra: existingRecord.hra ?? 0,
        bonus: existingRecord.bonus ?? 0,
        overtimePay: existingRecord.overtimePay ?? 0,
        additionalAllowances: existingRecord.additionalAllowances ?? existingRecord.allowances ?? 0,
        taxPercent: existingRecord.taxPercent ?? 0,
        pfDeduction: existingRecord.pfDeduction ?? 0,
        leaveDeduction: existingRecord.leaveDeduction ?? 0,
        loanDeduction: existingRecord.loanDeduction ?? 0,
        otherDeductions: existingRecord.otherDeductions ?? existingRecord.deductions ?? 0,
      });

      toUpdate.push({
        updateOne: {
          filter: { _id: existingRecord._id },
          update: {
            $set: {
              employeeCode: employeeCode(employee._id),
              employeeName: employee.name || "Employee",
              department: employee.department || "General",
              designation: employee.role || "Staff",
              ...calc,
            },
          },
        },
      });
    }
  });

  if (toInsert.length > 0) {
    await Payroll.insertMany(toInsert, { ordered: false });
  }

  if (toUpdate.length > 0) {
    await Payroll.bulkWrite(toUpdate, { ordered: false });
  }

  // For historical months, keep payroll finalized by default:
  // move only Pending records to Paid (leave On Hold unchanged).
  if (isPastMonth(month)) {
    await Payroll.updateMany(
      { month, status: "Pending" },
      {
        $set: {
          status: "Paid",
          paymentDate: new Date(`${month}-28T12:00:00.000Z`),
        },
      }
    );
  }
};

const getPayrollRecords = async (req, res) => {
  try {
    const month = isValidMonth(req.query.month) ? req.query.month : currentMonth();
    const department = (req.query.department || "All").trim();
    const search = (req.query.search || "").trim().toLowerCase();
    const sortBy = req.query.sortBy || "employeeName";
    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

    await ensurePayrollForMonth(month);

    let records = await Payroll.find({ month }).lean();

    if (department !== "All") {
      records = records.filter((record) => record.department === department);
    }

    if (search) {
      records = records.filter((record) => {
        const name = String(record.employeeName || "").toLowerCase();
        const code = String(record.employeeCode || "").toLowerCase();
        const designation = String(record.designation || "").toLowerCase();
        return name.includes(search) || code.includes(search) || designation.includes(search);
      });
    }

    const sortableFields = new Set(["employeeName", "department", "netSalary", "grossSalary", "deductionsTotal", "status"]);
    const selectedSort = sortableFields.has(sortBy) ? sortBy : "employeeName";
    const multiplier = sortOrder === "desc" ? -1 : 1;

    records.sort((a, b) => {
      const aVal = a[selectedSort];
      const bVal = b[selectedSort];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * multiplier;
      }
      return String(aVal || "").localeCompare(String(bVal || "")) * multiplier;
    });

    const total = records.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const items = records.slice(start, start + limit);

    return res.json({
      success: true,
      month,
      page,
      limit,
      total,
      totalPages,
      records: items,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch payroll records", error: error.message });
  }
};

const getPayrollSummary = async (req, res) => {
  try {
    const month = isValidMonth(req.query.month) ? req.query.month : currentMonth();
    await ensurePayrollForMonth(month);
    const records = await Payroll.find({ month }).lean();

    const paid = records.filter((record) => record.status === "Paid");
    const totalEmployeesPaid = paid.length;
    const totalPayrollAmount = records.reduce((sum, record) => sum + Number(record.grossSalary || 0), 0);
    const totalDeductions = records.reduce((sum, record) => sum + Number(record.deductionsTotal || 0), 0);
    const netSalaryPaid = records.reduce((sum, record) => sum + Number(record.netSalary || 0), 0);
    const pendingPaymentsCount = records.filter((record) => record.status !== "Paid").length;

    return res.json({
      success: true,
      month,
      summary: {
        totalEmployeesPaid,
        totalPayrollAmount,
        totalDeductions,
        netSalaryPaid,
        pendingPaymentsCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch payroll summary", error: error.message });
  }
};

const getPayrollAnalytics = async (req, res) => {
  try {
    const month = isValidMonth(req.query.month) ? req.query.month : currentMonth();
    await ensurePayrollForMonth(month);
    const monthRecords = await Payroll.find({ month }).lean();

    const departmentMap = new Map();
    monthRecords.forEach((record) => {
      const key = record.department || "General";
      const current = departmentMap.get(key) || { department: key, totalNetSalary: 0, count: 0 };
      current.totalNetSalary += Number(record.netSalary || 0);
      current.count += 1;
      departmentMap.set(key, current);
    });

    const salaryByDepartment = Array.from(departmentMap.values()).sort((a, b) => b.totalNetSalary - a.totalNetSalary);

    const trendRaw = await Payroll.aggregate([
      { $group: { _id: "$month", total: { $sum: "$netSalary" } } },
      { $sort: { _id: 1 } },
    ]);
    const monthlyTrend = trendRaw.slice(-6).map((row) => ({ month: row._id, total: row.total }));

    const topPaidEmployees = [...monthRecords]
      .sort((a, b) => Number(b.netSalary || 0) - Number(a.netSalary || 0))
      .slice(0, 5)
      .map((row) => ({
        employeeName: row.employeeName,
        employeeCode: row.employeeCode,
        department: row.department,
        netSalary: row.netSalary,
      }));

    return res.json({
      success: true,
      month,
      analytics: {
        salaryByDepartment,
        monthlyTrend,
        topPaidEmployees,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch payroll analytics", error: error.message });
  }
};

const updatePayrollComponents = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Payroll.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Payroll record not found" });
    }

    const updates = calculatePayroll(req.body || {});
    Object.assign(record, updates);
    record.status = "Pending";
    await record.save();

    return res.json({ success: true, message: "Payroll components updated", record });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update payroll components", error: error.message });
  }
};

const updatePayrollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["Pending", "Paid", "On Hold"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const update = {
      status,
      processedBy: req.user.id,
    };
    if (status === "Paid") {
      update.paymentDate = new Date();
    } else {
      update.paymentDate = null;
    }

    const record = await Payroll.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
    if (!record) {
      return res.status(404).json({ success: false, message: "Payroll record not found" });
    }

    return res.json({ success: true, message: `Payroll marked as ${status}`, record });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update payroll status", error: error.message });
  }
};

const processPayroll = async (req, res) => {
  try {
    const month = isValidMonth(req.body.month) ? req.body.month : currentMonth();
    await ensurePayrollForMonth(month);
    const result = await Payroll.updateMany(
      { month },
      {
        $set: {
          status: "Paid",
          paymentDate: new Date(),
          processedBy: req.user.id,
        },
      }
    );

    return res.json({
      success: true,
      message: "Payroll processed successfully",
      month,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to process payroll", error: error.message });
  }
};

const getPayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Payroll.findById(id).lean();
    if (!record) {
      return res.status(404).json({ success: false, message: "Payroll record not found" });
    }

    return res.json({
      success: true,
      payslip: {
        companyName: "HRMS",
        generatedAt: new Date().toISOString(),
        record,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch payslip", error: error.message });
  }
};

module.exports = {
  getPayrollRecords,
  getPayrollSummary,
  getPayrollAnalytics,
  updatePayrollComponents,
  updatePayrollStatus,
  processPayroll,
  getPayslip,
};
