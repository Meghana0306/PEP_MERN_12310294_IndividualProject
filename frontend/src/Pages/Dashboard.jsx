import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    alert("Logged out");
    navigate("/");
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Welcome to HRMS Dashboard 🎉</h2>

      <p>This is your protected page after login</p>

      <button onClick={logout}>Logout</button>
    </div>
  );
}
