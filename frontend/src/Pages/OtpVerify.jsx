import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

function OtpVerify() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleVerify = (e) => {
    e.preventDefault();

    const savedOtp = localStorage.getItem("registerOtp");
    const tempUser = JSON.parse(localStorage.getItem("tempUser"));

    if (!tempUser) {
      setError("Session expired. Please register again.");
      return;
    }

    if (otp === savedOtp) {
      // save user permanently
      localStorage.setItem("user", JSON.stringify(tempUser));

      // cleanup temp storage
      localStorage.removeItem("tempUser");
      localStorage.removeItem("registerOtp");

      alert("Registration successful 🎉");

      navigate("/");
    } else {
      setError("Invalid OTP");
    }
  };

  return (
    <div className="main-bg">
      <div className="login-wrapper">
        <div className="login-left">
          <h1 className="logo">HRMS</h1>

          <div className="login-card">
            <h2>Verify OTP</h2>

            <form onSubmit={handleVerify}>
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
        </div>
      </div>
    </div>
  );
}

export default OtpVerify;
