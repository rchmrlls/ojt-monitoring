import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Button, Modal, Form, Table, Row, Col, InputGroup, Badge } from "react-bootstrap";
import { ListCheck, Search, ChevronLeft, ChevronRight, PlusLg, PencilSquare, Trash, CheckCircleFill, ExclamationCircleFill } from "react-bootstrap-icons";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import SummaryCard from "../../components/SummaryCard";

const API_URL = "http://localhost/ojt_monitoring/backend/api/admin/manage_requirements.php";

function AdminRequirements() {
  const navigate = useNavigate();
  
  // Data States
  const [requirements, setRequirements] = useState([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "Mandatory", // Default value
  });

  // User Session
  const user = { name: "Admin" };

  //  Fetch Data 
  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      if (res.data.success) {
        setRequirements(res.data.data);
      } else {
        setRequirements([]);
      }
    } catch (err) {
      console.error("Error fetching requirements:", err);
      // Optionally show error alert
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  //  Computed Stats 
  const stats = {
    total: requirements.length,
    mandatory: requirements.filter(r => r.type === 'Mandatory').length,
    optional: requirements.filter(r => r.type === 'Optional').length,
  };

  //  Filtering & Pagination 
  const filteredRequirements = requirements.filter((req) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      req.name?.toLowerCase().includes(searchLower) ||
      req.description?.toLowerCase().includes(searchLower) ||
      req.type?.toLowerCase().includes(searchLower)
    );
  });

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRequirements.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredRequirements.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  //  Handlers 

  const handleSave = async () => {
    //  VALIDATION 
    if (!formData.name.trim()) {
        Swal.fire({
            icon: 'warning',
            title: 'Missing Fields',
            text: 'Requirement Name is required.',
            confirmButtonColor: '#3085d6'
        });
        return;
    }

    try {
      if (editing) {
        // Edit
        await axios.put(API_URL, {
          id: editing.id,
          name: formData.name,
          description: formData.description,
          type: formData.type
        });
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Requirement updated successfully!',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        // Add
        await axios.post(API_URL, {
          name: formData.name,
          description: formData.description,
          type: formData.type
        });
        Swal.fire({
          icon: 'success',
          title: 'Added!',
          text: 'Requirement added successfully!',
          timer: 1500,
          showConfirmButton: false
        });
      }

      fetchRequirements();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving requirement:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || "Failed to save requirement.",
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.delete(API_URL, { data: { id } });
        if (res.data.success) {
            Swal.fire(
                'Deleted!',
                'Requirement has been deleted.',
                'success'
            );
            fetchRequirements();
        } else {
            Swal.fire(
                'Error!',
                res.data.message || "Failed to delete.",
                'error'
            );
        }
      } catch (err) {
        console.error("Error deleting requirement:", err);
        Swal.fire(
          'Error!',
          'Failed to delete requirement.',
          'error'
        );
      }
    }
  };

  const handleEdit = (req) => {
    setEditing(req);
    setFormData({
      name: req.name || "",
      description: req.description || "",
      type: req.type || "Mandatory",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      name: "",
      description: "",
      type: "Mandatory",
    });
  };

  return (
    <div className="d-flex" style={{ backgroundColor: "#f8f9fa" }}>
      <Sidebar />
      
      <div className="flex-grow-1" style={{ marginLeft: "260px", minHeight: "100vh", padding: "0" }}>
        <Navbar user={user} />
        
        <div className="container-fluid px-4">
          
          {/* Stats Row */}
          <Row className="g-4 mb-4">
            <Col xl={4} md={6}>
               <SummaryCard title="Total Requirements" count={stats.total} color="primary" icon={ListCheck} />
            </Col>
            <Col xl={4} md={6}>
               <SummaryCard title="Mandatory" count={stats.mandatory} color="danger" icon={ExclamationCircleFill} />
            </Col>
            <Col xl={4} md={6}>
               <SummaryCard title="Optional" count={stats.optional} color="info" icon={CheckCircleFill} />
            </Col>
          </Row>

          {/* Main Table Card */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
            
            {/* Header / Toolbar */}
            <div className="card-header bg-white py-4 px-4 border-0">
               <Row className="align-items-center g-3">
                  <Col md={4}>
                     <h5 className="mb-0 fw-bold text-dark">Manage Requirements</h5>
                  </Col>
                  
                  <Col md={8}>
                     <div className="d-flex justify-content-md-end gap-2 flex-wrap">
                        <Button 
                            variant="primary" 
                            size="sm" 
                            className="d-flex align-items-center"
                            onClick={() => { resetForm(); setShowModal(true); }}
                        >
                            <PlusLg className="me-2" /> Add Requirement
                        </Button>

                        <InputGroup style={{ maxWidth: "250px" }}>
                           <InputGroup.Text className="bg-light border-end-0">
                              <Search className="text-muted" size={14} />
                           </InputGroup.Text>
                           <Form.Control
                              placeholder="Search..."
                              className="bg-light border-start-0 ps-0"
                              value={searchTerm}
                              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                           />
                        </InputGroup>
                     </div>
                  </Col>
               </Row>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <Table hover className="table align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4 text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Requirement Name</th>
                    <th className="text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Description</th>
                    <th className="text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Type</th>
                    <th className="text-center text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((req) => (
                      <tr key={req.id}>
                        <td className="ps-4">
                          <h6 className="mb-0 text-sm fw-bold text-dark">{req.name}</h6>
                        </td>
                        <td>
                          <p className="text-xs text-secondary mb-0 text-truncate" style={{maxWidth: "300px"}} title={req.description}>
                            {req.description || "No description"}
                          </p>
                        </td>
                        <td>
                            <Badge bg={req.type === "Mandatory" ? "danger" : "info"}>
                                {req.type}
                            </Badge>
                        </td>
                        <td className="text-center">
                          <Button size="sm" variant="light" className="text-warning me-2" onClick={() => handleEdit(req)} title="Edit">
                            <PencilSquare />
                          </Button>
                          <Button size="sm" variant="light" className="text-danger" onClick={() => handleDelete(req.id)} title="Delete">
                            <Trash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="text-center py-5 text-muted">No requirements found.</td></tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="card-footer bg-white py-3 px-4 border-top-0 d-flex flex-column flex-md-row justify-content-between align-items-center">
               <div className="text-muted small mb-2 mb-md-0">
                  Showing <strong>{indexOfFirstRow + 1}</strong> to <strong>{Math.min(indexOfLastRow, filteredRequirements.length)}</strong> of <strong>{filteredRequirements.length}</strong> entries
               </div>
               
               <div className="d-flex gap-1">
                  <Button variant="light" size="sm" className="border" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                     <ChevronLeft size={12} />
                  </Button>
                  {[...Array(totalPages)].map((_, index) => (
                     <Button
                        key={index}
                        variant={currentPage === index + 1 ? "primary" : "light"}
                        size="sm"
                        className={currentPage !== index + 1 ? "border text-muted" : "border-primary"}
                        onClick={() => paginate(index + 1)}
                     >
                        {index + 1}
                     </Button>
                  ))}
                  <Button variant="light" size="sm" className="border" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                     <ChevronRight size={12} />
                  </Button>
               </div>
            </div>
          </div>

        </div>

        {/* Add/Edit Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton>
                <Modal.Title>{editing ? "Edit Requirement" : "Add Requirement"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Requirement Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                            value={formData.name} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            placeholder="e.g., Accomplishment Report"
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3}
                            value={formData.description} 
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                            placeholder="Brief description of the requirement"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Type</Form.Label>
                        <Form.Select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                            <option value="Mandatory">Mandatory</option>
                            <option value="Optional">Optional</option>
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