import React, { useEffect, useState } from "react";
import { Table, ProgressBar, Button, Card, Row, Col, Form, Badge } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";

const API_BASE = "http://localhost/ojt_monitoring/backend/api";

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [studentId, setStudentId] = useState(null);

  const storedUser = JSON.parse(localStorage.getItem("user"));

  // Fetch student ID
  useEffect(() => {
    const fetchStudentId = async () => {
      if (!storedUser) {
        alert("No user info found. Please log in again.");
        window.location.href = "/";
        return;
      }

      if (storedUser.student_id) {
        setStudentId(storedUser.student_id);
      } else if (storedUser.id) {
        try {
          const res = await axios.get(`${API_BASE}/student/get_student_id.php`, {
            params: { user_id: storedUser.id }
          });
          if (res.data.success && res.data.student_id) {
            setStudentId(res.data.student_id);
          } else {
            alert("Student record not found. Please contact admin.");
            return;
          }
        } catch (err) {
          console.error("Error fetching student_id:", err);
          alert("Failed to fetch student info.");
        }
      }
    };
    fetchStudentId();
  }, [storedUser]);

  // Fetch profile + requirements
  useEffect(() => {
    if (!studentId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, reqRes] = await Promise.all([
          axios.get(`${API_BASE}/student/get_profile.php`, { params: { id: studentId } }),
          axios.get(`${API_BASE}/student/get_requirements.php`, { params: { student_id: studentId } }),
        ]);

        if (profileRes.data.success) setStudent(profileRes.data.data);
        if (reqRes.data.success) {
          setRequirements(reqRes.data.data);
          calculateProgress(reqRes.data.data);
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
        alert("Failed to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  const calculateProgress = (reqs) => {
    const total = reqs.length || 0;
    const completed = reqs.filter(r => r.status === "Completed" || r.status === "Submitted").length;
    setProgress(total ? Math.round((completed / total) * 100) : 0);
  };

  const handleUpload = async (e, requirement_id) => {
    const file = e.target.files[0];
    if (!file || !studentId) return;

    // Confirmation before upload
    const confirmUpload = await Swal.fire({
      title: "Upload File?",
      text: `Are you sure you want to upload "${file.name}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, upload it",
      cancelButtonText: "Cancel",
    });

    // Cancel upload
    if (!confirmUpload.isConfirmed) {
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("student_id", studentId);
    formData.append("requirement_id", requirement_id);
    formData.append("file", file);

    setUploading(true);

    try {
      const res = await axios.post(`${API_BASE}/student/upload_requirement.php`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Uploaded Successfully!",
          text: "Your file has been submitted.",
          timer: 1500,
          showConfirmButton: false
        });

        const updated = requirements.map(r =>
          r.requirement_id === requirement_id ? { ...r, status: "Submitted" } : r
        );
        setRequirements(updated);
        calculateProgress(updated);
      } else {
        Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: res.data.message || "Please try again."
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error uploading file. Please try again."
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await axios.get(`${API_BASE}/auth/logout.php`);
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("user");
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <Navbar user={{ name: student?.name || "Student" }} />
      <div className="container mt-4 mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bold text-primary">Student Dashboard</h3>
          <Button variant="outline-danger" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {/* Student Info Card */}
        <Card className="shadow-sm border-0 mb-4">
          <Card.Body>
            <Row>
              <Col md={6}>
                <p><strong>Name:</strong> {student?.name}</p>
                <p><strong>Email:</strong> {student?.email}</p>
                <p><strong>Student No:</strong> {student?.student_no}</p>
              </Col>
              <Col md={6}>
                <p><strong>Course:</strong> {student?.course}</p>
                <p><strong>Year & Section:</strong> {student?.year_level} - {student?.section}</p>
                <p><strong>Company:</strong> {student?.company_name || "Not Assigned"}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Overall Progress */}
        <Card className="shadow-sm border-0 mb-4">
          <Card.Body>
            <h6 className="fw-bold mb-2 text-secondary">Overall Progress</h6>
            <ProgressBar now={progress} label={`${progress}%`} variant={progress === 100 ? "success" : "info"} />
          </Card.Body>
        </Card>

        {/* Requirements Checklist */}
        <Card className="shadow-sm border-0">
          <Card.Header className="fw-bold bg-primary text-white">My Requirements Checklist</Card.Header>
          <Card.Body>
            <Table bordered hover responsive className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Requirement</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Upload File</th>
                </tr>
              </thead>
              <tbody>
                {requirements.length > 0 ? (
                  requirements.map((req, index) => (
                    <tr key={req.requirement_id}>
                      <td>{index + 1}</td>
                      <td>{req.requirement_name}</td>
                      <td>{req.description || "—"}</td>
                      <td>
                        <Badge bg={req.status === "Completed" || req.status === "Submitted" ? "success" : "secondary"}>
                          {req.status || "Pending"}
                        </Badge>
                      </td>
                      <td>
                        {req.status === "Completed" ? (
                          <Button size="sm" variant="success" disabled>Verified ✓</Button>
                        ) : (
                          <Form.Group controlId={`upload-${req.requirement_id}`}>
                            <Form.Control
                              type="file"
                              size="sm"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => handleUpload(e, req.requirement_id)}
                              disabled={uploading}
                            />
                          </Form.Group>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">No requirements found.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
