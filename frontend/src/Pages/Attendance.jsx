import { useEffect, useMemo, useState } from "react";
import { employeeAPI } from "../services/api";

const LOCAL_ADDED_EMPLOYEES_KEY = "hrms_local_employees";
const LOCAL_REMOVED_EMPLOYEE_IDS_KEY = "hrms_removed_employee_ids";
const LOCAL_ATTENDANCE_KEY = "hrms_attendance_by_date";

const pad = (value) => String(value).padStart(2, "0");
const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const formatDateWithDay = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const toDateOnly = (isoDate) => new Date(`${isoDate}T00:00:00`);

const isPastDate = (isoDate) => {
  const selected = toDateOnly(isoDate);
  const today = toDateOnly(todayIso());
  return selected < today;
};

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const generatedStatusForEmployee = (employee, isoDate) => {
  if (employee.status === "Inactive" && isPastDate(isoDate)) {
    return "Absent";
  }

  if (isPastDate(isoDate)) {
    // Deterministic 18% absence for active employees on past dates.
    const score = hashString(`${employee._id}-${isoDate}`) % 100;
    return score < 18 ? "Absent" : "Present";
  }

  return "Present";
};

function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedAttendance = localStorage.getItem(LOCAL_ATTENDANCE_KEY);
    if (savedAttendance) {
      try {
        const parsed = JSON.parse(savedAttendance);
        setAttendanceMap(parsed && typeof parsed === "object" ? parsed : {});
      } catch {
        setAttendanceMap({});
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_ATTENDANCE_KEY, JSON.stringify(attendanceMap));
  }, [attendanceMap]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await employeeAPI.getAll();
        const backendEmployees = Array.isArray(response.data) ? response.data : [];

        const localAddedRaw = localStorage.getItem(LOCAL_ADDED_EMPLOYEES_KEY);
        const removedIdsRaw = localStorage.getItem(LOCAL_REMOVED_EMPLOYEE_IDS_KEY);

        const localAdded = localAddedRaw ? JSON.parse(localAddedRaw) : [];
        const removedIds = removedIdsRaw ? JSON.parse(removedIdsRaw) : [];

        const visibleBackend = backendEmployees.filter(
          (employee) => !removedIds.includes(employee._id)
        );
        const merged = [...(Array.isArray(localAdded) ? localAdded : []), ...visibleBackend];

        setEmployees(merged);
      } catch {
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    if (loading || employees.length === 0) return;

    setAttendanceMap((prev) => {
      if (prev[selectedDate]) return prev;

      const initialForDate = employees.map((employee) => ({
        employeeId: employee._id,
        name: employee.name,
        email: employee.email,
        department: employee.department || "-",
        status: generatedStatusForEmployee(employee, selectedDate),
      }));

      return { ...prev, [selectedDate]: initialForDate };
    });
  }, [selectedDate, employees, loading]);

  const attendanceForDate = useMemo(() => {
    return Array.isArray(attendanceMap[selectedDate]) ? attendanceMap[selectedDate] : [];
  }, [attendanceMap, selectedDate]);

  const stats = useMemo(() => {
    const present = attendanceForDate.filter((row) => row.status === "Present").length;
    const absent = attendanceForDate.filter((row) => row.status === "Absent").length;
    return { present, absent, total: attendanceForDate.length };
  }, [attendanceForDate]);

  const updateStatus = (employeeId, status) => {
    setAttendanceMap((prev) => {
      const rows = Array.isArray(prev[selectedDate]) ? prev[selectedDate] : [];
      const updatedRows = rows.map((row) =>
        row.employeeId === employeeId ? { ...row, status } : row
      );
      return { ...prev, [selectedDate]: updatedRows };
    });
    setMessage(`Saved for ${formatDateWithDay(selectedDate)} in local storage.`);
  };

  const setAllStatus = (status) => {
    setAttendanceMap((prev) => {
      const rows = Array.isArray(prev[selectedDate]) ? prev[selectedDate] : [];
      const updatedRows = rows.map((row) => ({ ...row, status }));
      return { ...prev, [selectedDate]: updatedRows };
    });
    setMessage(`All employees marked ${status} for ${formatDateWithDay(selectedDate)}.`);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
      <p className="mb-4 text-sm text-slate-500">
        Select a date (day/month/year), then mark all employees Present or Absent. Data is stored in local storage only.
      </p>

      <section className="glass-card mb-5 rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Select Date</label>
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              type="date"
              value={selectedDate}
              aria-label="Select attendance date"
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setMessage("");
              }}
            />
          </div>
          <p className="text-sm font-medium text-slate-700">{formatDateWithDay(selectedDate)}</p>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-100"
            onClick={() => setAllStatus("Present")}
          >
            Mark All Present
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-100"
            onClick={() => setAllStatus("Absent")}
          >
            Mark All Absent
          </button>
        </div>
      </section>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Employees</p>
          <p className="text-2xl font-extrabold text-slate-900">{stats.total}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Present</p>
          <p className="text-2xl font-extrabold text-emerald-700">{stats.present}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Absent</p>
          <p className="text-2xl font-extrabold text-rose-700">{stats.absent}</p>
        </div>
      </div>

      {message && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      <section className="glass-card overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="table-header text-slate-700">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-slate-600" colSpan="5">
                    Loading employees...
                  </td>
                </tr>
              ) : attendanceForDate.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-600" colSpan="5">
                    No employees found for attendance.
                  </td>
                </tr>
              ) : (
                attendanceForDate.map((row) => (
                  <tr key={row.employeeId} className="border-t border-slate-100/70">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                    <td className="px-4 py-3 text-slate-700">{row.email || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{row.department || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`rounded px-3 py-1 text-xs font-medium ${
                            row.status === "Present"
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                          aria-label={`Mark ${row.name} as present`}
                          onClick={() => updateStatus(row.employeeId, "Present")}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          className={`rounded px-3 py-1 text-xs font-medium ${
                            row.status === "Absent"
                              ? "bg-rose-600 text-white"
                              : "bg-rose-100 text-rose-700"
                          }`}
                          aria-label={`Mark ${row.name} as absent`}
                          onClick={() => updateStatus(row.employeeId, "Absent")}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default Attendance;
