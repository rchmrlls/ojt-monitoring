import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Button, Modal, Form, Table, Row, Col, InputGroup, Badge } from "react-bootstrap";
import { BuildingFill, Search, ChevronLeft, ChevronRight, PlusLg, CheckCircleFill, XCircleFill, PencilSquare, Trash } from "react-bootstrap-icons";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import SummaryCard from "../../components/SummaryCard";

const API_URL = "http://localhost/ojt_monitoring/backend/api/admin/manage_companies.php";

function AdminCompanies() {
  const navigate = useNavigate();
  
  // Data States
  const [companies, setCompanies] = useState([]);
  
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
    address: "",
    contact_person: "",
    contact_no: "",
    email: "",
    status: "Active",
  });

  // User Session
  const user = { name: "Admin" };

  //  Fetch Data 
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      if (res.data.success) setCompanies(res.data.data);
      else setCompanies([]);
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  //  Computed Stats 
  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'Active').length,
    inactive: companies.filter(c => c.status !== 'Active').length,
  };

  //  Filtering & Pagination 
  const filteredCompanies = companies.filter((company) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      company.name?.toLowerCase().includes(searchLower) ||
      company.email?.toLowerCase().includes(searchLower) ||
      company.contact_person?.toLowerCase().includes(searchLower)
    );
  });

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredCompanies.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredCompanies.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  //  Handlers 

  const handleSave = async () => {
    //  VALIDATION START 
    if (
      !formData.name.trim() || 
      !formData.address.trim() || 
      !formData.contact_person.trim() || 
      !formData.contact_no.trim() || 
      !formData.email.trim()
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in all required fields before saving.',
        confirmButtonColor: '#3085d6'
      });
      return; // Stop execution if validation fails
    }
    //  VALIDATION END 

    try {
      if (editing) {
        await axios.put(API_URL, { id: editing.id, ...formData });
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Company updated successfully!',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        await axios.post(API_URL, formData);
        Swal.fire({
          icon: 'success',
          title: 'Added!',
          text: 'Company added successfully!',
          timer: 1500,
          showConfirmButton: false
        });
      }
      fetchCompanies();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving company:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save company.',
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
        Swal.fire(
          'Deleted!',
          res.data.message || 'Company has been deleted.',
          'success'
        );
        fetchCompanies();
      } catch (err) {
        console.error("Error deleting company:", err);
        Swal.fire(
          'Error!',
          'Failed to delete company.',
          'error'
        );
      }
    }
  };

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
    <div className="d-flex" style={{ backgroundColor: "#f8f9fa" }}>
      <Sidebar />
      
      <div className="flex-grow-1" style={{ marginLeft: "260px", minHeight: "100vh", padding: "0" }}>
        <Navbar user={user} />
        
        <div className="container-fluid px-4">
          
          {/* Stats Row */}
          <Row className="g-4 mb-4">
            <Col xl={4} md={6}>
               <SummaryCard title="Total Companies" count={stats.total} color="primary" icon={BuildingFill} />
            </Col>
            <Col xl={4} md={6}>
               <SummaryCard title="Active Partners" count={stats.active} color="success" icon={CheckCircleFill} />
            </Col>
            <Col xl={4} md={6}>
               <SummaryCard title="Inactive" count={stats.inactive} color="secondary" icon={XCircleFill} />
            </Col>
          </Row>

          {/* Main Table Card */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
            
            {/* Header / Toolbar */}
            <div className="card-header bg-white py-4 px-4 border-0">
               <Row className="align-items-center g-3">
                  <Col md={4}>
                     <h5 className="mb-0 fw-bold text-dark">Company Management</h5>
                  </Col>
                  
                  <Col md={8}>
                     <div className="d-flex justify-content-md-end gap-2 flex-wrap">
                        <Button 
                            variant="primary" 
                            size="sm" 
                            className="d-flex align-items-center"
                            onClick={() => { resetForm(); setShowModal(true); }}
                        >
                            <PlusLg className="me-2" /> Add Company
                        </Button>

                        <InputGroup style={{ maxWidth: "250px" }}>
                           <InputGroup.Text className="bg-light border-end-0">
                              <Search className="text-muted" size={14} />
                           </InputGroup.Text>
                           <Form.Control
                              placeholder="Search company..."
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
                    <th className="ps-4 text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Company Info</th>
                    <th className="text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Contact Details</th>
                    <th className="text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Email</th>
                    <th className="text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Status</th>
                    <th className="text-center text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((c) => (
                      <tr key={c.id}>
                        <td className="ps-4">
                          <div className="d-flex flex-column">
                            <h6 className="mb-0 text-sm fw-bold text-dark">{c.name}</h6>
                            <p className="text-xs text-secondary mb-0">{c.address}</p>
                          </div>
                        </td>
                        <td>
                          <p className="text-xs font-weight-bold mb-0 text-dark">{c.contact_person}</p>
                          <p className="text-xs text-secondary mb-0">{c.contact_no}</p>
                        </td>
                        <td>
                            <span className="text-secondary text-xs font-weight-bold">{c.email}</span>
                        </td>
                        <td>
                            <Badge bg={c.status === "Active" ? "success" : "secondary"}>
                                {c.status}
                            </Badge>
                        </td>
                        <td className="text-center">
                          <Button size="sm" variant="light" className="text-warning me-2" onClick={() => handleEdit(c)} title="Edit">
                            <PencilSquare />
                          </Button>
                          <Button size="sm" variant="light" className="text-danger" onClick={() => handleDelete(c.id)} title="Delete">
                            <Trash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-5 text-muted">No companies found.</td></tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="card-footer bg-white py-3 px-4 border-top-0 d-flex flex-column flex-md-row justify-content-between align-items-center">
               <div className="text-muted small mb-2 mb-md-0">
                  Showing <strong>{indexOfFirstRow + 1}</strong> to <strong>{Math.min(indexOfLastRow, filteredCompanies.length)}</strong> of <strong>{filteredCompanies.length}</strong> entries
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
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>{editing ? "Edit Company" : "Add Company"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                                <Form.Control 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                    placeholder="Enter company name"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Address <span className="text-danger">*</span></Form.Label>
                                <Form.Control 
                                    value={formData.address} 
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                                    placeholder="Enter complete address"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Contact Person <span className="text-danger">*</span></Form.Label>
                                <Form.Control 
                                    value={formData.contact_person} 
                                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} 
                                    placeholder="Name of representative"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Contact No <span className="text-danger">*</span></Form.Label>
                                <Form.Control 
                                    value={formData.contact_no} 
                                    onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })} 
                                    placeholder="e.g., 0912 345 6789"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                <Form.Control 
                                    type="email" 
                                    value={formData.email} 
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                                    placeholder="company@example.com"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    <option>Active</option>
                                    <option>Deactivated</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
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

export default AdminCompanies;