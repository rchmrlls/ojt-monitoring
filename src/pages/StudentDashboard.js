import React, { useEffect, useState } from "react";
import { Table, ProgressBar, Button, Row, Col, Form, Badge } from "react-bootstrap";
import { 
  PersonFill, 
  BuildingFill, 
  EnvelopeFill, 
  CardChecklist, 
  FileEarmarkTextFill, 
  CheckCircleFill, 
  CloudUploadFill 
} from "react-bootstrap-icons";
import axios from "axios";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";

const API_BASE = "http://localhost/ojt_monitoring/backend/api";
const FILE_BASE_URL = "http://localhost/ojt_monitoring/backend"; 

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [studentId, setStudentId] = useState(null);

  const storedUser = JSON.parse(localStorage.getItem("user"));

  //  FETCH LOGIC
  useEffect(() => {
    const fetchStudentId = async () => {
      if (!storedUser) {
        alert("No user info found. Please log in again.");
        window.location.href = "/";
        return;
      }

      if (storedUser.student_id) {
        setStudentId(storedUser.student_id);
      } else if (storedUser.id) {
        try {
          const res = await axios.get(`${API_BASE}/student/get_student_id.php`, {
            params: { user_id: storedUser.id }
          });
          if (res.data.success && res.data.student_id) {
            setStudentId(res.data.student_id);
          } else {
            alert("Student record not found. Please contact admin.");
            return;
          }
        } catch (err) {
          console.error("Error fetching student_id:", err);
          alert("Failed to fetch student info.");
        }
      }
    };
    fetchStudentId();
  }, [storedUser]);

  useEffect(() => {
    if (!studentId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, reqRes] = await Promise.all([
          axios.get(`${API_BASE}/student/get_profile.php`, { params: { id: studentId } }),
          axios.get(`${API_BASE}/student/get_requirements.php`, { params: { student_id: studentId } }),
        ]);

        if (profileRes.data.success) setStudent(profileRes.data.data);
        if (reqRes.data.success) {
          setRequirements(reqRes.data.data);
          calculateProgress(reqRes.data.data);
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  const calculateProgress = (reqs) => {
    const total = reqs.length || 0;
    const completed = reqs.filter(r => r.status === "Completed" || r.status === "Submitted").length;
    setProgress(total ? Math.round((completed / total) * 100) : 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getFileName = (path) => {
    if (!path) return "";
    return path.split('/').pop();
  };

  const handleUpload = async (e, requirement_id) => {
    const file = e.target.files[0];
    if (!file || !studentId) return;

    const confirmUpload = await Swal.fire({
      title: "Upload File?",
      text: `Are you sure you want to upload "${file.name}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, upload it",
      cancelButtonText: "Cancel",
    });

    if (!confirmUpload.isConfirmed) {
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("student_id", studentId);
    formData.append("requirement_id", requirement_id);
    formData.append("file", file);

    setUploading(true);

    try {
      const res = await axios.post(`${API_BASE}/student/upload_requirement.php`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Uploaded Successfully!",
          text: "Your file has been submitted.",
          timer: 1500,
          showConfirmButton: false
        });

        const updated = requirements.map(r =>
          r.requirement_id === requirement_id 
            ? { 
                ...r, 
                status: "Submitted", 
                file_path: res.data.file_path,
                uploaded_at: new Date().toISOString() 
              } 
            : r
        );
        setRequirements(updated);
        calculateProgress(updated);
      } else {
        Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: res.data.message || "Please try again."
        });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Error uploading file." });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Navbar user={{ name: student?.name || "Student" }} />
      
      <div className="container py-4">
        
        {/* ROW 1: Profile & Progress */}
        <Row className="mb-4 g-4">
          <Col lg={8}>
            <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
               <div className="d-flex align-items-center mb-4">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                     <PersonFill size={28} className="text-primary" />
                  </div>
                  <div>
                     <h4 className="fw-bold mb-0 text-dark">Student Profile</h4>
                     <small className="text-muted">Manage your information and status</small>
                  </div>
               </div>

               <Row className="g-3">
                  <Col md={6}>
                     <div className="p-3 bg-light rounded-3">
                        <small className="text-uppercase text-muted fw-bold" style={{fontSize: '0.7rem'}}>Full Name</small>
                        <div className="fw-semibold text-dark d-flex align-items-center mt-1">
                           <PersonFill className="me-2 text-secondary" /> {student?.name}
                        </div>
                     </div>
                  </Col>
                  <Col md={6}>
                     <div className="p-3 bg-light rounded-3">
                        <small className="text-uppercase text-muted fw-bold" style={{fontSize: '0.7rem'}}>Email Address</small>
                        <div className="fw-semibold text-dark d-flex align-items-center mt-1">
                           <EnvelopeFill className="me-2 text-secondary" /> {student?.email}
                        </div>
                     </div>
                  </Col>
                  <Col md={6}>
                     <div className="p-3 bg-light rounded-3">
                        <small className="text-uppercase text-muted fw-bold" style={{fontSize: '0.7rem'}}>Course & Section</small>
                        <div className="fw-semibold text-dark mt-1">
                           {student?.course} <span className="text-muted mx-1">•</span> {student?.year_level} - {student?.section}
                        </div>
                     </div>
                  </Col>
                  <Col md={6}>
                     <div className="p-3 bg-light rounded-3">
                        <small className="text-uppercase text-muted fw-bold" style={{fontSize: '0.7rem'}}>Deployment Company</small>
                        <div className="fw-semibold text-dark d-flex align-items-center mt-1">
                           <BuildingFill className="me-2 text-secondary" /> 
                           {
                             (student?.deployment_status === 'Deployed' || student?.deployment_status === 'Completed') 
                             ? (student?.company_name || "Not Assigned") 
                             : <span className="text-muted fst-italic">Not yet deployed</span>
                           }
                        </div>
                     </div>
                  </Col>
               </Row>
            </div>
          </Col>

          <Col lg={4}>
             <div className="card border-0 shadow-sm rounded-4 h-100 p-4 bg-primary text-white position-relative overflow-hidden">
                <div className="position-relative z-1">
                   <h5 className="fw-bold mb-4 opacity-75">OJT Completion Status</h5>
                   <div className="display-4 fw-bold mb-2">{progress}%</div>
                   <ProgressBar now={progress} variant="light" style={{ height: "8px", backgroundColor: "rgba(255,255,255,0.2)" }} />
                   <div className="mt-3 small opacity-75">
                      {progress === 100 ? "Congratulations! You have completed all requirements." : "Keep it up! Complete your remaining tasks."}
                   </div>
                </div>
                <CheckCircleFill size={150} className="position-absolute bottom-0 end-0 opacity-10" style={{ transform: "translate(30%, 30%)" }} />
             </div>
          </Col>
        </Row>

        {/* ROW 2: Requirements Table (Standard Bootstrap Table) */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
           <div className="card-header bg-white py-3 px-4 border-0 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                 <CardChecklist className="text-primary me-2" size={22} />
                 <h5 className="mb-0 fw-bold text-dark">Requirements Checklist</h5>
              </div>
           </div>

           {/* MODIFIED: Added striped and bordered props */}
           <Table striped bordered hover responsive className="align-middle mb-0">
              <thead className="bg-light">
                 <tr>
                    <th className="ps-4">Requirement</th>
                    <th>Description</th>
                    <th className="text-center">Status</th>
                    <th>Date Submitted</th>
                    <th>Action</th>
                 </tr>
              </thead>
              <tbody>
                 {requirements.length > 0 ? (
                    requirements.map((req) => (
                       <tr key={req.requirement_id}>
                          <td className="ps-4 fw-medium text-dark">
                             {req.requirement_name}
                          </td>
                          <td className="text-muted small" style={{maxWidth: '250px'}}>
                             {req.description || "—"}
                          </td>
                          <td className="text-center">
                             <Badge 
                                bg={req.status === "Completed" ? "success" : req.status === "Submitted" ? "primary" : "secondary"} 
                                className="rounded-pill px-3 fw-normal"
                             >
                                {req.status || "Pending"}
                             </Badge>
                          </td>
                          <td className="text-muted small">
                             {formatDate(req.uploaded_at)}
                          </td>
                          <td>
                             <div className="d-flex flex-column gap-2">
                                {/* File Link */}
                                {req.file_path && (
                                   <a href={`${FILE_BASE_URL}/${req.file_path}`} target="_blank" rel="noreferrer" className="text-decoration-none small fw-bold text-primary d-flex align-items-center">
                                      <FileEarmarkTextFill className="me-1" /> {getFileName(req.file_path)}
                                   </a>
                                )}

                                {/* Upload Input */}
                                {req.status !== "Completed" && (
                                   <Form.Group controlId={`upload-${req.requirement_id}`}>
                                      <div className="d-flex align-items-center">
                                          <Form.Control
                                             type="file"
                                             size="sm"
                                             accept=".pdf,.doc,.docx"
                                             onChange={(e) => handleUpload(e, req.requirement_id)}
                                             disabled={uploading}
                                             className="me-2"
                                          />
                                          {uploading && <div className="spinner-border spinner-border-sm text-primary"></div>}
                                      </div>
                                   </Form.Group>
                                )}
                                {req.status === "Completed" && (
                                    <span className="text-success small fw-bold"><CheckCircleFill className="me-1"/>Verified</span>
                                )}
                             </div>
                          </td>
                       </tr>
                    ))
                 ) : (
                    <tr>
                       <td colSpan="5" className="text-center py-5 text-muted">No requirements found.</td>
                    </tr>
                 )}
              </tbody>
           </Table>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;