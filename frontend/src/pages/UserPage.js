import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { userService, departmentService, roleService } from "../services/api";
import "./MasterScreen.css";

const UserPage = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "User",
    department: "",
    programme: "",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (user?.role === "SuperAdmin") fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, deptRes, roleRes] = await Promise.all([
        userService.getAll(),
        departmentService.getAll(),
        roleService.getAll(),
      ]);
      setUsers(userRes.data);
      setDepartments(deptRes.data);
      const fetchedRoles = roleRes.data.map(r => r.name);
      setRoles(["SuperAdmin", "User", ...fetchedRoles.filter(n => n !== "SuperAdmin" && n !== "User")]);
      setError("");
    } catch (err) {
      setError("User directory synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!editingId && !submitData.password) {
        setError("Security key required for new identities.");
        return;
      }
      if (editingId && !submitData.password) delete submitData.password;
      if (submitData.department === "") delete submitData.department;
      if (submitData.programme === "") delete submitData.programme;

      if (editingId) {
        await userService.update(editingId, submitData);
      } else {
        await userService.create(submitData);
      }
      setFormData({
        username: "", email: "", phone: "", password: "",
        role: "User", department: "", programme: "",
      });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Identity registration failed.");
    }
  };

  const handleEdit = (userData) => {
    setFormData({
      username: userData.username,
      email: userData.email,
      phone: userData.phone,
      password: "",
      role: userData.role,
      department: userData.department?._id || userData.department || "",
      programme: userData.programme?._id || userData.programme || "",
    });
    setEditingId(userData._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Permanent revocation of this user identity?")) {
      try {
        await userService.delete(id);
        fetchData();
      } catch (err) {
        setError("Revocation failed: Active administrative session.");
      }
    }
  };

  if (loading) return <div className="loading">Profiling User Directory...</div>;

  return (
    <div className="master-screen animated-bg">
      <div className="screen-content">
        
        {/* Header Rail Card */}
        <header className="screen-header-rail">
          <div>
            <h1>Identity Directory</h1>
            <p className="info-label">User accounts, role permissions & administrative access registry</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); if (showForm) setEditingId(null); }}
            className="btn-primary"
          >
            {showForm ? "✕ Dismiss Console" : "＋ Register Identity"}
          </button>
        </header>

        {error && <div className="error-message">{error}</div>}

        {/* Toggled Form Glass Card */}
        {showForm && (
          <form className="master-form-glass" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Unique Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. admin_01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Primary Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@domain.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (xxx) xxx-xxxx"
                  required
                />
              </div>
              <div className="form-group">
                <label>Access Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Department Unit</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  <option value="">N/A</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Security Key</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingId ? "Leave blank to preserve" : "Enter robust key"}
                  required={!editingId}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              {editingId ? "Update Identity" : "Establish Identity"}
            </button>
          </form>
        )}

        {/* Master Table Card */}
        <section className="master-table-card">
          <div className="table-action-header">
            <h3>User Registry</h3>
            <span className="info-label">{users.length} Identities Online</span>
          </div>
          <div className="table-wrapper">
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Primary Email</th>
                  <th>Core Role</th>
                  <th>Linked Unit</th>
                  <th style={{ textAlign: 'right' }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 700 }}>{u.username}</td>
                    <td style={{ opacity: 0.8 }}>{u.email}</td>
                    <td>
                      <span className={`status-tag ${u.role === "SuperAdmin" ? "tag-onhold" : "tag-progress"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.department?.name || "-"}</td>
                    <td>
                      <div className="action-btn-group">
                        <button className="btn-icon-only" onClick={() => handleEdit(u)}>✏️ Edit</button>
                        <button className="btn-icon-only btn-delete-icon" onClick={() => handleDelete(u._id)}>🗑️ Delete</button>
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

export default UserPage;
