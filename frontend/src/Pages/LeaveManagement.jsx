import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const LOCAL_LEAVES_KEY = "hrms_leave_requests";

const initialForm = {
  type: "Casual",
  startDate: "",
  endDate: "",
  reason: "",
};

function LeaveManagement() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLeaveStorageLoaded, setIsLeaveStorageLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_LEAVES_KEY);
    if (!saved) {
      setIsLeaveStorageLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      setLeaveRequests(Array.isArray(parsed) ? parsed : []);
    } catch {
      setLeaveRequests([]);
    } finally {
      setIsLeaveStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLeaveStorageLoaded) return;
    localStorage.setItem(LOCAL_LEAVES_KEY, JSON.stringify(leaveRequests));
  }, [leaveRequests, isLeaveStorageLoaded]);

  const stats = useMemo(() => {
    const pending = leaveRequests.filter((leave) => leave.status === "Pending").length;
    const approved = leaveRequests.filter((leave) => leave.status === "Approved").length;
    const rejected = leaveRequests.filter((leave) => leave.status === "Rejected").length;
    return { pending, approved, rejected, total: leaveRequests.length };
  }, [leaveRequests]);

  const visibleLeaves = useMemo(() => {
    if (statusFilter === "All") return leaveRequests;
    return leaveRequests.filter((leave) => leave.status === statusFilter);
  }, [leaveRequests, statusFilter]);

  const handleSubmitLeave = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!formData.startDate || !formData.endDate || !formData.reason) {
      setError("Please fill all fields.");
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError("End date cannot be before start date.");
      return;
    }

    const newLeave = {
      id: `leave-${Date.now()}`,
      employeeName: user?.name || "Unknown User",
      employeeEmail: user?.email || "unknown@example.com",
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason.trim(),
      status: "Pending",
      createdAt: new Date().toISOString(),
      actionBy: null,
    };

    setLeaveRequests((prev) => [newLeave, ...prev]);
    setShowForm(false);
    setFormData(initialForm);
    setMessage("Leave request submitted and set to Pending.");
  };

  const handleDecision = (id, status) => {
    setError("");
    setMessage("");

    setLeaveRequests((prev) =>
      prev.map((leave) =>
        leave.id === id
          ? {
              ...leave,
              status,
              actionBy: user?.name || "Admin",
              actionAt: new Date().toISOString(),
            }
          : leave
      )
    );

    setMessage(`Leave request ${status.toLowerCase()}.`);
  };

  const statusBadgeClass = (status) => {
    if (status === "Approved") return "bg-emerald-100 text-emerald-700";
    if (status === "Rejected") return "bg-rose-100 text-rose-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leave Management</h1>
          <p className="text-sm text-slate-500">
            Apply leave and manage Pending, Approved, and Rejected requests
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          onClick={() => {
            setShowForm((prev) => !prev);
            setError("");
            setMessage("");
          }}
        >
          {showForm ? "Close Form" : "Apply for Leave"}
        </button>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        <div className="glass-card rounded-lg p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
          <p className="text-lg font-extrabold text-slate-900">{stats.total}</p>
        </div>
        <div className="glass-card rounded-lg p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
          <p className="text-lg font-extrabold text-amber-700">{stats.pending}</p>
        </div>
        <div className="glass-card rounded-lg p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Approved</p>
          <p className="text-lg font-extrabold text-emerald-700">{stats.approved}</p>
        </div>
        <div className="glass-card rounded-lg p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Rejected</p>
          <p className="text-lg font-extrabold text-rose-700">{stats.rejected}</p>
        </div>
      </div>

      {showForm && (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Apply for Leave</h2>
          <form onSubmit={handleSubmitLeave} className="grid gap-3 md:grid-cols-2">
            <select
              className={inputClass}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option>Casual</option>
              <option>Sick</option>
              <option>Annual</option>
              <option>Unpaid</option>
            </select>
            <input
              className={inputClass}
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <input
              className={inputClass}
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
            <textarea
              className={`${inputClass} md:col-span-2`}
              placeholder="Reason for leave"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
                onClick={() => setShowForm(false)}
              >
                Close
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Submit Request
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700">Filter:</span>
        {["All", "Pending", "Approved", "Rejected"].map((status) => (
          <button
            key={status}
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusFilter === status
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </button>
        ))}
      </section>

      {message && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <section className="grid gap-4">
        {visibleLeaves.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            No leave requests found.
          </div>
        ) : (
          visibleLeaves.map((leave) => (
            <div key={leave.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{leave.employeeName}</p>
                  <p className="text-xs text-slate-500">{leave.employeeEmail}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(leave.status)}`}>
                  {leave.status}
                </span>
              </div>

              <p className="text-sm text-slate-700">
                <span className="font-medium">{leave.type}</span> leave
              </p>
              <p className="text-sm text-slate-600">
                From: {leave.startDate} | To: {leave.endDate}
              </p>
              <p className="mt-1 text-sm text-slate-600">Reason: {leave.reason}</p>
              {leave.actionBy && (
                <p className="mt-1 text-xs text-slate-500">
                  Action by: {leave.actionBy}
                </p>
              )}

              {leave.status === "Pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100"
                    onClick={() => handleDecision(leave.id, "Approved")}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="rounded bg-rose-600 px-3 py-1 text-xs text-white hover:bg-rose-700"
                    onClick={() => handleDecision(leave.id, "Rejected")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </main>
  );
}

export default LeaveManagement;
