import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { employeeAPI } from "../services/api";

function EmployeeForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "",
    dateOfJoining: "",
    status: "Active"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user?.role !== "Admin") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-rose-700">Access denied. Only admins can add employees.</p>
      </main>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await employeeAPI.create(formData);
      alert("Employee added successfully");
      navigate("/employee");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-5 text-2xl font-bold text-slate-900">Add New Employee</h1>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <input className={inputClass} type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <input className={inputClass} type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          <input className={inputClass} type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          <input className={inputClass} type="text" placeholder="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required />
          <input className={inputClass} type="text" placeholder="Role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required />
          <input className={inputClass} type="date" value={formData.dateOfJoining} onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })} required />
          <select className={inputClass} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" disabled={loading}>
              {loading ? "Adding..." : "Add Employee"}
            </button>
            <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100" onClick={() => navigate("/employee")}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default EmployeeForm;
