import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // password validation
  const isValidPassword = (pwd) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{6,}$/.test(pwd);
  };

  const handleRegister = (e) => {
    e.preventDefault();

    if (!email || !phone || !password) {
      setError("All fields are required");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setError("Phone must be 10 digits");
      return;
    }

    if (!isValidPassword(password)) {
      setError("Password must contain uppercase, lowercase & symbol");
      return;
    }

    // check if user already exists
    const existingUser = JSON.parse(localStorage.getItem("user"));
    if (existingUser && existingUser.email === email) {
      setError("User already registered. Please login.");
      return;
    }

    // generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // store temp user + otp
    localStorage.setItem(
      "tempUser",
      JSON.stringify({ email, phone, password })
    );
    localStorage.setItem("otp", otp);

    alert("OTP sent to your email/phone: " + otp);

    navigate("/verify-otp");
  };

  return (
    <div className="main-bg">
      <div className="login-wrapper">
        <div className="login-left">
          <h1 className="logo">HRMS</h1>

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
              <span onClick={() => navigate("/")}>Login</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
