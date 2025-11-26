import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Grid1x2Fill, 
  PeopleFill, 
  PersonBadgeFill, 
  BuildingFill, 
  FileEarmarkTextFill, 
  PersonVideo3 
} from "react-bootstrap-icons";

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar d-flex flex-column">
      <div className="px-3 mb-4">
        <h4 className="fw-bold text-primary mb-0">
          <Grid1x2Fill className="me-2" />
          OJT Admin
        </h4>
        <small className="text-muted">Monitoring System</small>
      </div>

      <nav className="nav flex-column w-100">
        <Link to="/Dashboard" className={`nav-link ${isActive("/Dashboard") ? "active" : ""}`}>
          <Grid1x2Fill size={18} className="me-3" /> Dashboard
        </Link>
        <Link to="/admin/students" className={`nav-link ${isActive("/admin/students") ? "active" : ""}`}>
          <PeopleFill size={18} className="me-3" /> Manage Students
        </Link>
        <Link to="/admin/advisors" className={`nav-link ${isActive("/admin/advisors") ? "active" : ""}`}>
          <PersonBadgeFill size={18} className="me-3" /> Manage Advisors
        </Link>
        <Link to="/admin/companies" className={`nav-link ${isActive("/admin/companies") ? "active" : ""}`}>
          <BuildingFill size={18} className="me-3" /> Manage Companies
        </Link>
        {/*<Link to="/admin/supervisors" className={`nav-link ${isActive("/admin/supervisors") ? "active" : ""}`}>
          <PersonVideo3 size={18} className="me-3" /> Manage Supervisors
        </Link>
        <Link to="/admin/placements" className={`nav-link ${isActive("/admin/placements") ? "active" : ""}`}>
          <FileEarmarkTextFill size={18} className="me-3" /> Placements
        </Link></div>*/}
      </nav>
      
      <div className="mt-auto px-3 text-center">
        <small className="text-muted">OJT Monitoring System</small>
      </div>
    </div>
  );
};

export default Sidebar;