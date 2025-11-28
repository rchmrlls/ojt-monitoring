import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Button, Modal, Form, Table, ProgressBar, Row, Col, InputGroup, Badge } from "react-bootstrap";
import { PeopleFill, PersonBadgeFill, BuildingFill, Search, ChevronLeft, ChevronRight, PlusLg, ArrowCounterclockwise, FileEarmarkTextFill, BriefcaseFill, ExclamationCircleFill } from "react-bootstrap-icons";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import SummaryCard from "../../components/SummaryCard";

// API Endpoints
const API_URL = "http://localhost/ojt_monitoring/backend/api/admin/manage_students.php";
const COMPANY_URL = "http://localhost/ojt_monitoring/backend/api/admin/manage_companies.php";
const REQ_URL = "http://localhost/ojt_monitoring/backend/api/admin/manage_requirements.php";
const RESET_URL = "http://localhost/ojt_monitoring/backend/api/admin/reset_weekly_reports.php";
const FILE_BASE_URL = "http://localhost/ojt_monitoring/backend";

function AdminStudents() {
  const navigate = useNavigate();
  
  // Data States
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [requirements, setRequirements] = useState([]);

  // Form State
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

  //  Fetch Data 
  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, companiesRes] = await Promise.all([
        axios.get(API_URL),
        axios.get(COMPANY_URL)
      ]);

      if (studentsRes.data.success) setStudents(studentsRes.data.data);
      if (companiesRes.data.success) setCompanies(companiesRes.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  //  Computed Stats 
  const stats = {
    total: students.length,
    deployed: students.filter(s => s.deployment_status === 'Deployed').length,
    pendingReviews: students.reduce((sum, stu) => sum + (parseInt(stu.pending_files) || 0), 0),
    completed: students.filter(s => s.deployment_status === 'Completed').length
  };

  //  Filtering & Pagination 
  const filteredStudents = students.filter((stu) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      stu.full_name.toLowerCase().includes(searchLower) ||
      stu.student_no?.toLowerCase().includes(searchLower) ||
      stu.email?.toLowerCase().includes(searchLower) ||
      stu.company_name?.toLowerCase().includes(searchLower)
    );
  });

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredStudents.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  //  Handlers 

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
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Missing student ID for update.'
          });
          return;
        }

        await axios.put(API_URL, payload);
        Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Student updated successfully!',
            timer: 1500,
            showConfirmButton: false
        });
      } else {
        const payload = { ...formData };
        const res = await axios.post(API_URL, payload);
        if (res.data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Added!',
                text: 'Student added successfully!',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: res.data.message
            });
        }
      }

      fetchData();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving student:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || "Failed to save student."
      });
    }
  };

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
                'Student has been deleted.',
                'success'
            );
            fetchData();
        } else {
            Swal.fire(
                'Error!',
                res.data.message,
                'error'
            );
        }
      } catch (err) {
        console.error("Error deleting student:", err);
        Swal.fire(
            'Error!',
            'Failed to delete student.',
            'error'
        );
      }
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      id: "", name: "", email: "", student_no: "", course: "", year_level: "",
      section: "", contact_no: "", address: "", company_id: "", deployment_status: "Not Deployed",
    });
  };

  const toggleDeployment = async (student) => {
    const newStatus = student.deployment_status === "Deployed" ? "Not Deployed" : "Deployed";
    
    const result = await Swal.fire({
        title: `Mark as ${newStatus}?`,
        text: `Are you sure you want to mark ${student.full_name} as ${newStatus}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!'
    });

    if (result.isConfirmed) {
        try {
          const res = await axios.put(API_URL, { id: student.student_id, deployment_status: newStatus });
          if (res.data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: `Student is now ${newStatus}.`,
                timer: 1500,
                showConfirmButton: false
            });
            fetchData();
          } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: res.data.message || "Failed to update deployment."
            });
          }
        } catch (err) {
          console.error("Error updating deployment:", err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: "An error occurred while updating deployment status."
          });
        }
    }
  };

  const viewRequirements = async (student) => {
    try {
      const res = await axios.get(REQ_URL, { params: { student_id: student.student_id } });
      if (res.data.success) {
        setSelectedStudent(student);
        setRequirements(res.data.data);
        setShowReqModal(true);
      } else {
        Swal.fire({
            icon: 'info',
            title: 'No Requirements',
            text: res.data.message
        });
      }
    } catch (err) {
      console.error("Error loading requirements:", err);
    }
  };

  const handleResetWeeklyReports = async () => {
    const result = await Swal.fire({
        title: 'Reset Weekly Reports?',
        text: "This will reset all weekly report statuses to 'Pending'. This action cannot be undone!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, reset all!'
    });

    if (result.isConfirmed) {
        try {
          const res = await axios.post(RESET_URL);
          if (res.data.success) {
            Swal.fire(
                'Reset!',
                'Weekly reports have been reset successfully.',
                'success'
            );
            fetchData();
          } else {
            Swal.fire(
                'Error!',
                res.data.message || "Reset failed.",
                'error'
            );
          }
        } catch (err) {
          console.error("Error resetting weekly reports:", err);
          Swal.fire(
            'Error!',
            'Server error while resetting reports.',
            'error'
          );
        }
    }
  };

  const getProgress = (reqs) => {
    const total = reqs.length || 0;
    const completed = reqs.filter(r => r.status === "Completed" || r.status === "Submitted").length;
    return total ? Math.round((completed / total) * 100) : 0;
  };

  const getFileName = (path) => (path ? path.split('/').pop() : "");

  //  Render 
  return (
    <div className="d-flex" style={{ backgroundColor: "#f8f9fa" }}>
      <Sidebar />
      
      <div className="flex-grow-1" style={{ marginLeft: "260px", minHeight: "100vh", padding: "0" }}>
        <Navbar user={{ name: "Admin" }} />
        
        <div className="container-fluid px-4">
          
          {/* Stats Row */}
          <Row className="g-4 mb-4">
            <Col xl={6}>
               <SummaryCard title="Total Students" count={stats.total} color="primary" icon={PeopleFill} />
            </Col>
            <Col xl={6}>
               <SummaryCard title="Deployed" count={stats.deployed} color="success" icon={BriefcaseFill} />
            </Col>
            {/*<Col xl={4}>
               <SummaryCard title="Pending Files" count={stats.pendingReviews} color="danger" icon={ExclamationCircleFill} />
            </Col>
            <Col xl={4}>
               <SummaryCard title="Completed Requirements" count={stats.completed} color="info" icon={PersonBadgeFill} />
            </Col>*/}
          </Row>

          {/* Main Table Card */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
            
            {/* Header / Toolbar */}
            <div className="card-header bg-white py-4 px-4 border-0">
               <Row className="align-items-center g-3">
                  <Col md={4}>
                     <h5 className="mb-0 fw-bold text-dark">Student Management</h5>
                  </Col>
                  
                  <Col md={8}>
                     <div className="d-flex justify-content-md-end gap-2 flex-wrap">
                        {/* Actions */}
                        <Button 
                            variant="primary" 
                            size="sm" 
                            className="d-flex align-items-center"
                            onClick={() => { resetForm(); setShowModal(true); }}
                        >
                            <PlusLg className="me-2" /> Add Student
                        </Button>
                        <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="d-flex align-items-center"
                            onClick={handleResetWeeklyReports}
                        >
                            <ArrowCounterclockwise className="me-2" /> Reset Reports
                        </Button>

                        {/* Search */}
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
                    <th className="ps-4 text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Student Info</th>
                    <th className="text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Academic Details</th>
                    <th className="text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Company</th>
                    <th className="text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Status</th>
                    <th className="text-center text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((stu) => (
                      <tr key={stu.student_id}>
                        <td className="ps-4">
                          <div className="d-flex flex-column">
                            <h6 className="mb-0 text-sm fw-bold text-dark">{stu.full_name}</h6>
                            <p className="text-xs text-secondary mb-0">{stu.student_no}</p>
                            <p className="text-xs text-muted mb-0">{stu.email}</p>
                          </div>
                        </td>
                        <td>
                          <p className="text-xs font-weight-bold mb-0 text-dark">{stu.course}</p>
                          <p className="text-xs text-secondary mb-0">{stu.year_level} - {stu.section}</p>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                             <BuildingFill className="me-2 text-secondary" size={12}/>
                             <span className="text-sm text-secondary font-weight-bold text-truncate" style={{maxWidth: '150px'}}>
                                {stu.company_name || "Not Assigned"}
                             </span>
                          </div>
                        </td>
                        <td>
                            <Badge bg={stu.deployment_status === "Deployed" ? "success" : stu.deployment_status === "Completed" ? "info" : "secondary"}>
                                {stu.deployment_status}
                            </Badge>
                            {stu.pending_files > 0 && (
                                <div className="mt-1">
                                    <Badge bg="danger" className="fw-normal text-xs">
                                        {stu.pending_files} Files Pending
                                    </Badge>
                                </div>
                            )}
                        </td>
                        <td className="text-center">
                            <div className="d-flex justify-content-center gap-1">
                                <Button size="sm" variant="light" className="border" onClick={() => viewRequirements(stu)} title="View Files">
                                    <FileEarmarkTextFill />
                                </Button>
                                <Button size="sm" variant="light" className="border text-primary" onClick={() => handleEdit(stu)} title="Edit Info">
                                    Edit
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant={stu.deployment_status === "Deployed" ? "light" : "success"} 
                                    className={`border ${stu.deployment_status === "Deployed" ? "text-danger" : ""}`}
                                    onClick={() => toggleDeployment(stu)}
                                    title="Toggle Deployment"
                                >
                                    {stu.deployment_status === "Deployed" ? "Un-deploy" : "Deploy"}
                                </Button>
                                <Button size="sm" variant="light" className="border text-danger" onClick={() => handleDelete(stu.student_id)} title="Delete">
                                    Del
                                </Button>
                            </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-5 text-muted">No students found.</td></tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="card-footer bg-white py-3 px-4 border-top-0 d-flex flex-column flex-md-row justify-content-between align-items-center">
               <div className="text-muted small mb-2 mb-md-0">
                  Showing <strong>{indexOfFirstRow + 1}</strong> to <strong>{Math.min(indexOfLastRow, filteredStudents.length)}</strong> of <strong>{filteredStudents.length}</strong> entries
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

        {/* Requirements Modal */}
        <Modal show={showReqModal} onHide={() => setShowReqModal(false)} size="lg" centered contentClassName="border-0 shadow-lg rounded-4">
            <Modal.Header closeButton className="border-bottom-0 pb-0">
                <Modal.Title className="fw-bold">File Monitor: <span className="text-primary">{selectedStudent?.full_name}</span></Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                {requirements.length ? (
                    <>
                        <div className="mb-4 p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                            <div>
                                <small className="text-muted fw-bold text-uppercase">Progress</small>
                                <h4 className="text-primary fw-bold mb-0">{getProgress(requirements)}% Completed</h4>
                            </div>
                            <div style={{width: '200px'}}>
                                <ProgressBar now={getProgress(requirements)} variant="success" style={{ height: "6px" }} />
                            </div>
                        </div>
                        <Table bordered hover className="align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Requirement</th>
                                    <th>Status</th>
                                    <th>File</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requirements.map((req) => (
                                    <tr key={req.requirement_id}>
                                        <td className="fw-medium">{req.requirement_name}</td>
                                        <td>
                                            <Badge bg={req.status === "Completed" ? "success" : req.status === "Submitted" ? "warning" : "secondary"} text={req.status === "Submitted" ? "dark" : "light"}>
                                                {req.status}
                                            </Badge>
                                        </td>
                                        <td>
                                            {req.file_path ? (
                                                <a href={`${FILE_BASE_URL}/${req.file_path}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-light border text-primary fw-bold">
                                                    <FileEarmarkTextFill className="me-2"/> View File
                                                </a>
                                            ) : <span className="text-muted small fst-italic">No file</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </>
                ) : <p className="text-center text-muted py-5">No requirements found.</p>}
            </Modal.Body>
            <Modal.Footer className="border-top-0 pt-0">
                <Button variant="light" onClick={() => setShowReqModal(false)}>Close</Button>
            </Modal.Footer>
        </Modal>

        {/* Add/Edit Student Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>{editing ? "Edit Student" : "Add New Student"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Full Name</Form.Label>
                                <Form.Control value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>USN</Form.Label>
                                <Form.Control value={formData.student_no} onChange={(e) => setFormData({ ...formData, student_no: e.target.value })} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Course</Form.Label>
                                <Form.Control value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })} />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-3">
                                <Form.Label>Year</Form.Label>
                                <Form.Select value={formData.year_level} onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}>
                                    <option value="">Select</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-3">
                                <Form.Label>Section</Form.Label>
                                <Form.Control value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Contact No.</Form.Label>
                                <Form.Control value={formData.contact_no} onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Address</Form.Label>
                                <Form.Control value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Assign Company</Form.Label>
                                <Form.Select value={formData.company_id} onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}>
                                    <option value="">-- Select Company --</option>
                                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Deployment Status</Form.Label>
                                <Form.Select value={formData.deployment_status} onChange={(e) => setFormData({ ...formData, deployment_status: e.target.value })}>
                                    <option>Not Deployed</option>
                                    <option>Deployed</option>
                                    <option>Completed</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSave}>Save Student</Button>
            </Modal.Footer>
        </Modal>

      </div>
    </div>
  );
}

export default AdminStudents;