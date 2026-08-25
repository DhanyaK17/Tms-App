import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Navbar.css";

const LogoutIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="logout-svg-icon"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path ? "top-nav-link active" : "top-nav-link";

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="top-navbar-header">
      <div className="top-navbar-container">
        {/* Left: Brand */}
        <div className="top-navbar-brand">
          <Link to="/dashboard" className="brand-link">
            <div className="brand-logo-badge">T</div>
            <div className="brand-title-group">
              <span className="brand-title">TMS</span>
              <span className="brand-sub">Platform</span>
            </div>
          </Link>
        </div>

        {/* Center: Main Navigation & Mobile Drawer */}
        <nav className={`top-navbar-links ${isMobileOpen ? "mobile-open" : ""}`}>
          {isAuthenticated ? (
            <>
              <Link to="/complaints/new" className={isActive("/complaints/new")}>
                <span className="nav-icon">✏️</span>
                <span className="nav-text">Raise Ticket</span>
              </Link>

              {user?.role !== "SuperAdmin" && (
                <>
                  <Link to="/my-complaints" className={isActive("/my-complaints")}>
                    <span className="nav-icon">📋</span>
                    <span className="nav-text">My Tickets</span>
                  </Link>
                  {user?.role !== "User" && (
                    <Link to="/complaints" className={isActive("/complaints")}>
                      <span className="nav-icon">🔧</span>
                      <span className="nav-text">Assigned Tickets</span>
                    </Link>
                  )}
                </>
              )}

              {user?.role === "SuperAdmin" && (
                <div className="admin-nav-group">
                  <Link to="/complaints" className={isActive("/complaints")}>
                    <span className="nav-icon">🗂️</span>
                    <span className="nav-text">Tickets</span>
                  </Link>
                  <Link to="/departments" className={isActive("/departments")}>
                    <span className="nav-icon">🏢</span>
                    <span className="nav-text">Departments</span>
                  </Link>
                  <Link to="/programmes" className={isActive("/programmes")}>
                    <span className="nav-icon">📚</span>
                    <span className="nav-text">Programmes</span>
                  </Link>
                  <Link to="/blocks" className={isActive("/blocks")}>
                    <span className="nav-icon">🏗️</span>
                    <span className="nav-text">Blocks</span>
                  </Link>
                  <Link to="/rooms" className={isActive("/rooms")}>
                    <span className="nav-icon">🚪</span>
                    <span className="nav-text">Rooms</span>
                  </Link>
                  <Link to="/users" className={isActive("/users")}>
                    <span className="nav-icon">👥</span>
                    <span className="nav-text">Users</span>
                  </Link>
                  <Link to="/roles" className={isActive("/roles")}>
                    <span className="nav-icon">🛡️</span>
                    <span className="nav-text">Roles</span>
                  </Link>
                  <Link to="/reports" className={isActive("/reports")}>
                    <span className="nav-icon">📊</span>
                    <span className="nav-text">Reports</span>
                  </Link>
                </div>
              )}

              <Link to="/profile" className={isActive("/profile")}>
                <span className="nav-icon">👤</span>
                <span className="nav-text">Profile ({user?.username})</span>
              </Link>

              {/* Mobile Explicit Logout Action inside Drawer */}
              <button onClick={handleLogout} className="mobile-logout-btn">
                <LogoutIcon />
                <span>Logout Session</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="top-nav-link">
              <span className="nav-icon">🔐</span>
              <span className="nav-text">Login</span>
            </Link>
          )}
        </nav>

        {/* Right: Controls (Mobile Toggle + User Pod + Always Visible Header Logout) */}
        <div className="top-navbar-controls">
          {isAuthenticated && (
            <div className="top-navbar-user">
              <Link to="/profile" className="user-profile-card">
                <div className="avatar-badge">
                  {user?.username?.charAt(0).toUpperCase()}
                  <span className="online-dot"></span>
                </div>
                <div className="user-info-text">
                  <span className="user-name">{user?.username}</span>
                  <span className="user-role-badge">{user?.role}</span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="top-logout-btn"
                title="Logout Session"
              >
                <LogoutIcon />
              </button>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            className="top-mobile-toggle"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle navigation"
          >
            {isMobileOpen ? "✕" : "☰"}
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
