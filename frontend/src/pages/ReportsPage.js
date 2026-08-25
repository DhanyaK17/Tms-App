import React, { useContext, useEffect, useState } from "react";
import { complaintService, departmentService, programmeService } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import "./ReportsPage.css";

const ReportsPage = () => {
  const { user } = useContext(AuthContext);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [filters, setFilters] = useState({
    department: "", programme: "", complaintType: "", status: "", assignee: "",
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReportInternal = async (filterParams) => {
    setError("");
    setLoading(true);
    try {
      const params = { ...filterParams };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const res = await complaintService.report(params);
      setResults(res.data || []);
    } catch (err) {
      setError("Intelligence retrieval failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "SuperAdmin") return;
    Promise.all([
      departmentService.getAll(),
      programmeService.getAll(),
    ]).then(([d, p]) => {
      setDepartments(d.data || []);
      setProgrammes(p.data || []);
    }).catch(() => { });
  }, [user]);

  useEffect(() => {
    const savedFilters = localStorage.getItem("superadmin_report_filters");
    const hasGenerated = localStorage.getItem("superadmin_report_generated");
    if (hasGenerated && savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        setFilters(parsed);
        fetchReportInternal(parsed);
      } catch (e) { }
    } else {
      fetchReportInternal({});
    }
  }, []);

  const handleManualGenerate = () => {
    localStorage.setItem("superadmin_report_filters", JSON.stringify(filters));
    localStorage.setItem("superadmin_report_generated", "true");
    fetchReportInternal(filters);
  };

  const handleResetFilters = () => {
    const resetState = { department: "", programme: "", complaintType: "", status: "", assignee: "" };
    setFilters(resetState);
    localStorage.removeItem("superadmin_report_filters");
    localStorage.removeItem("superadmin_report_generated");
    fetchReportInternal(resetState);
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = ["Date", "Dept", "Programme", "Block", "Room", "Type", "Status", "CreatedBy", "Assignee"];
    const rows = results.map((r) => [
      new Date(r.createdAt).toLocaleString(),
      r.departmentName || "-", r.programmeName || "-",
      r.blockName, r.roomNumber, r.complaintType, r.status,
      r.createdBy?.username || r.createdBy?.email || "",
      r.assignedTo?.username || r.assignedTo?.email || "",
    ]);
    const csv = [headers.join(","), ...rows.map(row => row.map(cell => `"${("" + cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `TMS_Data_Export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  if (user?.role !== "SuperAdmin") {
    return (
      <div className="reports-page animated-bg">
        <div className="reports-container denied-screen">
          <div className="denied-icon">🔒</div>
          <h1>Security Override Required</h1>
          <p>Access to analytical data is restricted to SuperAdmin tier.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page animated-bg">
      <div className="reports-container">
        
        {/* Header Rail Card */}
        <header className="reports-header-card">
          <div>
            <h1>Intelligence Center</h1>
            <p className="info-label">Advanced filtering, analytical metrics & data cluster export</p>
          </div>
          <button onClick={exportCSV} disabled={!results.length} className="btn-primary">
            Export Data Cluster ⤓
          </button>
        </header>

        {error && <div className="error-message">{error}</div>}

        {/* Filter Glass Console */}
        <section className="reports-filter-glass">
          <div className="reports-filter-grid">
            <div className="form-group">
              <label>Department Unit</label>
              <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
                <option value="">All Units</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Programme Hub</label>
              <select value={filters.programme} onChange={(e) => setFilters({ ...filters, programme: e.target.value })}>
                <option value="">All Hubs</option>
                {programmes.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Operational Type</label>
              <input
                type="text"
                value={filters.complaintType}
                onChange={(e) => setFilters({ ...filters, complaintType: e.target.value })}
                placeholder="Search codes..."
              />
            </div>

            <div className="form-group">
              <label>Lifecycle Status</label>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All States</option>
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Onhold">Onhold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="reports-filter-actions">
            <button onClick={handleResetFilters} className="btn-secondary">
              Reset Filters ⟳
            </button>
            <button onClick={handleManualGenerate} className="btn-primary">
              Initialize Search 🔍
            </button>
          </div>
        </section>

        {/* Analytical Results Grid Table */}
        <section className="reports-table-container">
          <div className="reports-table-header">
            <h3>Analytical Result Grid</h3>
            <span className="info-label">{results.length} Nodes Identified</span>
          </div>

          <div className="table-wrapper">
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Temporal Node</th>
                  <th>Structural ID</th>
                  <th>Category</th>
                  <th>Condition</th>
                  <th>Assignee</th>
                  <th>Originator</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--primary)' }}>Processing Data Cluster...</td></tr>
                ) : (
                  results.map(r => (
                    <tr key={r._id}>
                      <td style={{ opacity: 0.75 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td><strong>{r.blockName}</strong> • {r.roomNumber}</td>
                      <td>{r.complaintType}</td>
                      <td><span className={`status-tag ${getStatusClass(r.status)}`}>{r.status}</span></td>
                      <td>{r.assignedTo?.username || "Unassigned"}</td>
                      <td>{r.createdBy?.username || "N/A"}</td>
                    </tr>
                  ))
                )}
                {!loading && results.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem', opacity: 0.6 }}>No data nodes found for selected criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};

export default ReportsPage;
