import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { blockService, departmentService, programmeService } from "../services/api";
import "./MasterScreen.css";

const BlockPage = () => {
  const { user } = useContext(AuthContext);
  const [blocks, setBlocks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", department: "", programme: "" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (user?.role === "SuperAdmin") fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [blockRes, deptRes, progRes] = await Promise.all([
        blockService.getAll(),
        departmentService.getAll(),
        programmeService.getAll(),
      ]);
      setBlocks(blockRes.data);
      setDepartments(deptRes.data);
      setProgrammes(progRes.data);
      setError("");
    } catch (err) {
      setError("Infrastructure data synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await blockService.update(editingId, formData);
      } else {
        await blockService.create(formData);
      }
      setFormData({ name: "", department: "", programme: "" });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError("Operation failed: Database write error.");
    }
  };

  const handleEdit = (block) => {
    setFormData({
      ...block,
      department: block.department?._id || block.department || "",
      programme: block.programme?._id || block.programme || "",
    });
    setEditingId(block._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Permanent deletion of this infrastructure block code?")) {
      try {
        await blockService.delete(id);
        fetchData();
      } catch (err) {
        setError("Deletion failed: Structural dependency detected.");
      }
    }
  };

  if (loading) return <div className="loading">Mapping Structural Blocks...</div>;

  return (
    <div className="master-screen animated-bg">
      <div className="screen-content">
        
        {/* Header Rail Card */}
        <header className="screen-header-rail">
          <div>
            <h1>Block Infrastructure</h1>
            <p className="info-label">Facility block directory & academic programme mappings</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); if (showForm) setEditingId(null); }}
            className="btn-primary"
          >
            {showForm ? "✕ Close Interface" : "＋ Register Block"}
          </button>
        </header>

        {error && <div className="error-message">{error}</div>}

        {/* Toggled Form Glass Card */}
        {showForm && (
          <form className="master-form-glass" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Block Code / Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Science Block A"
                  required
                />
              </div>
              <div className="form-group">
                <label>Target Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Associated Core Programme</label>
                <select
                  value={formData.programme}
                  onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                  required
                >
                  <option value="">Select Academic Link</option>
                  {programmes.map((prog) => (
                    <option key={prog._id} value={prog._id}>{prog.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              {editingId ? "Update Designation" : "Establish Block"}
            </button>
          </form>
        )}

        {/* Data Table Card */}
        <section className="master-table-card">
          <div className="table-action-header">
            <h3>Infrastructure Registry</h3>
            <span className="info-label">{blocks.length} Blocks Verified</span>
          </div>

          <div className="table-wrapper">
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Block Identity</th>
                  <th>Department Link</th>
                  <th>Core Programme</th>
                  <th style={{ textAlign: 'right' }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => (
                  <tr key={block._id}>
                    <td style={{ fontWeight: 700 }}>{block.name}</td>
                    <td>{block.department?.name || "N/A"}</td>
                    <td>{block.programme?.name || "N/A"}</td>
                    <td>
                      <div className="action-btn-group">
                        <button className="btn-icon-only" onClick={() => handleEdit(block)}>✏️ Edit</button>
                        <button className="btn-icon-only btn-delete-icon" onClick={() => handleDelete(block._id)}>🗑️ Delete</button>
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

export default BlockPage;
