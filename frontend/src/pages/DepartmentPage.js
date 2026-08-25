import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { departmentService } from "../services/api";
import "./MasterScreen.css";

const DepartmentPage = () => {
  const { user } = useContext(AuthContext);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", shortName: "" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (user?.role === "SuperAdmin") fetchDepartments();
  }, [user]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getAll();
      setDepartments(response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch department records from the secure server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await departmentService.update(editingId, formData);
      } else {
        await departmentService.create(formData);
      }
      setFormData({ name: "", shortName: "" });
      setEditingId(null);
      setShowForm(false);
      fetchDepartments();
    } catch (err) {
      setError("System failure during data commitment.");
    }
  };

  const handleEdit = (dept) => {
    setFormData(dept);
    setEditingId(dept._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Permanent deletion of this record?")) {
      try {
        await departmentService.delete(id);
        fetchDepartments();
      } catch (err) {
        setError("Execution failed: dependency restriction.");
      }
    }
  };

  if (loading) return <div className="loading">Syncing Records...</div>;

  return (
    <div className="master-screen animated-bg">
      <div className="screen-content">
        
        {/* Header Rail Card */}
        <header className="screen-header-rail">
          <div>
            <h1>Department Hub</h1>
            <p className="info-label">Department unit directory & code identifier mappings</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); if (showForm) setEditingId(null); }}
            className="btn-primary"
          >
            {showForm ? "✕ Dismiss" : "＋ New Department"}
          </button>
        </header>

        {error && <div className="error-message">{error}</div>}

        {/* Toggled Form Glass Card */}
        {showForm && (
          <form className="master-form-glass" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Official Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Information Technology"
                  required
                />
              </div>
              <div className="form-group">
                <label>Code Identifier</label>
                <input
                  type="text"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  placeholder="e.g. IT"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              {editingId ? "Update Record" : "Commit Record"}
            </button>
          </form>
        )}

        {/* Master Table Card */}
        <section className="master-table-card">
          <div className="table-action-header">
            <h3>Registry Output</h3>
            <span className="info-label">{departments.length} Units Active</span>
          </div>
          <div className="table-wrapper">
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Core ID</th>
                  <th style={{ textAlign: 'right' }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept._id}>
                    <td style={{ fontWeight: 700 }}>{dept.name}</td>
                    <td>{dept.shortName}</td>
                    <td>
                      <div className="action-btn-group">
                        <button className="btn-icon-only" onClick={() => handleEdit(dept)}>✏️ Edit</button>
                        <button className="btn-icon-only btn-delete-icon" onClick={() => handleDelete(dept._id)}>🗑️ Delete</button>
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

export default DepartmentPage;
