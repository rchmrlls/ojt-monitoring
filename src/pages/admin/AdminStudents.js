import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Modal, Form, Table, ProgressBar } from "react-bootstrap";

const API_URL = "http://localhost/ojt_monitoring/backend/api/admin/manage_students.php";
const COMPANY_URL = "http://localhost/ojt_monitoring/backend/api/admin/manage_companies.php";
const REQ_URL = "http://localhost/ojt_monitoring/backend/api/admin/manage_requirements.php";
const RESET_URL = "http://localhost/ojt_monitoring/backend/api/admin/reset_weekly_reports.php";

function AdminStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    student_no: "",
    course: "",
    year_level: "",
    section: "",
    contact_no: "",
    address: "",
    company_id: "",
    deployment_status: "Not Deployed",
  });

  // Fetch all students
  const fetchStudents = async () => {
    try {
      const res = await axios.get(API_URL);
      if (res.data.success) setStudents(res.data.data);
      else console.error(res.data.message);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  // Fetch companies for dropdown
  const fetchCompanies = async () => {
    try {
      const res = await axios.get(COMPANY_URL);
      if (res.data.success) setCompanies(res.data.data);
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchCompanies();
  }, []);

  // Add or update student
  const handleSave = async () => {
    try {
      if (editing) {
        const payload = {
          id: formData.id || editing.student_id,
          name: formData.name,
          email: formData.email,
          course: formData.course,
          year_level: formData.year_level,
          section: formData.section,
          contact_no: formData.contact_no,
          address: formData.address,
          company_id: formData.company_id || null,
          deployment_status: formData.deployment_status,
        };

        if (!payload.id) {
          alert("Error: Missing student ID for update.");
          return;
        }

        await axios.put(API_URL, payload);
        alert("Student updated successfully!");
      } else {
        const payload = { ...formData };
        const res = await axios.post(API_URL, payload);
        if (res.data.success) alert("Student added successfully!");
        else alert(res.data.message);
      }

      fetchStudents();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving student:", err);
      alert(err.response?.data?.message || "Failed to save student.");
    }
  };


  // Edit handler
  const handleEdit = (stu) => {
    setEditing(stu);
    setFormData({
      id: stu.student_id,
      name: stu.full_name || "",
      email: stu.email || "",
      student_no: stu.student_no || "",
      course: stu.course || "",
      year_level: stu.year_level || "",
      section: stu.section || "",
      contact_no: stu.contact_no || "",
      address: stu.address || "",
      company_id: stu.company_id || "",
      deployment_status: stu.deployment_status || "Not Deployed",
    });
    setShowModal(true);
  };

  // Delete handler
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        const res = await axios.delete(API_URL, { data: { id } });
        if (res.data.success) alert("Student deleted successfully!");
        else alert(res.data.message);
        fetchStudents();
      } catch (err) {
        console.error("Error deleting student:", err);
        alert("Failed to delete student.");
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setEditing(null);
    setFormData({
      id: "",
      name: "",
      email: "",
      student_no: "",
      course: "",
      year_level: "",
      section: "",
      contact_no: "",
      address: "",
      company_id: "",
      deployment_status: "Not Deployed",
    });
  };

  // Toggle Deployment
  const toggleDeployment = async (student) => {
    const newStatus =
      student.deployment_status === "Deployed" ? "Not Deployed" : "Deployed";

    if (
      !window.confirm(
        `Are you sure you want to mark ${student.full_name} as ${newStatus}?`
      )
    )
      return;

    try {
      const res = await axios.put(API_URL, {
        id: student.student_id,
        deployment_status: newStatus,
      });

      if (res.data.success) {
        alert("Deployment status updated!");
        fetchStudents();
      } else {
        alert(res.data.message || "Failed to update deployment.");
      }
    } catch (err) {
      console.error("Error updating deployment:", err);
      alert("Failed to update deployment.");
    }
  };

  // View student requirements
  const viewRequirements = async (student) => {
    try {
      const res = await axios.get(REQ_URL, {
        params: { student_id: student.student_id },
      });
      if (res.data.success) {
        setSelectedStudent(student);
        setRequirements(res.data.data);
        setShowReqModal(true);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error("Error loading requirements:", err);
    }
  };

  // Reset all weekly reports
  const handleResetWeeklyReports = async () => {
    if (!window.confirm("Reset all weekly report statuses to Pending?")) return;

    try {
      const res = await axios.post(RESET_URL);
      if (res.data.success) {
        alert("Weekly reports reset successfully!");
        fetchStudents();
      } else {
        alert(res.data.message || "Reset failed.");
      }
    } catch (err) {
      console.error("Error resetting weekly reports:", err);
      alert("Server error: Check your reset_weekly_reports.php API.");
    }
  };

  // Progress calculation
  const getProgress = (reqs) => {
    const total = reqs.length || 0;
    const completed = reqs.filter(
      (r) => r.status === "Completed" || r.status === "Submitted"
    ).length;
    return total ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="text-primary fw-bold">Manage Students</h3>
        <Button variant="outline-primary" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </Button>
      </div>

      <div className="d-flex gap-2 mb-3">
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Add Student
        </Button>

        <Button variant="outline-danger" onClick={handleResetWeeklyReports}>
          Reset Weekly Reports
        </Button>
      </div>

      {/* Scrollable Table */}
      <div
        className="table-responsive"
        style={{
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: "70vh",
          borderRadius: "8px",
        }}
      >
        <Table
          striped
          bordered
          hover
          className="align-middle"
          style={{
            width: "100%",
            minWidth: "1100px",
            whiteSpace: "nowrap",
          }}
        >
          <thead>
            <tr>
              <th>Student No</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Year</th>
              <th>Section</th>
              <th>Company</th>
              <th>Requirements</th>
              <th>Deployment</th>
              <th style={{ width: "240px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length ? (
              students.map((stu) => (
                <tr key={stu.student_id}>
                  <td>{stu.student_no}</td>
                  <td>{stu.full_name}</td>
                  <td>{stu.email}</td>
                  <td>{stu.course}</td>
                  <td>{stu.year_level}</td>
                  <td>{stu.section}</td>
                  <td style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",}}
                    title={stu.company_name || "—"}
                  > {stu.company_name || "—"} </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-info"
                      onClick={() => viewRequirements(stu)}
                    >
                      View
                    </Button>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        stu.deployment_status === "Deployed"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {stu.deployment_status}
                    </span>
                  </td>
                  <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                    <Button
                      size="sm"
                      variant={
                        stu.deployment_status === "Deployed"
                          ? "outline-danger"
                          : "outline-success"
                      }
                      className="me-2"
                      onClick={() => toggleDeployment(stu)}
                    >
                      {stu.deployment_status === "Deployed"
                        ? "Unmark"
                        : "Mark Deployed"}
                    </Button>
                    <Button
                      size="sm"
                      variant="warning"
                      className="me-2"
                      onClick={() => handleEdit(stu)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(stu.student_id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="text-center">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Requirements Modal */}
      <Modal show={showReqModal} onHide={() => setShowReqModal(false)} size="md">
        <Modal.Header closeButton>
          <Modal.Title>
            Requirements for {selectedStudent?.full_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {requirements.length ? (
            <>
              <Table bordered hover>
                <thead className="table-light">
                  <tr>
                    <th>Requirement</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.map((req) => (
                    <tr key={req.requirement_id}>
                      <td>{req.requirement_name}</td>
                      <td>
                        <span
                          className={`badge ${
                            req.status === "Completed" || req.status === "Submitted"
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <h6 className="mt-3">Overall Progress</h6>
              <ProgressBar
                now={getProgress(requirements)}
                label={`${getProgress(requirements)}%`}
                variant={
                  getProgress(requirements) === 100 ? "success" : "info"
                }
              />
            </>
          ) : (
            <p className="text-center text-muted">No requirements found.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReqModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? "Edit Student" : "Add Student"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
                <Form.Group className="mb-2">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Student No</Form.Label>
              <Form.Control
                value={formData.student_no}
                onChange={(e) =>
                  setFormData({ ...formData, student_no: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Course</Form.Label>
              <Form.Control
                value={formData.course}
                onChange={(e) =>
                  setFormData({ ...formData, course: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Year Level</Form.Label>
              <Form.Control
                value={formData.year_level}
                onChange={(e) =>
                  setFormData({ ...formData, year_level: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Section</Form.Label>
              <Form.Control
                value={formData.section}
                onChange={(e) =>
                  setFormData({ ...formData, section: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Contact No</Form.Label>
              <Form.Control
                value={formData.contact_no}
                onChange={(e) =>
                  setFormData({ ...formData, contact_no: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Address</Form.Label>
              <Form.Control
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Company</Form.Label>
              <Form.Select
                value={formData.company_id}
                onChange={(e) =>
                  setFormData({ ...formData, company_id: e.target.value })
                }
              >
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>Deployment Status</Form.Label>
              <Form.Select
                value={formData.deployment_status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deployment_status: e.target.value,
                  })
                }
              >
                <option>Not Deployed</option>
                <option>Deployed</option>
                <option>Completed</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminStudents;
