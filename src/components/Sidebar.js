import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Students", path: "/admin/students" },
    { name: "Advisors", path: "/admin/advisors" },
    { name: "Companies", path: "/admin/companies" },
    //{ name: "Supervisors", path: "/admin/supervisors" },
    //{ name: "Placements", path: "/admin/placements" },
  ];

  const handleLogout = async () => {
  try {
    await axios.get("http://localhost/ojt_monitoring/backend/api/auth/logout.php");

    localStorage.removeItem("user");

    navigate("/");
  } catch (err) {
    console.error("Logout failed:", err);
    alert("Failed to logout. Try again.");
  }
};

  return (
    <div className="d-flex flex-column bg-dark text-white vh-100 p-3" style={{ width: "250px" }}>
      <h4 className="mb-4">Admin Panel</h4>
      <ul className="nav flex-column flex-grow-1">
        {menuItems.map((item) => (
          <li key={item.path} className="nav-item mb-2">
            <Link
              to={item.path}
              className={`nav-link ${
                location.pathname === item.path ? "text-warning" : "text-white"
              }`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      {/* Logout Button */}
      <div className="mt-auto">
        <button
          className="btn btn-danger w-100"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
