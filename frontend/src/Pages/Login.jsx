import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import bgImage from "../assets/login.png";

function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // login | register | otp | loginOtp

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  // 🔐 PASSWORD VALIDATION
  const isValidPassword = (pwd) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{6,}$/.test(pwd);
  };

  // ========================= LOGIN =========================
  const handleLogin = (e) => {
    e.preventDefault();

    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser) {
      setError("User not registered. Please register first.");
      return;
    }

    if (email === storedUser.email && password === storedUser.password) {
      localStorage.setItem("token", "dummy-token");
      navigate("/dashboard");
    } else {
      setError("Invalid credentials");
    }
  };

  // ====================== LOGIN WITH OTP ====================
  const handleLoginOtpSend = () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser) {
      setError("User not registered. Please register first.");
      return;
    }

    if (email !== storedUser.email) {
      setError("Email not found");
      return;
    }

    const loginOtp = Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem("loginOtp", loginOtp);

    alert("Your Login OTP is: " + loginOtp);

    setMode("loginOtp");
    setError("");
  };

  const handleVerifyLoginOtp = (e) => {
    e.preventDefault();

    const savedOtp = localStorage.getItem("loginOtp");

    if (otp === savedOtp) {
      localStorage.setItem("token", "dummy-token");
      navigate("/dashboard");
    } else {
      setError("Invalid OTP");
    }
  };

  // ======================= REGISTER =========================
  const handleRegister = (e) => {
    e.preventDefault();

    if (!email || !phone || !password) {
      setError("All fields required");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setError("Phone must be 10 digits");
      return;
    }

    if (!isValidPassword(password)) {
      setError(
        "Password must contain capital, small, symbol and be 6+ characters"
      );
      return;
    }

    const existingUser = JSON.parse(localStorage.getItem("user"));
    if (existingUser && existingUser.email === email) {
      setError("User already exists. Please login.");
      return;
    }

    // generate OTP
    const registerOtp = Math.floor(1000 + Math.random() * 9000);

    localStorage.setItem(
      "tempUser",
      JSON.stringify({ email, phone, password })
    );
    localStorage.setItem("registerOtp", registerOtp);

    alert("Registration OTP: " + registerOtp);

    setMode("otp");
    setError("");
  };

  // ===================== VERIFY REGISTER OTP =================
  const handleVerifyOtp = (e) => {
    e.preventDefault();

    const savedOtp = localStorage.getItem("registerOtp");
    const tempUser = JSON.parse(localStorage.getItem("tempUser"));

    if (otp === savedOtp) {
      localStorage.setItem("user", JSON.stringify(tempUser));
      localStorage.removeItem("tempUser");
      localStorage.removeItem("registerOtp");

      alert("Registration successful 🎉");

      setMode("login");
      setError("");
    } else {
      setError("Invalid OTP");
    }
  };

  return (
    <div className="main-bg">
      <div className="login-wrapper">

        {/* LEFT SIDE */}
        <div className="login-left">
          <h1 className="logo">HRMS</h1>

          {/* LOGIN FORM */}
          {mode === "login" && (
            <div className="login-card">
              <h2>Welcome Back 👋</h2>

              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <input
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <input
                    type="password"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && <p className="error">{error}</p>}

                <button className="login-btn">Sign In</button>
              </form>

              <p style={{ marginTop: "10px" }}>
                or{" "}
                <span
                  style={{ color: "blue", cursor: "pointer" }}
                  onClick={handleLoginOtpSend}
                >
                  Login with OTP
                </span>
              </p>

              <p className="register-link">
                Don’t have an account?{" "}
                <span onClick={() => { setMode("register"); setError(""); }}>
                  Register
                </span>
              </p>
            </div>
          )}

          {/* LOGIN OTP VERIFY */}
          {mode === "loginOtp" && (
            <div className="login-card">
              <h2>Verify Login OTP</h2>

              <form onSubmit={handleVerifyLoginOtp}>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/[^0-9]/g, ""))
                    }
                  />
                </div>

                {error && <p className="error">{error}</p>}

                <button className="login-btn">Verify & Login</button>
              </form>
            </div>
          )}

          {/* REGISTER FORM */}
          {mode === "register" && (
            <div className="login-card">
              <h2>Create Account</h2>

              <form onSubmit={handleRegister}>
                <div className="input-group">
                  <input
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Enter Phone Number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/[^0-9]/g, ""))
                    }
                  />
                </div>

                <div className="input-group">
                  <input
                    type="password"
                    placeholder="Create Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && <p className="error">{error}</p>}

                <button className="login-btn">Send OTP</button>
              </form>

              <p className="register-link">
                Already have an account?{" "}
                <span onClick={() => setMode("login")}>Login</span>
              </p>
            </div>
          )}

          {/* REGISTER OTP VERIFY */}
          {mode === "otp" && (
            <div className="login-card">
              <h2>Verify OTP</h2>

              <form onSubmit={handleVerifyOtp}>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/[^0-9]/g, ""))
                    }
                  />
                </div>

                {error && <p className="error">{error}</p>}

                <button className="login-btn">Verify & Register</button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT SIDE IMAGE */}
        <div
          className="login-right"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
      </div>
    </div>
  );
}

export default Login;
