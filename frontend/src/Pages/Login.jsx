import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import bgImage from "../assets/login.png";

function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // login | register | otp

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  // 🔐 PASSWORD VALIDATION
  const isValidPassword = (pwd) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{6,}$/.test(pwd);
  };

  // LOGIN
  const handleLogin = (e) => {
    e.preventDefault();

    if (email === "admin@gmail.com" && password === "123456") {
      localStorage.setItem("token", "dummy-token");
      navigate("/dashboard");
    } else {
      setError("Invalid credentials");
    }
  };

  // REGISTER STEP 1
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

    // simulate OTP send
    console.log("OTP sent to phone/email");
    setMode("otp");
  };

  // OTP VERIFY
  const handleVerifyOtp = (e) => {
    e.preventDefault();

    if (otp === "1234") {
      alert("Registration successful");
      setMode("login");
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

              <p className="register-link">
                Don’t have an account?{" "}
                <span onClick={() => { setMode("register"); setError(""); }}>
                  Register
                </span>
              </p>
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

          {/* OTP VERIFY */}
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
