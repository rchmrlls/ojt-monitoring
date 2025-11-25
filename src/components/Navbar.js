import React from "react";

const Navbar = ({ user }) => {
  return (
    <nav className="navbar navbar-light bg-light px-4 shadow-sm">
      <span className="navbar-brand mb-0 h4">OJT Monitoring</span>
      <span className="text-muted">Welcome, {user?.name || "Admin"}</span>
    </nav>
  );
};

export default Navbar;
