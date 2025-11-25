import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Modal, Form, Table } from "react-bootstrap";

const API_URL = "http://localhost/ojt_monitoring/backend/api/admin/manage_placements.php";

function AdminPlacements() {
  const [placements, setPlacements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    student_id: "",
    company_id: "",
    advisor_id: "",
    status: "Ongoing"
  });

  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [advisors, setAdvisors] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [pRes, sRes, cRes, aRes] = await Promise.all([
        axios.get(API_URL),
        axios.get("http://localhost/ojt_monitoring/backend/api/admin/manage_students.php"),
        axios.get("http://localhost/ojt_monitoring/backend/api/admin/manage_companies.php"),
        axios.get("http://localhost/ojt_monitoring/backend/api/admin/manage_advisors.php"),
      ]);

      setPlacements(pRes.data.placements || []);
      setStudents(sRes.data.students || []);
      setCompanies(cRes.data.companies || []);
      setAdvisors(aRes.data.advisors || []);
    } catch (err) {
      console.error("Error fetching placement data:", err);
    }
  };

  const handleSave = async () => {
    try {
      if (editing) await axios.put(API_URL, { id: editing.id, ...formData });
      else await axios.post(API_URL, formData);

      fetchAllData();
      setShowModal(false);
      setEditing(null);
      setFormData({ student_id: "", company_id: "", advisor_id: "", status: "Ongoing" });
    } catch (err) {
      console.error("Error saving placement:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this placement?")) {
      await axios.delete(API_URL, { data: { id } });
      fetchAllData();
    }
  };

  const handleEdit = (placement) => {
    setEditing(placement);
    setFormData(placement);
    setShowModal(true);
  };

  return (
    <div className="container mt-4">
      <h3>Manage Placements</h3>
      <Button variant="primary" onClick={() => setShowModal(true)}>Add Placement</Button>

      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Student</th>
            <th>Company</th>
            <th>Advisor</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {placements.length ? placements.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.student_name}</td>
              <td>{p.company_name}</td>
              <td>{p.advisor_name}</td>
              <td>{p.status}</td>
              <td>
                <Button size="sm" variant="warning" onClick={() => handleEdit(p)}>Edit</Button>{" "}
                <Button size="sm" variant="danger" onClick={() => handleDelete(p.id)}>Delete</Button>
              </td>
            </tr>
          )) : <tr><td colSpan="6">No placements found.</td></tr>}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton><Modal.Title>{editing ? "Edit" : "Add"} Placement</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2"><Form.Label>Student</Form.Label>
              <Form.Select value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})}>
                <option value="">Select Student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2"><Form.Label>Company</Form.Label>
              <Form.Select value={formData.company_id} onChange={e => setFormData({...formData, company_id: e.target.value})}>
                <option value="">Select Company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2"><Form.Label>Advisor</Form.Label>
              <Form.Select value={formData.advisor_id} onChange={e => setFormData({...formData, advisor_id: e.target.value})}>
                <option value="">Select Advisor</option>
                {advisors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group><Form.Label>Status</Form.Label>
              <Form.Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option>Ongoing</option>
                <option>Completed</option>
                <option>Terminated</option>
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

export default AdminPlacements;
