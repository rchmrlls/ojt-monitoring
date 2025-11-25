import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/login";
import Dashboard from "./pages/Dashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminAdvisors from "./pages/admin/AdminAdvisors";
import AdminCompanies from "./pages/admin/AdminCompanies";
import AdminSupervisors from "./pages/admin/AdminSupervisors";
import StudentDashboard from "./pages/StudentDashboard";
import './styles/theme.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/components/login" element={<Login />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/admin/students" element={<AdminStudents />} />
        <Route path="/admin/advisors" element={<AdminAdvisors />} />
        <Route path="/admin/companies" element={<AdminCompanies />} />
        <Route path="/admin/supervisors" element={<AdminSupervisors />} />
        <Route path="/StudentDashboard" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
