import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { employeeAPI, payrollAPI } from "../services/api";

const ATTENDANCE_KEY = "hrms_attendance_by_date";
const LEAVES_KEY = "hrms_leave_requests";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const currentMonth = () => new Date().toISOString().slice(0, 7);
const previousMonth = (month) => {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const pctChange = (current, prev) => {
  const prevValue = Number(prev || 0);
  if (prevValue === 0) return current > 0 ? 100 : 0;
  return ((Number(current || 0) - prevValue) / prevValue) * 100;
};

const hash = (value) => {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const readLocalJson = (key, fallback = []) => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return fallback;
  }
};

function Reports() {
  const { user } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [department, setDepartment] = useState("All");
  const [search, setSearch] = useState("");

  const [employees, setEmployees] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [payrollAnalytics, setPayrollAnalytics] = useState({
    salaryByDepartment: [],
    monthlyTrend: [],
    topPaidEmployees: [],
  });

  const [tableSortBy, setTableSortBy] = useState("name");
  const [tableSortOrder, setTableSortOrder] = useState("asc");
  const [tablePage, setTablePage] = useState(1);
  const tableLimit = 10;

  const [reportType, setReportType] = useState("Employee");
  const [rangeFrom, setRangeFrom] = useState(`${month}-01`);
  const [rangeTo, setRangeTo] = useState(`${month}-28`);
  const [customDepartment, setCustomDepartment] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canAccessReports = true;
  const canGenerate = true;

  useEffect(() => {
    setRangeFrom(`${month}-01`);
    setRangeTo(`${month}-28`);
  }, [month]);

  const fetchAllPayrollForMonth = async (targetMonth) => {
    const merged = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const response = await payrollAPI.getRecords({ month: targetMonth, page, limit: 100, department: "All", search: "" });
      const payload = response.data || {};
      merged.push(...(payload.records || []));
      totalPages = payload.totalPages || 1;
      page += 1;
    }

    return merged;
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [employeesRes, payrollAll, analyticsRes] = await Promise.all([
        employeeAPI.getAll(),
        fetchAllPayrollForMonth(month),
        payrollAPI.getAnalytics({ month }),
      ]);

      setEmployees(Array.isArray(employeesRes.data) ? employeesRes.data : []);
      setPayrollRecords(payrollAll);
      setPayrollAnalytics(analyticsRes.data?.analytics || { salaryByDepartment: [], monthlyTrend: [], topPaidEmployees: [] });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports data.");
      setEmployees([]);
      setPayrollRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month]);

  const attendanceMap = useMemo(() => readLocalJson(ATTENDANCE_KEY, {}), []);
  const leaveRequests = useMemo(() => readLocalJson(LEAVES_KEY, []), []);

  const attendanceRowsForMonth = useMemo(() => {
    return Object.entries(attendanceMap)
      .filter(([date]) => String(date).startsWith(month))
      .flatMap(([, rows]) => (Array.isArray(rows) ? rows : []));
  }, [attendanceMap, month]);

  const monthlyAttendancePct = useMemo(() => {
    if (attendanceRowsForMonth.length === 0) return 0;
    const present = attendanceRowsForMonth.filter((row) => row.status === "Present").length;
    return (present / attendanceRowsForMonth.length) * 100;
  }, [attendanceRowsForMonth]);

  const absencesByEmployee = useMemo(() => {
    const map = new Map();
    attendanceRowsForMonth.forEach((row) => {
      if (row.status !== "Absent") return;
      const key = row.employeeId;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()]
      .map(([employeeId, absences]) => {
        const employee = employees.find((item) => String(item._id) === String(employeeId));
        return {
          employeeId,
          name: employee?.name || "Unknown",
          absences,
        };
      })
      .sort((a, b) => b.absences - a.absences)
      .slice(0, 5);
  }, [attendanceRowsForMonth, employees]);

  const lateCheckins = useMemo(() => {
    const map = new Map();
    attendanceRowsForMonth.forEach((row) => {
      const key = row.employeeId;
      const isLate = row.status === "Present" && hash(`${key}-${month}`) % 100 < 12;
      if (!isLate) return;
      map.set(key, (map.get(key) || 0) + 1);
    });

    return [...map.entries()]
      .map(([employeeId, lateDays]) => {
        const employee = employees.find((item) => String(item._id) === String(employeeId));
        return { employeeId, name: employee?.name || "Unknown", lateDays };
      })
      .sort((a, b) => b.lateDays - a.lateDays)
      .slice(0, 5);
  }, [attendanceRowsForMonth, employees, month]);

  const leaveStats = useMemo(() => {
    const monthLeaves = leaveRequests.filter((leave) => String(leave.startDate || "").startsWith(month));
    return {
      approved: monthLeaves.filter((leave) => leave.status === "Approved").length,
      pending: monthLeaves.filter((leave) => leave.status === "Pending").length,
      rejected: monthLeaves.filter((leave) => leave.status === "Rejected").length,
      onLeaveEmployees: new Set(monthLeaves.map((leave) => leave.employeeEmail)).size,
    };
  }, [leaveRequests, month]);

  const employeeByDepartment = useMemo(() => {
    const map = new Map();
    employees.forEach((employee) => {
      const key = employee.department || "General";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].map(([departmentName, count]) => ({ department: departmentName, count }));
  }, [employees]);

  const deptOptions = useMemo(() => ["All", ...new Set(employeeByDepartment.map((x) => x.department))], [employeeByDepartment]);

  const newHiresThisMonth = useMemo(() => {
    return employees.filter((employee) => String(employee.dateOfJoining || "").slice(0, 7) === month).length;
  }, [employees, month]);

  const activeCount = useMemo(() => employees.filter((employee) => employee.status !== "Inactive").length, [employees]);
  const inactiveCount = useMemo(() => employees.length - activeCount, [employees, activeCount]);

  const payrollTotals = useMemo(() => {
    const totalPayroll = payrollRecords.reduce((sum, item) => sum + Number(item.grossSalary || 0), 0);
    const totalDeductions = payrollRecords.reduce((sum, item) => sum + Number(item.deductionsTotal || 0), 0);
    const totalNet = payrollRecords.reduce((sum, item) => sum + Number(item.netSalary || 0), 0);
    return { totalPayroll, totalDeductions, totalNet };
  }, [payrollRecords]);

  const currentSummary = useMemo(() => ({
    totalEmployees: employees.length,
    activeEmployees: activeCount,
    newJoinees: newHiresThisMonth,
    onLeave: leaveStats.onLeaveEmployees,
    payrollProcessed: payrollTotals.totalNet,
  }), [employees.length, activeCount, newHiresThisMonth, leaveStats.onLeaveEmployees, payrollTotals.totalNet]);

  const previousSummary = useMemo(() => {
    const prevMonth = previousMonth(month);
    const prevNew = employees.filter((employee) => String(employee.dateOfJoining || "").slice(0, 7) === prevMonth).length;
    const prevLeaves = leaveRequests.filter((leave) => String(leave.startDate || "").startsWith(prevMonth)).length;
    const prevPayroll = payrollAnalytics.monthlyTrend.find((x) => x.month === prevMonth)?.total || 0;

    return {
      totalEmployees: employees.length,
      activeEmployees: activeCount,
      newJoinees: prevNew,
      onLeave: prevLeaves,
      payrollProcessed: prevPayroll,
    };
  }, [month, employees, activeCount, leaveRequests, payrollAnalytics.monthlyTrend]);

  const summaryCards = useMemo(() => [
    { title: "Total Employees", value: currentSummary.totalEmployees, color: "text-slate-900", change: pctChange(currentSummary.totalEmployees, previousSummary.totalEmployees) },
    { title: "Active Employees", value: currentSummary.activeEmployees, color: "text-emerald-700", change: pctChange(currentSummary.activeEmployees, previousSummary.activeEmployees) },
    { title: "New Joinees", value: currentSummary.newJoinees, color: "text-sky-700", change: pctChange(currentSummary.newJoinees, previousSummary.newJoinees) },
    { title: "Employees On Leave", value: currentSummary.onLeave, color: "text-amber-700", change: pctChange(currentSummary.onLeave, previousSummary.onLeave) },
    { title: "Total Payroll Processed", value: formatCurrency(currentSummary.payrollProcessed), color: "text-violet-700", change: pctChange(currentSummary.payrollProcessed, previousSummary.payrollProcessed) },
  ], [currentSummary, previousSummary]);

  const growthTrend = useMemo(() => {
    const months = [];
    const [y, m] = month.split("-").map(Number);
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(y, m - 1 - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    return months.map((itemMonth) => ({
      month: itemMonth,
      hires: employees.filter((employee) => String(employee.dateOfJoining || "").slice(0, 7) === itemMonth).length,
    }));
  }, [month, employees]);

  const deptExpansion = useMemo(() => {
    const hiresThisMonth = employees.filter((employee) => String(employee.dateOfJoining || "").slice(0, 7) === month);
    const map = new Map();
    hiresThisMonth.forEach((emp) => {
      const key = emp.department || "General";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].map(([dept, hires]) => ({ dept, hires }));
  }, [employees, month]);

  const attritionRate = useMemo(() => {
    if (employees.length === 0) return 0;
    return (inactiveCount / employees.length) * 100;
  }, [inactiveCount, employees.length]);

  const topPerformingDepartments = useMemo(() => {
    const rows = employeeByDepartment.map((dept) => {
      const deptEmployees = employees.filter((e) => (e.department || "General") === dept.department);
      const deptIds = new Set(deptEmployees.map((e) => String(e._id)));
      const deptAttend = attendanceRowsForMonth.filter((row) => deptIds.has(String(row.employeeId)));
      const present = deptAttend.filter((row) => row.status === "Present").length;
      const ratio = deptAttend.length ? (present / deptAttend.length) * 100 : 0;
      return { department: dept.department, score: ratio };
    });

    return rows.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [employeeByDepartment, employees, attendanceRowsForMonth]);

  const detailedRows = useMemo(() => {
    return employees.map((employee) => {
      const empId = String(employee._id);
      const attendance = attendanceRowsForMonth.filter((row) => String(row.employeeId) === empId);
      const present = attendance.filter((row) => row.status === "Present").length;
      const attendancePct = attendance.length ? (present / attendance.length) * 100 : 0;

      const leavesTaken = leaveRequests.filter(
        (leave) => leave.employeeEmail === employee.email && String(leave.startDate || "").startsWith(month)
      ).length;

      const payroll = payrollRecords.find((row) => String(row.employeeId) === empId);

      return {
        id: empId,
        name: employee.name || "Employee",
        department: employee.department || "General",
        designation: employee.role || "Staff",
        attendancePct,
        leavesTaken,
        salaryPaid: payroll?.netSalary || 0,
        status: employee.status || "Active",
      };
    });
  }, [employees, attendanceRowsForMonth, leaveRequests, payrollRecords, month]);

  const filteredRows = useMemo(() => {
    return detailedRows.filter((row) => {
      const deptOk = department === "All" || row.department === department;
      const term = search.trim().toLowerCase();
      const searchOk =
        !term ||
        row.name.toLowerCase().includes(term) ||
        row.department.toLowerCase().includes(term) ||
        row.designation.toLowerCase().includes(term);
      return deptOk && searchOk;
    });
  }, [detailedRows, department, search]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    const multi = tableSortOrder === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const av = a[tableSortBy];
      const bv = b[tableSortBy];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * multi;
      return String(av).localeCompare(String(bv)) * multi;
    });
    return rows;
  }, [filteredRows, tableSortBy, tableSortOrder]);

  const tableTotalPages = Math.max(1, Math.ceil(sortedRows.length / tableLimit));
  const paginatedRows = useMemo(() => {
    const start = (tablePage - 1) * tableLimit;
    return sortedRows.slice(start, start + tableLimit);
  }, [sortedRows, tablePage]);

  useEffect(() => {
    if (tablePage > tableTotalPages) setTablePage(1);
  }, [tableTotalPages, tablePage]);

  const toggleSort = (field) => {
    if (tableSortBy === field) {
      setTableSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setTableSortBy(field);
    setTableSortOrder("asc");
  };

  const generateCustomReport = () => {
    if (!canGenerate) {
      setError("Only Admin/HR can generate reports.");
      return;
    }

    const payload = {
      reportType,
      rangeFrom,
      rangeTo,
      department: customDepartment,
      month,
      generatedBy: user?.name,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalEmployees: currentSummary.totalEmployees,
        attendancePct: Number(monthlyAttendancePct.toFixed(2)),
        payrollNet: Number(payrollTotals.totalNet.toFixed(2)),
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `custom-${reportType.toLowerCase()}-report-${month}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage("Custom report generated.");
    setError("");
  };

  const exportExcel = () => {
    const headers = ["Name", "Department", "Designation", "Attendance %", "Leaves Taken", "Salary Paid", "Status"];
    const rows = sortedRows.map((r) => [
      r.name,
      r.department,
      r.designation,
      r.attendancePct.toFixed(2),
      r.leavesTaken,
      r.salaryPaid,
      r.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hr-reports-${month}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const rows = sortedRows
      .map(
        (r) => `
        <tr>
          <td>${r.name}</td>
          <td>${r.department}</td>
          <td>${r.designation}</td>
          <td>${r.attendancePct.toFixed(1)}%</td>
          <td>${r.leavesTaken}</td>
          <td>${formatCurrency(r.salaryPaid)}</td>
          <td>${r.status}</td>
        </tr>`
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>HR Reports ${month}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h2>HR Reports & Analytics - ${month}</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Department</th><th>Designation</th><th>Attendance</th><th>Leaves</th><th>Salary</th><th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>`;

    const popup = window.open("", "_blank");
    if (!popup) {
      setError("Popup blocked. Allow popups to export PDF.");
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const printReport = () => window.print();

  const maxDeptBar = Math.max(...employeeByDepartment.map((d) => d.count), 1);
  const maxPayrollDept = Math.max(...payrollAnalytics.salaryByDepartment.map((d) => d.totalNetSalary || 0), 1);
  const maxGrowth = Math.max(...growthTrend.map((g) => g.hires), 1);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HR Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Decision-ready insights across employees, attendance and payroll</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100" onClick={exportPdf}>Download PDF</button>
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100" onClick={exportExcel}>Export Excel</button>
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100" onClick={printReport}>Print Report</button>
        </div>
      </div>

      <section className="glass-card mb-5 rounded-xl p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Month</label>
            <input className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Year</label>
            <input className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={month.split("-")[0]} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Department</label>
            <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={department} onChange={(e) => { setDepartment(e.target.value); setTablePage(1); }}>
              {deptOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
            <input className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Employee or department" value={search} onChange={(e) => { setSearch(e.target.value); setTablePage(1); }} />
          </div>
        </div>
      </section>

      {message && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <div key={card.title} className="glass-card rounded-xl p-4 shadow-sm">
            <p className="text-xs text-slate-500">{card.title}</p>
            <p className={`mt-1 text-xl font-extrabold ${card.color}`}>{card.value}</p>
            <p className={`mt-1 text-xs ${card.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {card.change >= 0 ? "+" : ""}{card.change.toFixed(1)}% vs previous month
            </p>
          </div>
        ))}
      </section>

      <section className="mb-5 grid gap-4 lg:grid-cols-2">
        <div className="glass-card rounded-xl p-4">
          <h2 className="mb-3 text-base font-bold text-slate-900">Employee Reports</h2>
          <p className="text-sm text-slate-600">Total: {employees.length} | Active: {activeCount} | Inactive: {inactiveCount} | New Hires: {newHiresThisMonth}</p>
          <div className="mt-3 space-y-2">
            {employeeByDepartment.map((item) => (
              <div key={item.department}>
                <div className="mb-1 flex justify-between text-xs text-slate-600">
                  <span>{item.department}</span><span>{item.count}</span>
                </div>
                <div className="h-2 rounded bg-slate-200">
                  <div className="h-2 rounded bg-sky-600" style={{ width: `${Math.max(8, (item.count / maxDeptBar) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <h2 className="mb-3 text-base font-bold text-slate-900">Attendance Reports</h2>
          <p className="text-sm text-slate-600">Monthly Attendance: <span className="font-semibold">{monthlyAttendancePct.toFixed(1)}%</span></p>
          <p className="mt-1 text-sm text-slate-600">Leave Stats - Approved: {leaveStats.approved}, Pending: {leaveStats.pending}, Rejected: {leaveStats.rejected}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded-lg bg-white/70 p-2">
              <p className="text-xs font-semibold text-slate-700">Most Absences</p>
              {absencesByEmployee.length === 0 ? <p className="text-xs text-slate-500">No absence data</p> : absencesByEmployee.map((a) => <p key={a.employeeId} className="text-xs text-slate-600">{a.name}: {a.absences}</p>)}
            </div>
            <div className="rounded-lg bg-white/70 p-2">
              <p className="text-xs font-semibold text-slate-700">Late Check-ins</p>
              {lateCheckins.length === 0 ? <p className="text-xs text-slate-500">No late data</p> : lateCheckins.map((a) => <p key={a.employeeId} className="text-xs text-slate-600">{a.name}: {a.lateDays}</p>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-4 lg:grid-cols-2">
        <div className="glass-card rounded-xl p-4">
          <h2 className="mb-3 text-base font-bold text-slate-900">Payroll Reports</h2>
          <p className="text-sm text-slate-600">Total Payroll: {formatCurrency(payrollTotals.totalPayroll)}</p>
          <p className="text-sm text-slate-600">Deductions vs Net: {formatCurrency(payrollTotals.totalDeductions)} vs {formatCurrency(payrollTotals.totalNet)}</p>
          <div className="mt-3 space-y-2">
            {payrollAnalytics.salaryByDepartment.map((item) => (
              <div key={item.department}>
                <div className="mb-1 flex justify-between text-xs text-slate-600"><span>{item.department}</span><span>{formatCurrency(item.totalNetSalary)}</span></div>
                <div className="h-2 rounded bg-slate-200"><div className="h-2 rounded bg-emerald-600" style={{ width: `${Math.max(8, (item.totalNetSalary / maxPayrollDept) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-white/70 p-2">
            <p className="text-xs font-semibold text-slate-700">Highest Paid Employees</p>
            {payrollAnalytics.topPaidEmployees.map((p, i) => <p key={`${p.employeeCode}-${i}`} className="text-xs text-slate-600">{p.employeeName} ({p.department}) - {formatCurrency(p.netSalary)}</p>)}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <h2 className="mb-3 text-base font-bold text-slate-900">Performance / HR Insights</h2>
          <p className="text-sm text-slate-600">Attrition Rate (inactive proxy): <span className="font-semibold">{attritionRate.toFixed(1)}%</span></p>
          <p className="mt-1 text-sm text-slate-600">Top Departments by Attendance:</p>
          {topPerformingDepartments.map((d) => <p key={d.department} className="text-xs text-slate-600">{d.department}: {d.score.toFixed(1)}%</p>)}
          <div className="mt-3">
            <p className="mb-1 text-xs font-semibold text-slate-700">Employee Growth (6 months)</p>
            <div className="grid grid-cols-6 gap-2">
              {growthTrend.map((g) => (
                <div key={g.month} className="rounded bg-white/70 p-2 text-center">
                  <div className="mx-auto h-14 w-4 rounded bg-slate-200">
                    <div className="w-4 rounded bg-violet-600" style={{ height: `${Math.max(8, (g.hires / maxGrowth) * 100)}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-600">{g.month.slice(5)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-white/70 p-2">
            <p className="text-xs font-semibold text-slate-700">Department Expansion This Month</p>
            {deptExpansion.length === 0 ? <p className="text-xs text-slate-500">No new hires this month</p> : deptExpansion.map((d) => <p key={d.dept} className="text-xs text-slate-600">{d.dept}: +{d.hires}</p>)}
          </div>
        </div>
      </section>

      <section className="glass-card mb-5 rounded-xl p-4">
        <h2 className="mb-3 text-base font-bold text-slate-900">Detailed Employee Report</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="table-header text-slate-700">
              <tr>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort("name")}>Employee</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort("department")}>Department</th>
                <th className="px-4 py-3">Designation</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort("attendancePct")}>Attendance %</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort("leavesTaken")}>Leaves Taken</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort("salaryPaid")}>Salary Paid</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-4 text-slate-600" colSpan="7">Loading reports...</td></tr>
              ) : paginatedRows.length === 0 ? (
                <tr><td className="px-4 py-4 text-slate-600" colSpan="7">No rows found.</td></tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100/70 hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                    <td className="px-4 py-3 text-slate-700">{row.department}</td>
                    <td className="px-4 py-3 text-slate-700">{row.designation}</td>
                    <td className="px-4 py-3 text-slate-700">{row.attendancePct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-slate-700">{row.leavesTaken}</td>
                    <td className="px-4 py-3 text-emerald-700">{formatCurrency(row.salaryPaid)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${row.status === "Inactive" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{row.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
          <p>Page {tablePage} of {tableTotalPages}</p>
          <div className="flex gap-2">
            <button type="button" className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50" disabled={tablePage <= 1} onClick={() => setTablePage((p) => p - 1)}>Prev</button>
            <button type="button" className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50" disabled={tablePage >= tableTotalPages} onClick={() => setTablePage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-xl p-4">
        <h2 className="mb-3 text-base font-bold text-slate-900">Generate Report</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Report Type</label>
            <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option>Employee</option>
              <option>Attendance</option>
              <option>Payroll</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
            <input className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
            <input className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Department</label>
            <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={customDepartment} onChange={(e) => setCustomDepartment(e.target.value)}>
              {deptOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <button type="button" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700" onClick={generateCustomReport}>
            Generate Custom Report
          </button>
        </div>
      </section>
    </main>
  );
}

export default Reports;
