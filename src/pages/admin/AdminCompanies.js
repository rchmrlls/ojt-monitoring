import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Modal, Form, Table } from "react-bootstrap";

const API_URL = "http://localhost/ojt_monitoring/backend/api/admin/manage_companies.php";

function AdminCompanies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact_person: "",
    contact_no: "",
    email: "",
    status: "Active",
  });

  // ✅ Fetch all companies
  const fetchCompanies = async () => {
    try {
      const res = await axios.get(API_URL);
      if (res.data.success) setCompanies(res.data.data);
      else setCompanies([]);
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // ✅ Save (Add or Update)
  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(API_URL, { id: editing.id, ...formData });
        alert("Company updated successfully!");
      } else {
        await axios.post(API_URL, formData);
        alert("Company added successfully!");
      }
      fetchCompanies();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving company:", err);
      alert("Failed to save company.");
    }
  };

  // ✅ Delete company
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      try {
        const res = await axios.delete(API_URL, { data: { id } });
        alert(res.data.message);
        fetchCompanies();
      } catch (err) {
        console.error("Error deleting company:", err);
      }
    }
  };

  // ✅ Edit company
  const handleEdit = (company) => {
    setEditing(company);
    setFormData({
      name: company.name || "",
      address: company.address || "",
      contact_person: company.contact_person || "",
      contact_no: company.contact_no || "",
      email: company.email || "",
      status: company.status || "Active",
    });
    setShowModal(true);
  };

  // ✅ Reset form
  const resetForm = () => {
    setEditing(null);
    setFormData({
      name: "",
      address: "",
      contact_person: "",
      contact_no: "",
      email: "",
      status: "Active",
    });
  };

  return (
    <div className="container mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="text-primary fw-bold">Manage Companies</h3>
                
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
                Add Company
              </Button>

      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Company Name</th>
            <th>Address</th>
            <th>Contact Person</th>
            <th>Contact No</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.length ? (
            companies.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.address}</td>
                <td>{c.contact_person}</td>
                <td>{c.contact_no}</td>
                <td>{c.email}</td>
                <td>{c.status}</td>
                <td>
                  <Button size="sm" variant="warning" onClick={() => handleEdit(c)}>
                    Edit
                  </Button>{" "}
                  <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center">
                No companies found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? "Edit Company" : "Add Company"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Company Name</Form.Label>
              <Form.Control
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address</Form.Label>
              <Form.Control
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Contact Person</Form.Label>
              <Form.Control
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Contact No</Form.Label>
              <Form.Control
                value={formData.contact_no}
                onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
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

export default AdminCompanies;
