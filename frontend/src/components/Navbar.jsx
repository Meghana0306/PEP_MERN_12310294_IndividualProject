import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) {
    return null;
  }

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/attendance", label: "Attendance" },
    { to: "/employee", label: "Employees" },
    { to: "/leave", label: "Leaves" },
    { to: "/payroll", label: "Payroll" },
    { to: "/reports", label: "Reports" },
    { to: "/settings", label: "Settings" }
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/75 backdrop-blur nav-glow">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/dashboard" className="text-lg font-extrabold tracking-wide text-slate-900">
          HRMS
        </Link>

        <button
          className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          Menu
        </button>

        <div className="hidden items-center gap-4 md:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm font-semibold text-slate-700 hover:text-teal-700">
              {link.label}
            </Link>
          ))}
          {user?.role === "Admin" && (
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">Admin</span>
          )}
          <span className="text-sm text-slate-700">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="rounded-md bg-gradient-to-r from-teal-700 to-sky-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="space-y-2 border-t border-white/50 px-4 py-3 md:hidden bg-white/90">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-teal-50"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full rounded-md bg-gradient-to-r from-teal-700 to-sky-600 px-3 py-2 text-sm font-medium text-white"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

export default Navbar;
