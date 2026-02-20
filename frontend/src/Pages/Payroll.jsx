import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { payrollAPI } from "../services/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const currentMonth = () => new Date().toISOString().slice(0, 7);

const calcPayroll = (form) => {
  const basicPay = Number(form.basicPay || 0);
  const hra = Number(form.hra || 0);
  const bonus = Number(form.bonus || 0);
  const overtimePay = Number(form.overtimePay || 0);
  const additionalAllowances = Number(form.additionalAllowances || 0);
  const taxPercent = Number(form.taxPercent || 0);
  const pfDeduction = Number(form.pfDeduction || 0);
  const leaveDeduction = Number(form.leaveDeduction || 0);
  const loanDeduction = Number(form.loanDeduction || 0);
  const otherDeductions = Number(form.otherDeductions || 0);

  const allowancesTotal = hra + bonus + overtimePay + additionalAllowances;
  const grossSalary = basicPay + allowancesTotal;
  const taxAmount = (grossSalary * taxPercent) / 100;
  const deductionsTotal = taxAmount + pfDeduction + leaveDeduction + loanDeduction + otherDeductions;
  const netSalary = Math.max(0, grossSalary - deductionsTotal);

  return { grossSalary, deductionsTotal, netSalary, allowancesTotal };
};

function Payroll() {
  const { user } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [department, setDepartment] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("employeeName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({
    totalEmployeesPaid: 0,
    totalPayrollAmount: 0,
    totalDeductions: 0,
    netSalaryPaid: 0,
    pendingPaymentsCount: 0,
  });
  const [analytics, setAnalytics] = useState({
    salaryByDepartment: [],
    monthlyTrend: [],
    topPaidEmployees: [],
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [payslipRecord, setPayslipRecord] = useState(null);

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  const isAdmin = user?.role === "Admin";

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { month, department, search, sortBy, sortOrder, page, limit };
      const [recordsRes, summaryRes, analyticsRes] = await Promise.all([
        payrollAPI.getRecords(params),
        payrollAPI.getSummary({ month }),
        payrollAPI.getAnalytics({ month }),
      ]);

      const recordsPayload = recordsRes.data || {};
      setRecords(recordsPayload.records || []);
      setPagination({
        total: recordsPayload.total || 0,
        totalPages: recordsPayload.totalPages || 1,
      });

      setSummary(summaryRes.data?.summary || {
        totalEmployeesPaid: 0,
        totalPayrollAmount: 0,
        totalDeductions: 0,
        netSalaryPaid: 0,
        pendingPaymentsCount: 0,
      });

      setAnalytics(analyticsRes.data?.analytics || {
        salaryByDepartment: [],
        monthlyTrend: [],
        topPaidEmployees: [],
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payroll data.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, department, search, sortBy, sortOrder, page]);

  const departmentOptions = useMemo(() => {
    const all = analytics.salaryByDepartment.map((item) => item.department).filter(Boolean);
    return ["All", ...new Set(all)];
  }, [analytics.salaryByDepartment]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const processPayroll = async () => {
    setError("");
    setMessage("");
    try {
      const response = await payrollAPI.processPayroll({ month });
      setMessage(response.data?.message || "Payroll processed.");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process payroll.");
    }
  };

  const openConfigure = (record) => {
    setEditRecord(record);
    setEditForm({
      basicPay: record.basicPay || 0,
      hra: record.hra || 0,
      bonus: record.bonus || 0,
      overtimePay: record.overtimePay || 0,
      additionalAllowances: record.additionalAllowances || 0,
      taxPercent: record.taxPercent || 0,
      pfDeduction: record.pfDeduction || 0,
      leaveDeduction: record.leaveDeduction || 0,
      loanDeduction: record.loanDeduction || 0,
      otherDeductions: record.otherDeductions || 0,
    });
  };

  const saveConfiguration = async (e) => {
    e.preventDefault();
    if (!editRecord || !editForm) return;

    setError("");
    setMessage("");
    try {
      await payrollAPI.updateComponents(editRecord._id, editForm);
      setMessage("Salary configuration updated.");
      setEditRecord(null);
      setEditForm(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update salary configuration.");
    }
  };

  const updateStatus = async (record, status) => {
    setError("");
    setMessage("");
    try {
      await payrollAPI.updateStatus(record._id, { status });
      setMessage(`Updated ${record.employeeName} to ${status}.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update payment status.");
    }
  };

  const openPayslip = async (record) => {
    setError("");
    try {
      const response = await payrollAPI.getPayslip(record._id);
      setPayslipRecord(response.data?.payslip?.record || record);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payslip.");
    }
  };

  const downloadPayslip = (record) => {
    const html = `
      <html>
        <head>
          <title>Payslip ${record.employeeCode} ${record.month}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            .head { display: flex; justify-content: space-between; margin-bottom: 16px; }
            .logo { background: #059669; color: white; padding: 8px 12px; border-radius: 6px; font-weight: 700; }
            .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 10px; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
            .total { font-size: 16px; font-weight: 700; color: #047857; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="head">
            <div>
              <h2 style="margin:0;">HRMS Payslip</h2>
              <p style="margin:4px 0 0 0;">Month: ${record.month}</p>
            </div>
            <div class="logo">HRMS</div>
          </div>
          <div class="box">
            <div class="row"><span>Employee</span><span>${record.employeeName}</span></div>
            <div class="row"><span>Employee ID</span><span>${record.employeeCode}</span></div>
            <div class="row"><span>Department</span><span>${record.department}</span></div>
            <div class="row"><span>Designation</span><span>${record.designation}</span></div>
          </div>
          <div class="box">
            <h4 style="margin:0 0 8px 0;">Earnings</h4>
            <div class="row"><span>Basic Pay</span><span>${formatCurrency(record.basicPay)}</span></div>
            <div class="row"><span>Allowances</span><span>${formatCurrency(record.allowancesTotal)}</span></div>
            <div class="row"><span>Gross Salary</span><span>${formatCurrency(record.grossSalary)}</span></div>
          </div>
          <div class="box">
            <h4 style="margin:0 0 8px 0;">Deductions</h4>
            <div class="row"><span>Total Deductions</span><span>${formatCurrency(record.deductionsTotal)}</span></div>
            <div class="row"><span>Status</span><span>${record.status}</span></div>
            <div class="total">Net Payable: ${formatCurrency(record.netSalary)}</div>
          </div>
        </body>
      </html>`;

    const popup = window.open("", "_blank");
    if (!popup) {
      setError("Popup blocked. Allow popups for payslip PDF.");
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const exportExcel = () => {
    if (records.length === 0) {
      setError("No records to export.");
      return;
    }

    const headers = [
      "Employee Name",
      "Employee ID",
      "Department",
      "Designation",
      "Basic Pay",
      "Allowances",
      "Deductions",
      "Net Salary",
      "Status",
    ];

    const lines = records.map((record) => [
      record.employeeName,
      record.employeeCode,
      record.department,
      record.designation,
      record.basicPay,
      record.allowancesTotal,
      record.deductionsTotal,
      record.netSalary,
      record.status,
    ]);

    const csv = [headers, ...lines]
      .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${month}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    if (records.length === 0) {
      setError("No records to export.");
      return;
    }

    const rows = records
      .map(
        (record) => `
          <tr>
            <td>${record.employeeName}</td>
            <td>${record.employeeCode}</td>
            <td>${record.department}</td>
            <td>${record.designation}</td>
            <td>${formatCurrency(record.netSalary)}</td>
            <td>${record.status}</td>
          </tr>`
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Payroll ${month}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h2>Payroll Report - ${month}</h2>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Net Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>`;

    const popup = window.open("", "_blank");
    if (!popup) {
      setError("Popup blocked. Allow popups for PDF export.");
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const downloadPayslipsBulk = () => {
    if (records.length === 0) {
      setError("No payslips available for bulk download.");
      return;
    }

    const content = records
      .map(
        (record) =>
          `${record.employeeName} (${record.employeeCode}) | ${record.month} | Net: ${formatCurrency(record.netSalary)} | Status: ${record.status}`
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk-payslips-${month}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const maxDeptValue = Math.max(...analytics.salaryByDepartment.map((item) => item.totalNetSalary || 0), 1);
  const maxTrendValue = Math.max(...analytics.monthlyTrend.map((item) => item.total || 0), 1);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll Management</h1>
          <p className="text-sm text-slate-500">Comprehensive salary, deductions, payslip and payout management</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100" onClick={exportPdf}>Export PDF</button>
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100" onClick={exportExcel}>Export Excel</button>
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100" onClick={downloadPayslipsBulk}>Bulk Payslips</button>
          {isAdmin && (
            <button type="button" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700" onClick={processPayroll}>
              Process Payroll
            </button>
          )}
        </div>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="glass-card rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">?? Total Employees Paid</p>
          <p className="mt-1 text-xl font-extrabold text-emerald-700">{summary.totalEmployeesPaid}</p>
        </div>
        <div className="glass-card rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">?? Total Payroll Amount</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">{formatCurrency(summary.totalPayrollAmount)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">?? Total Deductions</p>
          <p className="mt-1 text-xl font-extrabold text-rose-700">{formatCurrency(summary.totalDeductions)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">? Net Salary Paid</p>
          <p className="mt-1 text-xl font-extrabold text-emerald-700">{formatCurrency(summary.netSalaryPaid)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">? Pending Payments</p>
          <p className="mt-1 text-xl font-extrabold text-amber-600">{summary.pendingPaymentsCount}</p>
        </div>
      </section>

      <section className="glass-card mb-5 rounded-xl p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Month/Year</label>
            <input className={inputClass} type="month" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Department</label>
            <select className={inputClass} value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }}>
              {departmentOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
            <input
              className={inputClass}
              type="text"
              placeholder="Search by name, ID, designation"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </section>

      {message && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <section className="glass-card overflow-hidden rounded-xl">
        <div className="max-h-[560px] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="table-header sticky top-0 z-10 text-slate-700">
              <tr>
                <th className="px-4 py-3">Employee Name</th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => handleSort("department")}>Department</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Basic Pay</th>
                <th className="px-4 py-3">Allowances</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => handleSort("netSalary")}>Net Salary</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-slate-600" colSpan="10">Loading payroll data...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-600" colSpan="10">No payroll records found.</td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">{record.employeeName}</td>
                    <td className="px-4 py-3 text-slate-700">{record.employeeCode}</td>
                    <td className="px-4 py-3 text-slate-700">{record.department}</td>
                    <td className="px-4 py-3 text-slate-700">{record.designation}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(record.basicPay)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(record.allowancesTotal)}</td>
                    <td className="px-4 py-3 text-rose-700">{formatCurrency(record.deductionsTotal)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(record.netSalary)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          record.status === "Paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : record.status === "On Hold"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {isAdmin && (
                          <button type="button" className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100" onClick={() => openConfigure(record)}>
                            Configure Salary
                          </button>
                        )}
                        <button type="button" className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100" onClick={() => openPayslip(record)}>
                          Generate Payslip
                        </button>
                        {isAdmin && (
                          <>
                            <button type="button" className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700" onClick={() => updateStatus(record, "Paid")}>
                              Mark as Paid
                            </button>
                            <button type="button" className="rounded bg-orange-500 px-2 py-1 text-xs text-white hover:bg-orange-600" onClick={() => updateStatus(record, "On Hold")}>
                              On Hold
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
          <p>Showing page {page} of {pagination.totalPages} ({pagination.total} records)</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="glass-card rounded-xl p-4 lg:col-span-2">
          <h2 className="mb-3 text-base font-bold text-slate-900">Salary Distribution by Department</h2>
          <div className="space-y-3">
            {analytics.salaryByDepartment.length === 0 ? (
              <p className="text-sm text-slate-500">No analytics data available.</p>
            ) : (
              analytics.salaryByDepartment.map((item) => (
                <div key={item.department}>
                  <div className="mb-1 flex justify-between text-xs text-slate-600">
                    <span>{item.department}</span>
                    <span>{formatCurrency(item.totalNetSalary)}</span>
                  </div>
                  <div className="h-2 rounded bg-slate-200">
                    <div
                      className="h-2 rounded bg-emerald-600"
                      style={{ width: `${Math.max(6, (item.totalNetSalary / maxDeptValue) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <h2 className="mb-3 text-base font-bold text-slate-900">Top 5 Highest Paid</h2>
          <div className="space-y-2">
            {analytics.topPaidEmployees.length === 0 ? (
              <p className="text-sm text-slate-500">No records</p>
            ) : (
              analytics.topPaidEmployees.map((item, idx) => (
                <div key={`${item.employeeCode}-${idx}`} className="rounded-lg bg-white/70 p-2 text-xs">
                  <p className="font-semibold text-slate-900">{idx + 1}. {item.employeeName}</p>
                  <p className="text-slate-600">{item.department} | {item.employeeCode}</p>
                  <p className="font-semibold text-emerald-700">{formatCurrency(item.netSalary)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="glass-card mt-4 rounded-xl p-4">
        <h2 className="mb-3 text-base font-bold text-slate-900">Monthly Payroll Expense Trend</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {analytics.monthlyTrend.length === 0 ? (
            <p className="text-sm text-slate-500">No trend data available.</p>
          ) : (
            analytics.monthlyTrend.map((item) => (
              <div key={item.month} className="rounded-lg bg-white/70 p-3">
                <p className="text-xs text-slate-600">{item.month}</p>
                <div className="mt-2 h-20 rounded bg-slate-200">
                  <div
                    className="w-full rounded bg-teal-600"
                    style={{ height: `${Math.max(10, (item.total / maxTrendValue) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs font-medium text-slate-800">{formatCurrency(item.total)}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {editRecord && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-3xl rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Salary Configuration</h2>
            <p className="mt-1 text-sm text-slate-600">{editRecord.employeeName} ({editRecord.employeeCode})</p>

            <form onSubmit={saveConfiguration} className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ["basicPay", "Basic Pay"],
                ["hra", "HRA"],
                ["bonus", "Bonus"],
                ["overtimePay", "Overtime"],
                ["additionalAllowances", "Additional Allowances"],
                ["taxPercent", "Tax %"],
                ["pfDeduction", "PF Deduction"],
                ["leaveDeduction", "Leave Deduction"],
                ["loanDeduction", "Loan Deduction"],
                ["otherDeductions", "Other Deductions"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    value={editForm[key]}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                  />
                </div>
              ))}

              <div className="md:col-span-3 rounded-lg bg-slate-50 p-3 text-sm">
                {(() => {
                  const calc = calcPayroll(editForm);
                  return (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <p>Gross Salary: <span className="font-semibold">{formatCurrency(calc.grossSalary)}</span></p>
                      <p>Total Deductions: <span className="font-semibold text-rose-700">{formatCurrency(calc.deductionsTotal)}</span></p>
                      <p>Net Salary: <span className="font-semibold text-emerald-700">{formatCurrency(calc.netSalary)}</span></p>
                    </div>
                  );
                })()}
              </div>

              <div className="md:col-span-3 flex justify-end gap-2">
                <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100" onClick={() => { setEditRecord(null); setEditForm(null); }}>
                  Close
                </button>
                <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payslipRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Payslip Preview</h2>
                <p className="text-sm text-slate-600">{payslipRecord.month}</p>
              </div>
              <div className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white">HRMS</div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 text-sm">
              <p><span className="font-medium">Employee:</span> {payslipRecord.employeeName}</p>
              <p><span className="font-medium">ID:</span> {payslipRecord.employeeCode}</p>
              <p><span className="font-medium">Department:</span> {payslipRecord.department}</p>
              <p><span className="font-medium">Designation:</span> {payslipRecord.designation}</p>
              <hr className="my-3" />
              <p><span className="font-medium">Basic:</span> {formatCurrency(payslipRecord.basicPay)}</p>
              <p><span className="font-medium">Allowances:</span> {formatCurrency(payslipRecord.allowancesTotal)}</p>
              <p><span className="font-medium">Deductions:</span> {formatCurrency(payslipRecord.deductionsTotal)}</p>
              <p className="mt-2 text-base font-bold text-emerald-700">Net Pay: {formatCurrency(payslipRecord.netSalary)}</p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100" onClick={() => setPayslipRecord(null)}>
                Close
              </button>
              <button type="button" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700" onClick={() => downloadPayslip(payslipRecord)}>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Payroll;
