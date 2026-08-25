import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { programmeService, departmentService } from "../services/api";
import "./MasterScreen.css";

const ProgrammePage = () => {
  const { user } = useContext(AuthContext);
  const [programmes, setProgrammes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", shortName: "", department: "" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (user?.role === "SuperAdmin") fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [progRes, deptRes] = await Promise.all([
        programmeService.getAll(),
        departmentService.getAll(),
      ]);
      setProgrammes(progRes.data);
      setDepartments(deptRes.data);
      setError("");
    } catch (err) {
      setError("Data synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await programmeService.update(editingId, formData);
      } else {
        await programmeService.create(formData);
      }
      setFormData({ name: "", shortName: "", department: "" });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError("Failed to commit programme data.");
    }
  };

  const handleEdit = (prog) => {
    setFormData({
      ...prog,
      department: prog.department?._id || prog.department
    });
    setEditingId(prog._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Securely delete this programme record?")) {
      try {
        await programmeService.delete(id);
        fetchData();
      } catch (err) {
        setError("Deletion restricted by active dependencies.");
      }
    }
  };

  if (loading) return <div className="loading">Initializing Academic Data...</div>;

  return (
    <div className="master-screen animated-bg">
      <div className="screen-content">
        
        {/* Header Rail Card */}
        <header className="screen-header-rail">
          <div>
            <h1>Programme Management</h1>
            <p className="info-label">Academic degree programmes & department mapping registry</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); if (showForm) setEditingId(null); }}
            className="btn-primary"
          >
            {showForm ? "✕ Close Console" : "＋ Register Programme"}
          </button>
        </header>

        {error && <div className="error-message">{error}</div>}

        {/* Toggled Form Glass Card */}
        {showForm && (
          <form className="master-form-glass" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Academic Programme Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Bachelor of Technology"
                  required
                />
              </div>
              <div className="form-group">
                <label>Code Identifier</label>
                <input
                  type="text"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  placeholder="e.g. B.Tech"
                  required
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Parent Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                >
                  <option value="">Select Target Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              {editingId ? "Update Programme" : "Establish Programme"}
            </button>
          </form>
        )}

        {/* Master Table Card */}
        <section className="master-table-card">
          <div className="table-action-header">
            <h3>Programme Registry</h3>
            <span className="info-label">{programmes.length} Modules Active</span>
          </div>
          <div className="table-wrapper">
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Academic Identity</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'right' }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {programmes.map((prog) => (
                  <tr key={prog._id}>
                    <td style={{ fontWeight: 700 }}>{prog.name}</td>
                    <td>{prog.shortName}</td>
                    <td>{prog.department?.name || "N/A"}</td>
                    <td>
                      <div className="action-btn-group">
                        <button className="btn-icon-only" onClick={() => handleEdit(prog)}>✏️ Edit</button>
                        <button className="btn-icon-only btn-delete-icon" onClick={() => handleDelete(prog._id)}>🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};

export default ProgrammePage;
