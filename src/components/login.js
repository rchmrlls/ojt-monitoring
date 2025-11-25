import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost/ojt_monitoring/backend/api/auth/login.php",
        { email, password }
      );

      if (response.data.success) {
        const user = response.data.user;
        localStorage.setItem("user", JSON.stringify(user));

        // ✅Redirect based on role
        if (user.role === "Admin") {
          window.location.href = "/Dashboard";
        } else if (user.role === "Student") {
          window.location.href = "/StudentDashboard";
        } else if (user.role === "OJT Advisor") {
          window.location.href = "/advisor-dashboard";
        } else if (user.role === "Company Advisor") {
          window.location.href = "/company-dashboard";
        } else {
          alert("Unknown user role. Please contact the administrator.");
        }
      } else {
        setError(response.data.message || "Invalid credentials.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
      <div
        className="card shadow p-4"
        style={{ width: "400px", borderRadius: "15px" }}
      >
        <h3 className="text-center mb-4">OJT Monitoring Login</h3>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
