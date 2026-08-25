import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { complaintService } from "../services/api";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("general");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user) {
      complaintService.getStats()
        .then(res => setStats(res.data))
        .catch(err => console.error("Failed to fetch stats", err));
    }
  }, [user]);

  // General Tab State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Password Tab State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Preferences State
  const [preferences, setPreferences] = useState({
    emailNotifs: user?.preferences?.emailNotifs ?? true,
    smsNotifs: user?.preferences?.smsNotifs ?? false,
    darkMode: user?.preferences?.darkMode ?? true,
  });

  const [notifications, setNotifications] = useState({
    ticketUpdates: user?.notifications?.ticketUpdates ?? true,
    mentions: user?.notifications?.mentions ?? true,
    weeklyReports: user?.notifications?.weeklyReports ?? false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!user) {
    return <div className="profile-loading">Initializing Operator Dossier...</div>;
  }

  const handleGeneralChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handlePreferenceToggle = async (key) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    try {
      await updateProfile({ preferences: newPrefs });
      setSuccess("Preferences updated successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save preferences.");
    }
  };

  const handleNotificationToggle = async (key) => {
    const newNotifs = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifs);
    try {
      await updateProfile({ notifications: newNotifs });
      setSuccess("Notification settings updated.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save notifications.");
    }
  };

  const handleGeneralSave = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setSuccess("Operator profile updated!");
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setError("New passwords do not match");
    }
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess("Security key updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    clearMessages();
    setIsEditing(false);
  };

  return (
    <div className="unique-profile-page animated-bg">
      <div className="profile-container">
        
        {/* 1. Cyber Identity Cover Banner */}
        <section className="profile-hero-banner">
          <div className="banner-grid-overlay"></div>
          <div className="profile-identity-card">
            <div className="avatar-hex-wrapper">
              <div className="avatar-hex-ring">
                <div className="avatar-hex-inner">
                  {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="cyber-pulse-dot"></span>
              </div>
            </div>
            
            <div className="identity-details">
              <div className="identity-header">
                <h1>{user.username || "Operator"}</h1>
                <span className="cyber-role-pill">
                  <span className="status-dot"></span> {user.role || "User"}
                </span>
              </div>
              <p className="identity-email">{user.email || "No Email Provided"}</p>
              
              <div className="identity-chips-row">
                <span className="chip"><span className="chip-label">ID:</span> SYS-{user._id ? user._id.slice(-6).toUpperCase() : "000000"}</span>
                {user.department && <span className="chip"><span className="chip-label">DEPT:</span> {user.department.name}</span>}
                {user.programme && <span className="chip"><span className="chip-label">PROG:</span> {user.programme.name}</span>}
                <span className="chip active-chip"><span className="chip-label">STATUS:</span> AUTHORIZED</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Cyber Performance Metrics Matrix */}
        {stats && (
          <section className="metrics-matrix">
            <div className="metric-card cyan">
              <div className="metric-header">
                <span className="metric-icon">📋</span>
                <span className="metric-label">TOTAL ASSIGNED</span>
              </div>
              <div className="metric-value">{stats.total}</div>
              <div className="metric-bar"><div className="bar-fill" style={{ width: '100%' }}></div></div>
            </div>

            <div className="metric-card violet">
              <div className="metric-header">
                <span className="metric-icon">⚙️</span>
                <span className="metric-label">IN-PROGRESS</span>
              </div>
              <div className="metric-value">{stats.inProgress || 0}</div>
              <div className="metric-bar"><div className="bar-fill" style={{ width: `${stats.total ? ((stats.inProgress || 0) / stats.total) * 100 : 0}%` }}></div></div>
            </div>

            <div className="metric-card amber">
              <div className="metric-header">
                <span className="metric-icon">⏳</span>
                <span className="metric-label">PENDING TRIAGE</span>
              </div>
              <div className="metric-value">{stats.pending}</div>
              <div className="metric-bar"><div className="bar-fill" style={{ width: `${stats.total ? (stats.pending / stats.total) * 100 : 0}%` }}></div></div>
            </div>

            <div className="metric-card green">
              <div className="metric-header">
                <span className="metric-icon">✅</span>
                <span className="metric-label">RESOLVED UNITS</span>
              </div>
              <div className="metric-value">{stats.closed}</div>
              <div className="metric-bar"><div className="bar-fill" style={{ width: `${stats.total ? (stats.closed / stats.total) * 100 : 0}%` }}></div></div>
            </div>
          </section>
        )}

        {/* 3. Floating Pill Tabs Navigator */}
        <section className="profile-console-section">
          <div className="pill-tabs-nav">
            <button
              className={`pill-tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => switchTab('general')}
            >
              👤 General Details
            </button>
            <button
              className={`pill-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => switchTab('security')}
            >
              🔒 Cyber Security
            </button>
            <button
              className={`pill-tab ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => switchTab('preferences')}
            >
              ⚙️ App Preferences
            </button>
            <button
              className={`pill-tab ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => switchTab('notifications')}
            >
              🔔 Notifications
            </button>
          </div>

          {/* 4. Tab Content Console Card */}
          <div className="console-content-card">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">✓ {success}</div>}

            {activeTab === 'general' && (
              <div className="tab-fade-in">
                <div className="console-header-row">
                  <h3>Operator Information</h3>
                  {!isEditing && (
                    <button className="btn-primary" onClick={() => setIsEditing(true)}>
                      ✏️ Edit Profile
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleGeneralSave} className="cyber-form-grid">
                    <div className="form-group">
                      <label>Username Handle</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleGeneralChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email Identity</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleGeneralChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone Contact</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleGeneralChange}
                        required
                      />
                    </div>

                    <div className="form-actions-row">
                      <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        Save Identity
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="info-cards-grid">
                    <div className="info-node">
                      <span className="info-icon">✉️</span>
                      <div className="info-text">
                        <span className="info-label">Email Address</span>
                        <span className="info-value">{user.email || "Not Provided"}</span>
                      </div>
                    </div>

                    <div className="info-node">
                      <span className="info-icon">📞</span>
                      <div className="info-text">
                        <span className="info-label">Phone Number</span>
                        <span className="info-value">{user.phone || "Not Provided"}</span>
                      </div>
                    </div>

                    <div className="info-node">
                      <span className="info-icon">🏢</span>
                      <div className="info-text">
                        <span className="info-label">Department</span>
                        <span className="info-value">{user.department?.name || "Global Tier"}</span>
                      </div>
                    </div>

                    <div className="info-node">
                      <span className="info-icon">📚</span>
                      <div className="info-text">
                        <span className="info-label">Programme Hub</span>
                        <span className="info-value">{user.programme?.name || "System Level"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="tab-fade-in">
                <div className="console-header-row">
                  <h3>Security & Password Control</h3>
                </div>
                <form onSubmit={handlePasswordSave} className="cyber-form-grid" style={{ maxWidth: '550px' }}>
                  <div className="form-group">
                    <label>Current Security Key</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="form-group">
                    <label>New Security Key</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm New Key</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                    Update Security Key
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="tab-fade-in">
                <div className="console-header-row">
                  <h3>System Preferences</h3>
                </div>
                <div className="switch-options-list">
                  <div className="switch-row">
                    <div className="switch-info">
                      <h4>Email Alerts</h4>
                      <p>Receive immediate email notifications on ticket assignments and status transitions.</p>
                    </div>
                    <label className="cyber-toggle">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifs}
                        onChange={() => handlePreferenceToggle('emailNotifs')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="switch-row">
                    <div className="switch-info">
                      <h4>SMS Critical Notifications</h4>
                      <p>Send mobile SMS text dispatches for high-priority incidents.</p>
                    </div>
                    <label className="cyber-toggle">
                      <input
                        type="checkbox"
                        checked={preferences.smsNotifs}
                        onChange={() => handlePreferenceToggle('smsNotifs')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="switch-row">
                    <div className="switch-info">
                      <h4>Dark Mode Interface</h4>
                      <p>Keep high-contrast dark cyberpunk HUD active across all views.</p>
                    </div>
                    <label className="cyber-toggle">
                      <input
                        type="checkbox"
                        checked={preferences.darkMode}
                        onChange={() => handlePreferenceToggle('darkMode')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="tab-fade-in">
                <div className="console-header-row">
                  <h3>Notification Channels</h3>
                </div>
                <div className="switch-options-list">
                  <div className="switch-row">
                    <div className="switch-info">
                      <h4>Ticket Activity Updates</h4>
                      <p>Alert when status changes on your submitted or assigned maintenance tickets.</p>
                    </div>
                    <label className="cyber-toggle">
                      <input
                        type="checkbox"
                        checked={notifications.ticketUpdates}
                        onChange={() => handleNotificationToggle('ticketUpdates')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="switch-row">
                    <div className="switch-info">
                      <h4>Mentions & Comments</h4>
                      <p>Notify when your handle is referenced in maintenance remarks.</p>
                    </div>
                    <label className="cyber-toggle">
                      <input
                        type="checkbox"
                        checked={notifications.mentions}
                        onChange={() => handleNotificationToggle('mentions')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="switch-row">
                    <div className="switch-info">
                      <h4>Weekly System Intelligence</h4>
                      <p>Receive a weekly performance summary of resolved tickets and system metrics.</p>
                    </div>
                    <label className="cyber-toggle">
                      <input
                        type="checkbox"
                        checked={notifications.weeklyReports}
                        onChange={() => handleNotificationToggle('weeklyReports')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

      </div>
    </div>
  );
};

export default ProfilePage;
