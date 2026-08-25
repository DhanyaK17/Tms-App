import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { roomService, departmentService, programmeService, blockService } from "../services/api";
import "./MasterScreen.css";

const RoomPage = () => {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ roomNumber: "", department: "", programme: "", block: "" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (user?.role === "SuperAdmin") fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomRes, deptRes, progRes, blockRes] = await Promise.all([
        roomService.getAll(),
        departmentService.getAll(),
        programmeService.getAll(),
        blockService.getAll(),
      ]);
      setRooms(roomRes.data);
      setDepartments(deptRes.data);
      setProgrammes(progRes.data);
      setBlocks(blockRes.data);
      setError("");
    } catch (err) {
      setError("Asset data synchronization failure.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await roomService.update(editingId, formData);
      } else {
        await roomService.create(formData);
      }
      setFormData({ roomNumber: "", department: "", programme: "", block: "" });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError("Registration failed: Database constraint violation.");
    }
  };

  const handleEdit = (room) => {
    setFormData({
      ...room,
      department: room.department?._id || room.department,
      programme: room.programme?._id || room.programme,
      block: room.block?._id || room.block,
    });
    setEditingId(room._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Authorize permanent removal of this facility record?")) {
      try {
        await roomService.delete(id);
        fetchData();
      } catch (err) {
        setError("Operation denied: Record is currently in use.");
      }
    }
  };

  if (loading) return <div className="loading">Profiling Facilities...</div>;

  return (
    <div className="master-screen animated-bg">
      <div className="screen-content">
        
        {/* Header Rail Card */}
        <header className="screen-header-rail">
          <div>
            <h1>Facility Room Directory</h1>
            <p className="info-label">Room allocation, block locations & departmental assignments</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); if (showForm) setEditingId(null); }}
            className="btn-primary"
          >
            {showForm ? "✕ Dismiss Console" : "＋ Register Room"}
          </button>
        </header>

        {error && <div className="error-message">{error}</div>}

        {/* Toggled Form Glass Card */}
        {showForm && (
          <form className="master-form-glass" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Room Identifier</label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="e.g. 102-G"
                  required
                />
              </div>
              <div className="form-group">
                <label>Structural Block</label>
                <select
                  value={formData.block}
                  onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                  required
                >
                  <option value="">Select Block</option>
                  {blocks.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Departmental Owner</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Programme Link</label>
                <select
                  value={formData.programme}
                  onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                  required
                >
                  <option value="">Select Academic Unit</option>
                  {programmes.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              {editingId ? "Update Facility" : "Establish Room"}
            </button>
          </form>
        )}

        {/* Master Table Card */}
        <section className="master-table-card">
          <div className="table-action-header">
            <h3>Facility Registry</h3>
            <span className="info-label">{rooms.length} Units Online</span>
          </div>
          <div className="table-wrapper">
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Room ID</th>
                  <th>Block Location</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'right' }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room._id}>
                    <td style={{ fontWeight: 700 }}>{room.roomNumber}</td>
                    <td>{room.block?.name || "N/A"}</td>
                    <td>{room.department?.name || "N/A"}</td>
                    <td>
                      <div className="action-btn-group">
                        <button className="btn-icon-only" onClick={() => handleEdit(room)}>✏️ Edit</button>
                        <button className="btn-icon-only btn-delete-icon" onClick={() => handleDelete(room._id)}>🗑️ Delete</button>
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

export default RoomPage;
