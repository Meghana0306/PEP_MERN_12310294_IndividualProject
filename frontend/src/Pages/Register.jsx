import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import bgImage from "../assets/login.png";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!form.name || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await register(form.name, form.email, form.password);
      setSuccessMessage("Registered successfully. Redirecting to login...");
      setForm({ name: "", email: "", password: "" });
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      setError(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md glass-card rounded-2xl p-6 md:p-8">
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="mb-6 text-sm text-slate-500">Register to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className={inputClass}
              name="name"
              type="text"
              placeholder="Full Name"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className={inputClass}
              name="email"
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              className={inputClass}
              name="password"
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            {successMessage && (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p>
            )}
            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-emerald-700">
              Login
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden md:block">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(2,6,23,0.4), rgba(2,6,23,0.4)), url(${bgImage})`,
          }}
        />
      </div>
    </div>
  );
}

export default Register;
