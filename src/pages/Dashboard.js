import React, { useEffect, useState } from "react";
import { Button, Modal, Table, ProgressBar } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import SummaryCard from "../components/SummaryCard";
import api from "../services/api";

const Dashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    advisors: 0,
    companies: 0,
  });
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [showReqModal, setShowReqModal] = useState(false);

  // Fetch student/advisor/company counts
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

        setStats({
          students: studentsData.length,
          advisors: advisorsRes.data?.data?.length || 0,
          companies: companiesRes.data?.data?.length || 0,
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };
    fetchData();
  }, []);

  // View Requirements Modal
  const viewRequirements = async (student) => {
    try {
      const res = await api.get("/admin/manage_requirements.php", {
        params: { student_id: student.student_id },
      });
      if (res.data.success) {
        setSelectedStudent(student);
        setRequirements(res.data.data);
        setShowReqModal(true);
      } else {
        alert(res.data.message || "No requirements found.");
      }
    } catch (err) {
      console.error("Error loading requirements:", err);
      alert("Error loading requirements. Check backend connection.");
    }
  };

  // Compute progress
  const getProgress = (reqs) => {
    const total = reqs.length || 0;
    const completed = reqs.filter(
      (r) => r.status === "Completed" || r.status === "Submitted"
    ).length;
    return total ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 bg-light" style={{ minHeight: "100vh" }}>
        <Navbar user={{ name: "Admin" }} />
        <div className="container mt-4">
          <h4 className="mb-4 fw-bold text-primary">Dashboard Overview</h4>

          {/* Summary Cards */}
          <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
            <SummaryCard title="Students" count={stats.students} color="primary" />
            <SummaryCard title="Advisors" count={stats.advisors} color="success" />
            <SummaryCard title="Companies" count={stats.companies} color="info" />
          </div>

          {/* Students Table */}
          <div className="card shadow-sm p-3 mb-5">
            <h5 className="fw-bold text-secondary mb-3">
              Student Requirements Summary
            </h5>
            <div className="table-responsive">
              <Table
                striped
                bordered
                hover
                className="align-middle"
                style={{ minWidth: "1100px", whiteSpace: "nowrap" }}
              >
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Course</th>
                    <th>Year</th>
                    <th>Section</th>
                    <th>Company</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length ? (
                    students.map((stu, index) => (
                      <tr key={stu.student_id}>
                        <td>{index + 1}</td>
                        <td>{stu.full_name}</td>
                        <td>{stu.course}</td>
                        <td>{stu.year_level}</td>
                        <td>{stu.section}</td>
                        <td>{stu.company_name || "—"}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => viewRequirements(stu)}
                          >
                            View Requirements
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted">
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>

          {/* Requirements Modal */}
          <Modal show={showReqModal} onHide={() => setShowReqModal(false)} size="md">
            <Modal.Header closeButton>
              <Modal.Title>
                Requirements for {selectedStudent?.full_name}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {requirements.length ? (
                <>
                  <Table bordered hover>
                    <thead className="table-light">
                      <tr>
                        <th>Requirement</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requirements.map((req) => (
                        <tr key={req.requirement_id}>
                          <td>{req.requirement_name}</td>
                          <td>
                            <span
                              className={`badge ${
                                req.status === "Completed" || req.status === "Submitted"
                                  ? "bg-success"
                                  : "bg-secondary"
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <h6 className="mt-3">Overall Progress</h6>
                  <ProgressBar
                    now={getProgress(requirements)}
                    label={`${getProgress(requirements)}%`}
                    variant={
                      getProgress(requirements) === 100 ? "success" : "info"
                    }
                  />
                </>
              ) : (
                <p className="text-center text-muted">No requirements found.</p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowReqModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
