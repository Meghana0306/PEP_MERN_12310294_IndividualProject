import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import bgImage from "../assets/login.png";

function Login() {
  const navigate = useNavigate();
  const { login, verifyOtpLogin } = useAuth();

  const [mode, setMode] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("pendingRegistration");
    if (!raw) return;

    try {
      const pending = JSON.parse(raw);
      if (pending?.email) {
        setEmail(pending.email);
      }
      if (pending?.password) {
        setPassword(pending.password);
      }
      setInfo("Registered successfully. Please login to continue.");
    } catch {
      localStorage.removeItem("pendingRegistration");
    }
  }, []);

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authAPI.sendOtp({ email });
      setOtpSent(true);
      setInfo("OTP sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtpLogin(email, otp);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md glass-card rounded-2xl p-6 md:p-8">
          <h1 className="mb-2 text-2xl font-bold text-slate-900">HRMS Login</h1>
          <p className="mb-6 text-sm text-slate-500">Sign in to continue</p>

          {mode === "password" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <input
                className={inputClass}
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className={inputClass}
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {info && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <button className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          ) : (
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
              <input
                className={inputClass}
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={otpSent}
                required
              />
              {otpSent && (
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
              )}
              {info && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <button className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700" disabled={loading}>
                {loading ? (otpSent ? "Verifying..." : "Sending OTP...") : otpSent ? "Verify OTP" : "Login with OTP"}
              </button>
            </form>
          )}

          <button
            className="mt-4 text-sm font-medium text-emerald-700 hover:text-emerald-800"
            onClick={() => {
              setMode((prev) => (prev === "password" ? "otp" : "password"));
              setOtp("");
              setOtpSent(false);
              setError("");
            }}
          >
            {mode === "password" ? "Login with OTP" : "Back to Password Login"}
          </button>

          <p className="mt-6 text-sm text-slate-600">
            Not registered? <Link to="/register" className="font-semibold text-emerald-700">Register here</Link>
          </p>
        </div>
      </div>

      <div className="hidden md:block">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(rgba(2,6,23,0.4), rgba(2,6,23,0.4)), url(${bgImage})` }}
        />
      </div>
    </div>
  );
}

export default Login;
