import React, { useEffect, useState } from "react";
import { Button, Modal, Table, ProgressBar, Form, Row, Col, InputGroup } from "react-bootstrap";
import { PeopleFill, PersonBadgeFill, BuildingFill, FileEarmarkTextFill, ExclamationCircleFill, CheckCircleFill, ClockFill, Search, ChevronLeft, ChevronRight } from "react-bootstrap-icons"; 
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import SummaryCard from "../components/SummaryCard";
import api from "../services/api";

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingReviews: 0,
    advisors: 0,
    companies: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [showReqModal, setShowReqModal] = useState(false);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, advisorsRes, companiesRes] = await Promise.all([
          api.get("/admin/manage_students.php"),
          api.get("/admin/manage_advisors.php"),
          api.get("/admin/manage_companies.php"),
        ]);

        const studentsData = studentsRes.data?.data || [];
        setStudents(studentsData);

        const totalPending = studentsData.reduce((sum, stu) => sum + (parseInt(stu.pending_files) || 0), 0);

        setStats({
          totalStudents: studentsData.length,
          pendingReviews: totalPending,
          advisors: advisorsRes.data?.data?.length || 0,
          companies: companiesRes.data?.data?.length || 0,
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // Filter Data based on Search
  const filteredStudents = students.filter((stu) => {
    const searchLower = searchTerm.toLowerCase();
    return (
        stu.full_name.toLowerCase().includes(searchLower) ||
        stu.student_no?.toLowerCase().includes(searchLower) ||
        stu.email?.toLowerCase().includes(searchLower) ||
        stu.company_name?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate Index
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredStudents.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);

  // Change Page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // View, Update, Format Functions
  const viewRequirements = async (student) => {
    try {
        const res = await api.get("/admin/manage_requirements.php", { params: { student_id: student.student_id } });
        if (res.data.success) {
          setSelectedStudent(student);
          setRequirements(res.data.data);
          setShowReqModal(true);
        } else { alert(res.data.message || "No requirements found."); }
      } catch (err) { console.error("Error loading requirements:", err); }
  };

  const handleStatusUpdate = async (requirementId, newStatus) => {
     if (!selectedStudent) return;
    try {
      const res = await api.put("/admin/manage_requirements.php", {
        student_id: selectedStudent.student_id,
        requirement_id: requirementId,
        status: newStatus,
      });
      if (res.data.success) { viewRequirements(selectedStudent); } 
      else { alert("Failed to update status: " + res.data.message); }
    } catch (err) { console.error("Error updating status:", err); }
  };

  const getProgress = (reqs) => {
    const total = reqs.length || 0;
    const completed = reqs.filter((r) => r.status === "Completed" || r.status === "Submitted").length;
    return total ? Math.round((completed / total) * 100) : 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getFileName = (path) => {
    if (!path) return "";
    return path.split('/').pop();
  };

  return (
    <div className="d-flex" style={{ backgroundColor: "#f8f9fa" }}>
      <Sidebar />
      <div className="flex-grow-1" style={{ marginLeft: "260px", minHeight: "100vh", padding: "0" }}>
        <Navbar user={{ name: "Admin" }} />
        
        <div className="container-fluid px-4">
          
          {/* Stats Row */}
          <Row className="g-4 mb-5">
            <Col xl={3} md={6}>
               <SummaryCard title="Files to Review" count={stats.pendingReviews} color={stats.pendingReviews > 0 ? "danger" : "success"} icon={stats.pendingReviews > 0 ? ExclamationCircleFill : CheckCircleFill} />
            </Col>
            <Col xl={3} md={6}>
               <SummaryCard title="Total Students" count={stats.totalStudents} color="primary" icon={PeopleFill} />
            </Col>
            <Col xl={3} md={6}>
               <SummaryCard title="Active Advisors" count={stats.advisors} color="info" icon={PersonBadgeFill} />
            </Col>
            <Col xl={3} md={6}>
               <SummaryCard title="Partner Companies" count={stats.companies} color="warning" icon={BuildingFill} />
            </Col>
          </Row>

          {/* Table Card */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
            
            {/* Table Header */}
            <div className="card-header bg-white py-4 px-4 border-0">
               <Row className="align-items-center g-3">
                  <Col md={4}>
                     <h5 className="mb-0 fw-bold text-dark">OJT File Monitoring</h5>
                  </Col>
                  
                  {/* Search and Rows */}
                  <Col md={8}>
                     <div className="d-flex justify-content-md-end gap-3">
                        {/* Rows Per Page */}
                        <div className="d-flex align-items-center">
                           <span className="text-muted small me-2">Show</span>
                           <Form.Select 
                              size="sm" 
                              className="border-light bg-light fw-semibold" 
                              style={{ width: "70px" }}
                              value={rowsPerPage}
                              onChange={(e) => {
                                 setRowsPerPage(Number(e.target.value));
                                 setCurrentPage(1);
                              }}
                           >
                              <option value="5">5</option>
                              <option value="10">10</option>
                              <option value="25">25</option>
                              <option value="50">50</option>
                           </Form.Select>
                        </div>

                        {/* Search Bar */}
                        <InputGroup style={{ maxWidth: "250px" }}>
                           <InputGroup.Text className="bg-light border-end-0">
                              <Search className="text-muted" size={14} />
                           </InputGroup.Text>
                           <Form.Control
                              placeholder="Search student..."
                              className="bg-light border-start-0 ps-0"
                              value={searchTerm}
                              onChange={(e) => {
                                 setSearchTerm(e.target.value);
                                 setCurrentPage(1);
                              }}
                           />
                        </InputGroup>
                     </div>
                  </Col>
               </Row>
            </div>
            
            <div className="table-responsive">
              <Table hover className="table align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4 text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Student</th>
                    <th className="text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Course Details</th>
                    <th className="text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Company</th>
                    <th className="text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Submission Status</th>
                    <th className="text-center text-uppercase text-secondary text-xs font-weight-bolder opacity-7">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((stu) => (
                      <tr key={stu.student_id} className={stu.pending_files > 0 ? "bg-danger bg-opacity-10" : ""}>
                        <td className="ps-4">
                          <div className="d-flex flex-column justify-content-center">
                            <h6 className="mb-0 text-sm fw-bold text-dark">{stu.full_name}</h6>
                            <p className="text-xs text-secondary mb-0">{stu.email}</p>
                          </div>
                        </td>
                        <td>
                          <p className="text-xs font-weight-bold mb-0 text-dark">{stu.course}</p>
                          <p className="text-xs text-secondary mb-0">{stu.year_level} - {stu.section}</p>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                             <BuildingFill className="me-2 text-secondary" size={12}/>
                             <span className="text-sm text-secondary font-weight-bold">{stu.company_name || "Not Assigned"}</span>
                          </div>
                        </td>
                        <td>
                          {stu.pending_files > 0 ? (
                            <span className="badge badge-soft-danger d-inline-flex align-items-center">
                              <ClockFill className="me-1" /> {stu.pending_files} Pending Review
                            </span>
                          ) : (
                            <span className="badge badge-soft-success d-inline-flex align-items-center">
                              <CheckCircleFill className="me-1" /> Up to date
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          <Button 
                            size="sm" 
                            variant={stu.pending_files > 0 ? "primary" : "light"} 
                            className="rounded-pill px-3 fw-bold" 
                            onClick={() => viewRequirements(stu)}
                          >
                            {stu.pending_files > 0 ? "Review Now" : "View Files"}
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-5 text-muted">No students found matching your search.</td></tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* Pagination Footer */}
            <div className="card-footer bg-white py-3 px-4 border-top-0 d-flex flex-column flex-md-row justify-content-between align-items-center">
               <div className="text-muted small mb-2 mb-md-0">
                  Showing <strong>{indexOfFirstRow + 1}</strong> to <strong>{Math.min(indexOfLastRow, filteredStudents.length)}</strong> of <strong>{filteredStudents.length}</strong> entries
               </div>
               
               <div className="d-flex gap-1">
                  <Button 
                     variant="light" 
                     size="sm" 
                     className="border"
                     onClick={() => paginate(currentPage - 1)} 
                     disabled={currentPage === 1}
                  >
                     <ChevronLeft size={12} />
                  </Button>
                  
                  {/* Page Numbers */}
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

                  <Button 
                     variant="light" 
                     size="sm" 
                     className="border"
                     onClick={() => paginate(currentPage + 1)} 
                     disabled={currentPage === totalPages}
                  >
                     <ChevronRight size={12} />
                  </Button>
               </div>
            </div>

          </div>
        </div>

        {/* Modal */}
        <Modal show={showReqModal} onHide={() => setShowReqModal(false)} size="xl" centered contentClassName="border-0 shadow-lg rounded-4">
          <Modal.Header closeButton className="border-bottom-0 pb-0">
            <Modal.Title className="fw-bold">
              File Monitor: <span className="text-primary">{selectedStudent?.full_name}</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {requirements.length ? (
               <>
                  <div className="mb-4 p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                     <div>
                        <small className="text-muted fw-bold text-uppercase">Current Progress</small>
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
                        <th style={{ width: "130px" }}>Status</th>
                        <th>Date Submitted</th>
                        <th>File</th>
                        <th style={{ width: "220px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requirements.map((req) => (
                        <tr key={req.requirement_id} className={req.status === "Submitted" ? "table-warning" : ""}>
                          <td className="fw-medium">{req.requirement_name}</td>
                          <td>
                            <span className={`badge ${
                                req.status === "Completed" ? "bg-success" : 
                                req.status === "Submitted" ? "bg-warning text-dark" : "bg-secondary"
                              } rounded-pill px-3`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="text-muted small">
                            {req.status === "Pending" ? "—" : formatDate(req.uploaded_at || req.submitted_at)}
                          </td>
                          <td>
                             {req.file_path ? (
                              <a href={`http://localhost/ojt_monitoring/backend/${req.file_path}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-white border shadow-sm text-primary fw-bold">
                                <FileEarmarkTextFill className="me-2"/>
                                {getFileName(req.file_path)}
                              </a>
                            ) : <span className="text-muted small fst-italic">No file uploaded</span>}
                          </td>
                          <td>
                            <Form.Select 
                              size="sm" 
                              value={req.status} 
                              className={`border-0 fw-bold ${req.status === 'Submitted' ? 'bg-warning bg-opacity-25 text-dark' : 'bg-light text-secondary'}`}
                              onChange={(e) => handleStatusUpdate(req.requirement_id, e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Submitted">Submitted</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Completed">Verified / Completed</option>
                            </Form.Select>
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

      </div>
    </div>
  );
};

export default Dashboard;