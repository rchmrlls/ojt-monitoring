import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Button, Modal, Form, Table, Row, Col, InputGroup, Badge } from "react-bootstrap";
import { ListCheck, Search, ChevronLeft, ChevronRight, PlusLg, PencilSquare, Trash, CheckCircleFill, ExclamationCircleFill } from "react-bootstrap-icons";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import SummaryCard from "../../components/SummaryCard";
import api from "../../services/api"; 

const API_ENDPOINT = "/admin/requirements_crud.php";

function AdminRequirements() {
  const navigate = useNavigate();
  
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_required: 1, // Default to Mandatory (1)
  });

  const user = { name: "Admin" };

  // --- FETCH DATA ---
  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINT);
      if (res.data.success) {
        setRequirements(res.data.data || []);
      } else {
        setRequirements([]);
      }
    } catch (err) {
      console.error("Error fetching requirements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  // --- STATS ---
  const stats = {
    total: requirements.length,
    // Check against 1 (Mandatory) and 0 (Optional)
    mandatory: requirements.filter(r => parseInt(r.is_required) === 1).length,
    optional: requirements.filter(r => parseInt(r.is_required) === 0).length,
  };

  // --- FILTERING ---
  const filteredRequirements = requirements.filter((req) => {
    const searchLower = searchTerm.toLowerCase();
    const typeText = parseInt(req.is_required) === 1 ? "mandatory" : "optional";
    return (
      req.name?.toLowerCase().includes(searchLower) ||
      req.description?.toLowerCase().includes(searchLower) ||
      typeText.includes(searchLower)
    );
  });

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRequirements.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredRequirements.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- HANDLERS ---

  const handleSave = async () => {
    if (!formData.name.trim()) {
        Swal.fire({ icon: 'warning', title: 'Missing Fields', text: 'Name is required.' });
        return;
    }

    try {
      const payload = {
          name: formData.name,
          description: formData.description,
          is_required: formData.is_required
      };

      if (editing) {
        await api.put(API_ENDPOINT, { id: editing.id, ...payload });
        Swal.fire('Updated!', 'Requirement updated.', 'success');
      } else {
        await api.post(API_ENDPOINT, payload);
        Swal.fire('Added!', 'Requirement added.', 'success');
      }

      fetchRequirements();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving:", err);
      Swal.fire('Error', 'Failed to save.', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This won't delete student uploads, but will remove the requirement from the list.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await api.delete(API_ENDPOINT, { data: { id } });
        if (res.data.success) {
            Swal.fire('Deleted!', 'Requirement deleted.', 'success');
            fetchRequirements();
        } else {
            Swal.fire('Error!', res.data.message, 'error');
        }
      } catch (err) {
        Swal.fire('Error!', 'Failed to delete.', 'error');
      }
    }
  };

  const handleEdit = (req) => {
    setEditing(req);
    setFormData({
      name: req.name || "",
      description: req.description || "",
      is_required: parseInt(req.is_required), // Ensure int
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({ name: "", description: "", is_required: 1 });
  };

  return (
    <div className="d-flex" style={{ backgroundColor: "#f8f9fa" }}>
      <Sidebar />
      <div className="flex-grow-1" style={{ marginLeft: "260px", minHeight: "100vh", padding: "0" }}>
        <Navbar user={user} />
        
        <div className="container-fluid px-4">
          {/* Stats */}
          <Row className="g-4 mb-4">
            <Col xl={4}><SummaryCard title="Total" count={stats.total} color="primary" icon={ListCheck} /></Col>
            <Col xl={4}><SummaryCard title="Mandatory" count={stats.mandatory} color="danger" icon={ExclamationCircleFill} /></Col>
            <Col xl={4}><SummaryCard title="Optional" count={stats.optional} color="info" icon={CheckCircleFill} /></Col>
          </Row>

          {/* Table Card */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
            <div className="card-header bg-white py-4 px-4 border-0">
               <Row className="align-items-center g-3">
                  <Col md={4}><h5 className="mb-0 fw-bold text-dark">Manage Requirements</h5></Col>
                  <Col md={8}>
                     <div className="d-flex justify-content-md-end gap-2">
                        <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowModal(true); }}>
                            <PlusLg className="me-2" /> Add Requirement
                        </Button>
                        <InputGroup style={{ maxWidth: "250px" }}>
                           <InputGroup.Text className="bg-light border-end-0"><Search size={14} /></InputGroup.Text>
                           <Form.Control placeholder="Search..." className="bg-light border-start-0" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                        </InputGroup>
                     </div>
                  </Col>
               </Row>
            </div>

            <div className="table-responsive">
              <Table hover className="table align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4 text-secondary text-xs font-weight-bolder opacity-7">Name</th>
                    <th className="text-secondary text-xs font-weight-bolder opacity-7">Description</th>
                    <th className="text-secondary text-xs font-weight-bolder opacity-7">Type</th>
                    <th className="text-center text-secondary text-xs font-weight-bolder opacity-7">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((req) => (
                      <tr key={req.id}>
                        <td className="ps-4"><h6 className="mb-0 text-sm fw-bold text-dark">{req.name}</h6></td>
                        <td><p className="text-xs text-secondary mb-0 text-truncate" style={{maxWidth: "300px"}}>{req.description}</p></td>
                        <td>
                            <Badge bg={parseInt(req.is_required) === 1 ? "danger" : "info"}>
                                {parseInt(req.is_required) === 1 ? "Mandatory" : "Optional"}
                            </Badge>
                        </td>
                        <td className="text-center">
                          <Button size="sm" variant="light" className="text-warning me-2" onClick={() => handleEdit(req)}><PencilSquare /></Button>
                          <Button size="sm" variant="light" className="text-danger" onClick={() => handleDelete(req.id)}><Trash /></Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="text-center py-5 text-muted">No requirements found.</td></tr>
                  )}
                </tbody>
              </Table>
            </div>
            
            {/* Pagination (Simplified for brevity) */}
            <div className="card-footer bg-white py-3 px-4 border-top-0 d-flex justify-content-between align-items-center">
               <div className="text-muted small">Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredRequirements.length)} of {filteredRequirements.length}</div>
               <div className="d-flex gap-1">
                  <Button variant="light" size="sm" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft /></Button>
                  <Button variant="light" size="sm" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight /></Button>
               </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton><Modal.Title>{editing ? "Edit Requirement" : "Add Requirement"}</Modal.Title></Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Type</Form.Label>
                        <Form.Select value={formData.is_required} onChange={(e) => setFormData({ ...formData, is_required: parseInt(e.target.value) })}>
                            <option value={1}>Mandatory</option>
                            <option value={0}>Optional</option>
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
    </div>
  );
}

export default AdminRequirements;