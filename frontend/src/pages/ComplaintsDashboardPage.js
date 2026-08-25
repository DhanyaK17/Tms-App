import React, { useEffect, useState, useContext } from "react";
import { complaintService, userService, FILE_BASE_URL } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import "./ComplaintsDashboardPage.css";

const ComplaintsDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignTarget, setAssignTarget] = useState({ complaintId: null, assignee: "" });
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const viewComplaintDetails = (complaint) => {
    setSelectedComplaint(complaint);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setListLoading(true);
        const [compRes, statRes] = await Promise.all([
          complaintService.getAll(),
          complaintService.getStats()
        ]);
        setComplaints(compRes.data || []);
        setStats(statRes.data || { total: 0, pending: 0, assigned: 0, closed: 0 });
      } catch (err) {
        setError("Network failure: Unable to retrieve global ticker.");
      } finally {
        setListLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (user?.role === "SuperAdmin") {
      userService.getAll()
        .then((res) => setUsers(res.data || []))
        .catch((err) => console.error("Failed to fetch users", err));
    }
  }, [user]);

  const refresh = async () => {
    try {
      const [res, s] = await Promise.all([
        complaintService.getAll(),
        complaintService.getStats()
      ]);
      setComplaints(res.data || []);
      setStats(s.data || { total: 0, pending: 0, assigned: 0, closed: 0 });
    } catch (e) {
      console.error("Refresh failed:", e);
    }
  };

  const handleAssignSubmit = async () => {
    if (!assignTarget.assignee) return;
    try {
      await complaintService.assign(assignTarget.complaintId, assignTarget.assignee);
      setAssignTarget({ complaintId: null, assignee: "" });
      refresh();
    } catch (err) {
      setError("Assignment rejected by server.");
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending": return "tag-pending";
      case "Assigned": return "tag-assigned";
      case "In-Progress": return "tag-progress";
      case "Onhold": return "tag-onhold";
      case "Completed": return "tag-completed";
      default: return "";
    }
  };

  // Filter complaints dynamically
  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = filterStatus === "All" || c.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      c.blockName?.toLowerCase().includes(term) ||
      c.roomNumber?.toLowerCase().includes(term) ||
      c.complaintType?.toLowerCase().includes(term) ||
      c.createdBy?.username?.toLowerCase().includes(term) ||
      c.remarks?.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  if (listLoading) return <div className="loading">Accessing Global Repository...</div>;

  return (
    <div className="complaints-dashboard animated-bg">
      <div className="dashboard-rail">
        <header className="dashboard-hero">
          <h1>Global Oversight Console</h1>
          <p className="info-label">Centralized complaint management & field technician dispatch</p>
        </header>

        {error && <div className="error-message">{error}</div>}

        {/* Stats Grid with Filter Triggers */}
        <section className="admin-stats-grid">
          <div
            className="admin-stat-card cyan"
            onClick={() => setFilterStatus("All")}
            style={{ cursor: 'pointer' }}
          >
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">System Load</span>
          </div>
          <div
            className="admin-stat-card amber"
            onClick={() => setFilterStatus("Pending")}
            style={{ cursor: 'pointer' }}
          >
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Awaiting Triage</span>
          </div>
          <div
            className="admin-stat-card violet"
            onClick={() => setFilterStatus("Assigned")}
            style={{ cursor: 'pointer' }}
          >
            <span className="stat-value">{stats.assigned}</span>
            <span className="stat-label">In Field View</span>
          </div>
          <div
            className="admin-stat-card green"
            onClick={() => setFilterStatus("Completed")}
            style={{ cursor: 'pointer' }}
          >
            <span className="stat-value">{stats.closed}</span>
            <span className="stat-label">Resolved Units</span>
          </div>
        </section>

        {/* Ticket Detail Inspector Drawer */}
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
              <div className="info-box">
                <span className="info-label">Originator</span>
                <span className="info-content">
                  {selectedComplaint.createdBy?.username || "Anonymous"}
                </span>
              </div>
              <div className="info-box">
                <span className="info-label">Assigned Technician</span>
                <span className="info-content">
                  {selectedComplaint.assignedTo?.username || "Unassigned"}
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

        {/* Live Filter Controls Bar & Data Table */}
        <section className="admin-table-container">
          <div className="table-controls-bar">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="table-search-input"
                placeholder="Search by block, room, category, user..."
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

            <button onClick={refresh} className="reset-filter-btn">Manual Sync ⟳</button>
          </div>

          <div className="table-wrapper">
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Designation</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Originator</th>
                  <th>Management</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => {
                  const isAssigned = c.assignedTo && String(c.assignedTo._id || c.assignedTo) === String(user?.id || user?._id);
                  return (
                    <tr key={c._id} onClick={() => viewComplaintDetails(c)} style={{ cursor: 'pointer' }}>
                      <td style={{ opacity: 0.7 }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td>
                        <strong>{c.blockName}</strong> • {c.roomNumber}
                      </td>
                      <td>{c.complaintType}</td>
                      <td>
                        <span className={`status-tag ${getStatusClass(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>{c.createdBy?.username || "Anonymous"}</td>
                      <td>
                        <div className="action-btn-group">
                          {user?.role === "SuperAdmin" && !c.assignedTo && (
                            assignTarget.complaintId === c._id ? (
                              <div className="assign-mini-form" onClick={(e) => e.stopPropagation()}>
                                <select
                                  className="mini-select"
                                  value={assignTarget.assignee}
                                  onChange={(e) => setAssignTarget({ ...assignTarget, assignee: e.target.value })}
                                >
                                  <option value="">Select Technician</option>
                                  {users?.filter(u => u.role !== 'SuperAdmin').map(u => (
                                    <option key={u._id} value={u._id}>{u.username}</option>
                                  ))}
                                </select>
                                <button onClick={handleAssignSubmit} className="admin-action-btn btn-assign">✓</button>
                                <button onClick={() => setAssignTarget({ complaintId: null, assignee: "" })} className="admin-action-btn">✕</button>
                              </div>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); setAssignTarget({ complaintId: c._id, assignee: "" }); }} className="admin-action-btn btn-assign">Assign</button>
                            )
                          )}

                          {(isAssigned || user?.role === "SuperAdmin") && c.status !== "Completed" && (
                            <>
                              {c.status !== "In-Progress" && (
                                <button onClick={(e) => { e.stopPropagation(); complaintService.updateStatus(c._id, "In-Progress").then(refresh); }} className="admin-action-btn" style={{ background: 'var(--primary)', color: '#000', marginRight: '0.4rem' }}>Work It</button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); complaintService.updateStatus(c._id, "Completed").then(refresh); }} className="admin-action-btn btn-done">Finish</button>
                            </>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); viewComplaintDetails(c); }} className="admin-action-btn" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>Details</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredComplaints.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
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

export default ComplaintsDashboardPage;
