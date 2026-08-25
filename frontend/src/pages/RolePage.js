import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { roleService } from "../services/api";
import "./MasterScreen.css";

const RolePage = () => {
  const { user } = useContext(AuthContext);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", permissions: "" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (user?.role === "SuperAdmin") fetchRoles();
  }, [user]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getAll();
      setRoles(response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch authorization levels.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const permissions = formData.permissions.split(",").map(p => p.trim()).filter(p => p);
      const data = { ...formData, permissions };
      if (editingId) {
        await roleService.update(editingId, data);
      } else {
        await roleService.create(data);
      }
      setFormData({ name: "", permissions: "" });
      setEditingId(null);
      setShowForm(false);
      fetchRoles();
    } catch (err) {
      setError("Authorization commitment failed.");
    }
  };

  const handleEdit = (role) => {
    setFormData({ name: role.name, permissions: role.permissions?.join(", ") || "" });
    setEditingId(role._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Authorize permanent revocation of this role?")) {
      try {
        await roleService.delete(id);
        fetchRoles();
      } catch (err) {
        setError("Revocation denied: Active association detected.");
      }
    }
  };

  if (loading) return <div className="loading">Parsing Permission Matrix...</div>;

  return (
    <div className="master-screen animated-bg">
      <div className="screen-content">
        
        {/* Header Rail Card */}
        <header className="screen-header-rail">
          <div>
            <h1>Permission Matrix</h1>
            <p className="info-label">User role authorization levels & access vector definitions</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); if (showForm) setEditingId(null); }}
            className="btn-primary"
          >
            {showForm ? "✕ Close Interface" : "＋ Register Role"}
          </button>
        </header>

        {error && <div className="error-message">{error}</div>}

        {/* Toggled Form Glass Card */}
        {showForm && (
          <form className="master-form-glass" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Operational Designation</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. System Engineer"
                  required
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Access Vectors (Comma Separated)</label>
                <textarea
                  value={formData.permissions}
                  onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                  placeholder="read_data, write_logs, triage_tickets..."
                  rows="3"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              {editingId ? "Update Authorization" : "Commit Role"}
            </button>
          </form>
        )}

        {/* Master Table Card */}
        <section className="master-table-card">
          <div className="table-action-header">
            <h3>Authorization Registry</h3>
            <span className="info-label">{roles.length} Tiers Active</span>
          </div>
          <div className="table-wrapper">
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Designation</th>
                  <th>Permission Vectors</th>
                  <th style={{ textAlign: 'right' }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 700 }}>{r.name}</td>
                    <td>
                      <div className="permission-tag-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {r.permissions?.map((p, idx) => (
                          <span key={idx} className="status-tag tag-progress">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="action-btn-group">
                        <button className="btn-icon-only" onClick={() => handleEdit(r)}>✏️ Edit</button>
                        <button className="btn-icon-only btn-delete-icon" onClick={() => handleDelete(r._id)}>🗑️ Delete</button>
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

export default RolePage;
