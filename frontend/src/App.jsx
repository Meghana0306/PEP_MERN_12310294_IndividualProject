import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./Pages/Login";
import Register from "./Pages/Register";
import OtpVerify from "./Pages/OtpVerify";
// import Dashboard from "./pages/Dashboard";
// import Employees from "./pages/Employees";
// import EmployeeForm from "./pages/EmployeeForm";
// import Attendance from "./pages/Attendance";
// import LeaveManagement from "./pages/LeaveManagement";
// import Payroll from "./pages/Payroll";
// import Reports from "./pages/Reports";
// import Settings from "./pages/Settings";
// import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />     
        <Route path="/verify-otp" element={<OtpVerify />} />

        {/* <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/employees/new" element={<EmployeeForm />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leaves" element={<LeaveManagement />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="*" element={<NotFound />} />  */}
      </Routes>
    </Router>
  );
}

export default App;
