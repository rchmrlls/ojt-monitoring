import React from "react";
import { Dropdown } from "react-bootstrap";
import { PersonCircle, BoxArrowRight } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.get("http://localhost/ojt_monitoring/backend/api/auth/logout.php");
      localStorage.removeItem("user");
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <nav className="navbar navbar-custom d-flex justify-content-between align-items-center mb-4">
      <div>
        <h5 className="mb-0 fw-bold text-dark">Welcome back, {user?.name || "Admin"}!</h5>
        <small className="text-muted">Here's what's happening today.</small>
      </div>

      <Dropdown>
        <Dropdown.Toggle variant="light" id="dropdown-basic" className="d-flex align-items-center border-0 bg-transparent">
          <PersonCircle size={32} className="text-primary me-2" />
          <span className="fw-semibold d-none d-md-block">{user?.name || "User"}</span>
        </Dropdown.Toggle>

        <Dropdown.Menu align="end" className="shadow-sm border-0 mt-2">
          <Dropdown.Item onClick={handleLogout} className="text-danger">
            <BoxArrowRight className="me-2" /> Logout
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </nav>
  );
};

export default Navbar;