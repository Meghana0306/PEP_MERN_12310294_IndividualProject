import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { employeeAPI } from "../services/api";

const DEFAULT_DEPARTMENTS = ["HR", "Engineering", "Finance", "Sales", "Operations"];
const LOCAL_ADDED_EMPLOYEES_KEY = "hrms_local_employees";
const LOCAL_REMOVED_EMPLOYEE_IDS_KEY = "hrms_removed_employee_ids";

const initialAddForm = {
  name: "",
  email: "",
  phone: "",
  department: DEFAULT_DEPARTMENTS[0],
};

function Employee() {
  const location = useLocation();
  const [backendEmployees, setBackendEmployees] = useState([]);
  const [localEmployees, setLocalEmployees] = useState([]);
  const [removedEmployeeIds, setRemovedEmployeeIds] = useState([]);
  const [isEmployeeStorageLoaded, setIsEmployeeStorageLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDepartments, setShowDepartments] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [quickRemoveId, setQuickRemoveId] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(initialAddForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

  useEffect(() => {
    const savedLocalEmployees = localStorage.getItem(LOCAL_ADDED_EMPLOYEES_KEY);
    const savedRemovedIds = localStorage.getItem(LOCAL_REMOVED_EMPLOYEE_IDS_KEY);

    if (savedLocalEmployees) {
      try {
        const parsed = JSON.parse(savedLocalEmployees);
        setLocalEmployees(Array.isArray(parsed) ? parsed : []);
      } catch {
        setLocalEmployees([]);
      }
    }

    if (savedRemovedIds) {
      try {
        const parsed = JSON.parse(savedRemovedIds);
        setRemovedEmployeeIds(Array.isArray(parsed) ? parsed : []);
      } catch {
        setRemovedEmployeeIds([]);
      }
    }

    setIsEmployeeStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!isEmployeeStorageLoaded) return;
    localStorage.setItem(LOCAL_ADDED_EMPLOYEES_KEY, JSON.stringify(localEmployees));
  }, [localEmployees, isEmployeeStorageLoaded]);

  useEffect(() => {
    if (!isEmployeeStorageLoaded) return;
    localStorage.setItem(LOCAL_REMOVED_EMPLOYEE_IDS_KEY, JSON.stringify(removedEmployeeIds));
  }, [removedEmployeeIds, isEmployeeStorageLoaded]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await employeeAPI.getAll();
        setBackendEmployees(response.data || []);
      } catch {
        setBackendEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("section") === "departments") {
      setShowDepartments(true);
      setSelectedDepartment("All");
    }
  }, [location.search]);

  const employees = useMemo(() => {
    const visibleBackendEmployees = backendEmployees.filter(
      (employee) => !removedEmployeeIds.includes(employee._id)
    );
    return [...localEmployees, ...visibleBackendEmployees];
  }, [backendEmployees, localEmployees, removedEmployeeIds]);

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((employee) => employee.status !== "Inactive").length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [employees]);

  const departmentOptions = useMemo(() => {
    const existingDepartments = employees
      .map((employee) => (employee.department || "").trim())
      .filter(Boolean);
    const merged = [...DEFAULT_DEPARTMENTS, ...existingDepartments];
    return [...new Set(merged)].slice(0, 5);
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (selectedDepartment === "All") {
      return employees;
    }
    return employees.filter((employee) => employee.department === selectedDepartment);
  }, [employees, selectedDepartment]);

  const openAddModal = () => {
    setAddForm(initialAddForm);
    setError("");
    setMessage("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddForm(initialAddForm);
  };

  const handleAddEmployee = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!addForm.name || !addForm.email || !addForm.phone || !addForm.department) {
      setError("Name, email, contact number and department are required");
      return;
    }

    const normalizedEmail = addForm.email.toLowerCase().trim();
    const emailExists = employees.some((employee) => employee.email?.toLowerCase() === normalizedEmail);
    if (emailExists) {
      setError("Employee with this email already exists");
      return;
    }

    const newEmployee = {
      _id: `local-${Date.now()}`,
      name: addForm.name.trim(),
      email: normalizedEmail,
      phone: addForm.phone.trim(),
      department: addForm.department,
      role: "Employee",
      dateOfJoining: new Date().toISOString(),
      status: "Active",
      isLocal: true,
    };

    setLocalEmployees((prev) => [newEmployee, ...prev]);
    setMessage("Employee added in local storage");
    closeAddModal();
  };

  const handleQuickRemove = () => {
    setError("");
    setMessage("");

    if (!quickRemoveId) {
      setError("Select an employee to remove");
      return;
    }

    if (quickRemoveId.startsWith("local-")) {
      setLocalEmployees((prev) => prev.filter((employee) => employee._id !== quickRemoveId));
    } else {
      setRemovedEmployeeIds((prev) => {
        if (prev.includes(quickRemoveId)) return prev;
        return [...prev, quickRemoveId];
      });
    }

    setQuickRemoveId("");
    setMessage("Employee removed from this device (local storage)");
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title text-2xl font-extrabold">Employee Management</h1>
          <p className="section-subtitle text-sm">
            Add/remove employees from local storage and view department-wise list
          </p>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
          <p className="text-2xl font-extrabold text-slate-900">{stats.total}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-gradient-to-r from-teal-700 to-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              onClick={openAddModal}
            >
              Add Employee
            </button>
            <button
              type="button"
              className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
              onClick={handleQuickRemove}
            >
              Remove Employee
            </button>
          </div>
          <div className="mt-2">
            <select
              className={`${inputClass} text-xs`}
              value={quickRemoveId}
              onChange={(e) => setQuickRemoveId(e.target.value)}
            >
              <option value="">Select employee to remove</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name} ({employee.email})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active</p>
          <p className="text-2xl font-extrabold text-emerald-700">{stats.active}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Inactive</p>
          <p className="text-2xl font-extrabold text-slate-700">{stats.inactive}</p>
        </div>
      </div>

      <section className="glass-card mb-6 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">Departments</h2>
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-100"
            onClick={() => setShowDepartments((prev) => !prev)}
          >
            {showDepartments ? "Hide Departments" : "Open Departments"}
          </button>
        </div>

        {showDepartments && (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  selectedDepartment === "All"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
                onClick={() => setSelectedDepartment("All")}
              >
                All
              </button>
              {departmentOptions.map((department) => (
                <button
                  key={department}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    selectedDepartment === department
                      ? "bg-teal-700 text-white"
                      : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                  }`}
                  onClick={() => setSelectedDepartment(department)}
                >
                  {department}
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-600">
              Showing: {selectedDepartment} ({filteredEmployees.length} employees)
            </p>
          </div>
        )}
      </section>

      {message && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {showAddModal && (
        <section className="glass-card mb-6 rounded-xl p-5">
          <h2 className="text-lg font-bold text-slate-900">Add Employee</h2>
          <p className="mt-1 text-sm text-slate-600">This will be saved to local storage only.</p>

          <form onSubmit={handleAddEmployee} className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Name"
              value={addForm.name}
              onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <input
              className={inputClass}
              type="email"
              placeholder="Email"
              value={addForm.email}
              onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <input
              className={inputClass}
              placeholder="Contact Number"
              value={addForm.phone}
              onChange={(e) => setAddForm((prev) => ({ ...prev, phone: e.target.value }))}
              required
            />
            <select
              className={inputClass}
              value={addForm.department}
              onChange={(e) => setAddForm((prev) => ({ ...prev, department: e.target.value }))}
              required
            >
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>

            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
                onClick={closeAddModal}
              >
                Close
              </button>
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-teal-700 to-sky-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Save
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="glass-card overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="table-header text-slate-700">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Date of Joining</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-slate-600" colSpan="7">
                    Loading employees...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-600" colSpan="7">
                    No employees found for this selection.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee._id} className="border-t border-slate-100/70">
                    <td className="px-4 py-3 font-medium text-slate-900">{employee.name}</td>
                    <td className="px-4 py-3 text-slate-700">{employee.email}</td>
                    <td className="px-4 py-3 text-slate-700">{employee.phone || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{employee.department}</td>
                    <td className="px-4 py-3 text-slate-700">{employee.role || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {employee.dateOfJoining
                        ? new Date(employee.dateOfJoining).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          employee.status === "Inactive"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {employee.status || "Active"}
                      </span>
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

export default Employee;
