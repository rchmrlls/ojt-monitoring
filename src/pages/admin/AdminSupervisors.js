import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Modal, Form, Table } from "react-bootstrap";

const API_URL = "http://localhost/ojt_monitoring/backend/api/admin/manage_supervisors.php";

function AdminSupervisors() {
  const [supervisors, setSupervisors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", company: "", status: "Active" });

  const fetchSupervisors = async () => {
    try {
      const res = await axios.get(API_URL);
      setSupervisors(res.data.supervisors || []);
    } catch (err) {
      console.error("Error fetching supervisors:", err);
    }
  };

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const handleSave = async () => {
    try {
      if (editing) await axios.put(API_URL, { id: editing.id, ...formData });
      else await axios.post(API_URL, formData);
      fetchSupervisors();
      setShowModal(false);
      setEditing(null);
      setFormData({ name: "", email: "", company: "", status: "Active" });
    } catch (err) {
      console.error("Error saving supervisor:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supervisor?")) {
      await axios.delete(API_URL, { data: { id } });
      fetchSupervisors();
    }
  };

  const handleEdit = (supervisor) => {
    setEditing(supervisor);
    setFormData(supervisor);
    setShowModal(true);
  };

  return (
    <div className="container mt-4">
      <h3>Manage Supervisors</h3>
      <Button variant="primary" onClick={() => setShowModal(true)}>Add Supervisor</Button>

      <Table striped bordered hover className="mt-3">
        <thead>
          <tr><th>ID</th><th>Name</th><th>Email</th><th>Company</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {supervisors.length ? supervisors.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.company}</td>
              <td>{s.status}</td>
              <td>
                <Button size="sm" variant="warning" onClick={() => handleEdit(s)}>Edit</Button>{" "}
                <Button size="sm" variant="danger" onClick={() => handleDelete(s.id)}>Delete</Button>
              </td>
            </tr>
          )) : <tr><td colSpan="6">No supervisors found.</td></tr>}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton><Modal.Title>{editing ? "Edit" : "Add"} Supervisor</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2"><Form.Label>Name</Form.Label>
              <Form.Control value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2"><Form.Label>Email</Form.Label>
              <Form.Control value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2"><Form.Label>Company</Form.Label>
              <Form.Control value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
            </Form.Group>
            <Form.Group><Form.Label>Status</Form.Label>
              <Form.Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option>Active</option><option>Deactivated</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminSupervisors;
