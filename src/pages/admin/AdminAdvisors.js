import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Modal, Form, Table } from "react-bootstrap";

const API_URL = "http://localhost/ojt_monitoring/backend/api/admin/manage_advisors.php";

function AdminAdvisors() {
  const navigate = useNavigate();
  const [advisors, setAdvisors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    status: "Active",
  });

  // Fetch all advisors
  const fetchAdvisors = async () => {
    try {
      const res = await axios.get(API_URL);
      if (res.data.success) setAdvisors(res.data.data);
      else setAdvisors([]);
    } catch (err) {
      console.error("Error fetching advisors:", err);
    }
  };

  useEffect(() => {
    fetchAdvisors();
  }, []);

  // Add / Update
  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(API_URL, {
          id: editing.advisor_id,
          department: formData.department,
        });
        alert("Advisor updated successfully!");
      } else {
        const res = await axios.post(API_URL, {
          name: formData.name,
          email: formData.email,
          department: formData.department,
        });
        alert(res.data.message);
      }

      fetchAdvisors();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving advisor:", err);
      alert(err.response?.data?.message || "Failed to save advisor.");
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this advisor?")) {
      try {
        const res = await axios.delete(API_URL, { data: { id } });
        alert(res.data.message);
        fetchAdvisors();
      } catch (err) {
        console.error("Error deleting advisor:", err);
        alert("Failed to delete advisor.");
      }
    }
  };

  // Edit
  const handleEdit = (advisor) => {
    setEditing(advisor);
    setFormData({
      name: advisor.full_name || "",
      email: advisor.email || "",
      department: advisor.department || "",
      status: advisor.user_status || "Active",
    });
    setShowModal(true);
  };

  // Reset
  const resetForm = () => {
    setEditing(null);
    setFormData({
      name: "",
      email: "",
      department: "",
      status: "Active",
    });
  };

  return (
    <div className="container mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="text-primary fw-bold">Manage OJT advisors</h3>
            
            <Button variant="outline-primary" onClick={() => navigate("/dashboard")}>
              ← Back to Dashboard
            </Button>
          </div>
    
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            Add Advisor
          </Button>

      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {advisors.length ? (
            advisors.map((a) => (
              <tr key={a.advisor_id}>
                <td>{a.advisor_id}</td>
                <td>{a.full_name}</td>
                <td>{a.email}</td>
                <td>{a.department}</td>
                <td>{a.user_status}</td>
                <td>
                  <Button size="sm" variant="warning" onClick={() => handleEdit(a)}>
                    Edit
                  </Button>{" "}
                  <Button size="sm" variant="danger" onClick={() => handleDelete(a.advisor_id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                No advisors found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? "Edit Advisor" : "Add Advisor"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {!editing && (
              <>
                <Form.Group className="mb-2">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Form.Group>
              </>
            )}
            <Form.Group className="mb-2">
              <Form.Label>Department</Form.Label>
              <Form.Control
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option>Active</option>
                <option>Deactivated</option>
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

export default AdminAdvisors;
