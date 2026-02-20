import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { employeeAPI } from "../services/api";
import bgImage from "../assets/login.png";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const [allRes, countRes] = await Promise.all([
          employeeAPI.getAll(),
          employeeAPI.getCount(),
        ]);

        setEmployees(allRes.data || []);
        setTotalCount(countRes.data?.totalEmployees || 0);
      } catch {
        setEmployees([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const stats = useMemo(() => {
    const totalEmployees = totalCount || employees.length;
    const activeEmployees = employees.filter((emp) => emp.status === "Active").length;
    const departments = new Set(employees.map((emp) => emp.department).filter(Boolean)).size;
    const recentActivity = employees.slice(0, 5).length;
    return { totalEmployees, activeEmployees, departments, recentActivity };
  }, [employees, totalCount]);

  const cards = [
    { title: "Total Employees", value: stats.totalEmployees, action: () => navigate("/employee") },
    { title: "Active Employees", value: stats.activeEmployees },
    { title: "Departments", value: stats.departments, action: () => navigate("/employee?section=departments") },
    { title: "Recent Activity", value: stats.recentActivity },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <section
        className="hero-image relative mb-6 overflow-hidden rounded-2xl"
        style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="relative z-10 p-7 md:p-10">
          <h1 className="section-title text-3xl font-extrabold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-100">
            Welcome, <span className="font-semibold">{user?.name}</span> ({user?.role})
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const isClickable = Boolean(card.action);
          return (
            <button
              key={card.title}
              onClick={card.action}
              className={`glass-card rounded-xl p-5 text-left transition ${
                isClickable ? "hover:-translate-y-0.5 hover:border-teal-300" : "cursor-default"
              }`}
            >
              <p className="text-sm font-medium text-slate-600">{card.title}</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{card.value}</p>
            </button>
          );
        })}
      </div>

      {loading && <p className="mt-6 text-sm text-slate-600">Loading dashboard...</p>}

      {!loading && user?.role === "Admin" && (
        <section className="glass-card mt-8 rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-900">Admin Quick Actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button onClick={() => navigate("/employee")} className="rounded-lg bg-gradient-to-r from-teal-700 to-sky-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90">Manage Employees</button>
            <button onClick={() => navigate("/reports")} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-teal-50">Generate Reports</button>
            <button onClick={() => navigate("/attendance")} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-teal-50">View Attendance</button>
            <button onClick={() => navigate("/settings")} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-teal-50">System Settings</button>
          </div>
        </section>
      )}
    </main>
  );
}

export default Dashboard;
