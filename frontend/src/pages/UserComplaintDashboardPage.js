import React, { useEffect, useState, useContext, useCallback } from "react";
import { complaintService, FILE_BASE_URL } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import "./UserComplaintDashboardPage.css";

const UserComplaintDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [myStats, setMyStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await complaintService.getAll();
      const allComplaints = res.data || [];

      setComplaints(allComplaints);

      const stats = {
        total: allComplaints.length,
        pending: allComplaints.filter((c) => c.status === "Pending").length,
        assigned: allComplaints.filter((c) => c.status === "Assigned" || c.status === "In-Progress").length,
        closed: allComplaints.filter((c) => c.status === "Completed").length,
      };
      setMyStats(stats);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = filterStatus === "All" || c.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      c.blockName?.toLowerCase().includes(term) ||
      c.roomNumber?.toLowerCase().includes(term) ||
      c.complaintType?.toLowerCase().includes(term) ||
      c.remarks?.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  const viewComplaintDetails = (complaint) => {
    setSelectedComplaint(complaint);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending": return "tag-pending";
      case "Assigned": return "tag-assigned";
      case "In-Progress": return "tag-progress";
      case "Completed": return "tag-completed";
      case "Onhold": return "tag-onhold";
      default: return "";
    }
  };

  if (loading) return <div className="loading">Initializing Ticket Dossier...</div>;

  return (
    <div className="user-complaint-dashboard animated-bg">
      <div className="dashboard-content">
        
        {/* Header Rail Card */}
        <header className="page-hero-header">
          <div>
            <h1>My Ticket Overview</h1>
            <p className="info-label">Tracking reported service requests & field technician activity</p>
          </div>
          <button onClick={loadData} className="btn-primary">
            Sync Records ⟳
          </button>
        </header>

        {error && <div className="error-message">{error}</div>}

        {/* Stats Grid */}
        <section className="stats-overview">
          <div className="user-stats-grid">
            <div
              className="user-stat-card cyan"
              onClick={() => setFilterStatus("All")}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-num">{myStats.total}</div>
              <div className="stat-text">TOTAL TICKETS</div>
            </div>

            <div
              className="user-stat-card amber"
              onClick={() => setFilterStatus("Pending")}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-num">{myStats.pending}</div>
              <div className="stat-text">PENDING REVIEW</div>
            </div>

            <div
              className="user-stat-card violet"
              onClick={() => setFilterStatus("Assigned")}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-num">{myStats.assigned}</div>
              <div className="stat-text">IN FIELD PROGRESS</div>
            </div>

            <div
              className="user-stat-card green"
              onClick={() => setFilterStatus("Completed")}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-num">{myStats.closed}</div>
              <div className="stat-text">RESOLVED UNITS</div>
            </div>
          </div>
        </section>

        {/* Ticket Inspection Panel */}
        {selectedComplaint && (
          <section className="complaint-details-glass">
            <div className="details-header">
              <h2>Ticket Inspection Drawer</h2>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="close-details-btn"
              >✕</button>
            </div>

            <div className="details-info-grid">
              <div className="info-box">
                <span className="info-label">Location Control</span>
                <span className="info-content">
                  {selectedComplaint.blockName} • {selectedComplaint.roomNumber}
                </span>
              </div>
              <div className="info-box">
                <span className="info-label">Category</span>
                <span className="info-content">{selectedComplaint.complaintType}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Current Status</span>
                <div>
                  <span className={`status-tag ${getStatusClass(selectedComplaint.status)}`}>
                    {selectedComplaint.status}
                  </span>
                </div>
              </div>
              <div className="info-box">
                <span className="info-label">Submission Date</span>
                <span className="info-content">
                  {new Date(selectedComplaint.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="info-box" style={{ gridColumn: "1 / -1" }}>
                <span className="info-label">Service Remarks</span>
                <p className="info-content" style={{ fontWeight: 400, opacity: 0.85 }}>
                  {selectedComplaint.remarks || "No remarks provided."}
                </p>
              </div>

              {selectedComplaint.attachment && (
                <div className="info-box" style={{ gridColumn: "1 / -1" }}>
                  <span className="info-label">Evidentiary Attachment</span>
                  <a
                    href={`${FILE_BASE_URL}${selectedComplaint.attachment.startsWith('/') ? '' : '/'}${selectedComplaint.attachment}`}
                    target="_blank"
                    rel="noreferrer"
                    className="reset-filter-btn"
                    style={{ textDecoration: 'none', display: 'inline-block', marginTop: '0.5rem' }}
                  >
                    View Document ↗
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Filter Controls & Data Table */}
        <section className="data-table-container">
          <div className="table-controls-bar">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="table-search-input"
                placeholder="Search ticket, block, room, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search-btn" onClick={() => setSearchTerm("")}>✕</button>
              )}
            </div>

            <div className="status-pill-filters">
              {["All", "Pending", "Assigned", "In-Progress", "Completed"].map((st) => (
                <button
                  key={st}
                  className={`filter-pill ${filterStatus === st ? 'active' : ''}`}
                  onClick={() => setFilterStatus(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrapper">
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Target Facility</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => {
                  const isAssigned = c.assignedTo && (String(c.assignedTo._id || c.assignedTo) === String(user?.id || user?._id));
                  return (
                    <tr key={c._id} onClick={() => viewComplaintDetails(c)} style={{ cursor: 'pointer' }}>
                      <td><strong>{c.blockName}</strong> • {c.roomNumber}</td>
                      <td>{c.complaintType}</td>
                      <td>
                        <span className={`status-tag ${getStatusClass(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ opacity: 0.75 }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="action-btn-group">
                          {isAssigned && c.status !== "Completed" && (
                            <>
                              {c.status !== "In-Progress" && (
                                <button
                                  onClick={() => complaintService.updateStatus(c._id, "In-Progress").then(loadData)}
                                  className="btn-icon-only"
                                  style={{ background: 'var(--primary)', color: '#000' }}
                                >
                                  Work It
                                </button>
                              )}
                              <button
                                onClick={() => complaintService.updateStatus(c._id, "Completed").then(loadData)}
                                className="btn-icon-only"
                                style={{ background: 'var(--accent-green)', color: '#000' }}
                              >
                                Finish
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => viewComplaintDetails(c)}
                            className="btn-icon-only"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredComplaints.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                      No ticket records found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};

export default UserComplaintDashboardPage;
