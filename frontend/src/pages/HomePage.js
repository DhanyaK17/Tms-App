import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { complaintService } from "../services/api";
import "./HomePage.css";

const HomePage = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [recentTickets, setRecentTickets] = useState([]);
  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        complaintService.getStats().catch(() => ({ data: { total: 0, pending: 0, assigned: 0, closed: 0 } })),
        complaintService.getAll().catch(() => ({ data: [] }))
      ]).then(([statRes, compRes]) => {
        setStats(statRes.data || { total: 0, pending: 0, assigned: 0, closed: 0 });
        setRecentTickets((compRes.data || []).slice(0, 4));
      });
    }
  }, [isAuthenticated]);

  const adminLinks = [
    { to: "/complaints", label: "Tickets Master", desc: "Global ticket registry & assignment", icon: "🗂️", tag: "CORE" },
    { to: "/departments", label: "Departments", desc: "Department directory management", icon: "🏢", tag: "DIR" },
    { to: "/programmes", label: "Programmes", desc: "Academic programme mappings", icon: "📚", tag: "DIR" },
    { to: "/blocks", label: "Blocks & Sectors", desc: "Facility block allocations", icon: "🏗️", tag: "FAC" },
    { to: "/rooms", label: "Facility Rooms", desc: "Room directory & status", icon: "🚪", tag: "FAC" },
    { to: "/users", label: "User Access", desc: "Role & account permissions", icon: "👥", tag: "SEC" },
    { to: "/reports", label: "Reports & Intel", desc: "Analytics & data cluster export", icon: "📊", tag: "INTEL" },
  ];

  const userLinks = [
    { to: "/complaints/new", label: "Raise Ticket", desc: "Submit maintenance request", icon: "✏️", highlight: true },
    { to: "/my-complaints", label: "My Tickets", desc: "Track your reported incidents", icon: "📋" },
    ...(user?.role !== "User" ? [{ to: "/complaints", label: "Assigned Tickets", desc: "Work on assigned tasks", icon: "🔧" }] : []),
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending": return "tag-pending";
      case "Assigned": return "tag-assigned";
      case "In-Progress": return "tag-progress";
      case "Completed": return "tag-completed";
      default: return "";
    }
  };

  return (
    <div className="unique-home-page animated-bg">
      <div className="home-container">
        
        {/* Top System Telemetry Bar */}
        <div className="telemetry-bar">
          <div className="telemetry-node">
            <span className="node-dot"></span> SYSTEM: OPERATIONAL
          </div>
          <div className="telemetry-node">
            LATENCY: 8ms
          </div>
          <div className="telemetry-node">
            CLEARANCE: {user?.role || "GUEST"}
          </div>
        </div>

        {/* Hero Section */}
        <section className="dashboard-hero-card">
          <div className="hero-grid-pattern"></div>
          <div className="hero-content">
            <div className="hero-badge">TMS TACTICAL DASHBOARD</div>
            <h1 className="hero-title">
              {user?.role === "SuperAdmin" ? "Super Admin Command Hub" : "Facility Maintenance Hub"}
            </h1>
            <p className="hero-subtitle">
              Real-time issue tracking, facility oversight, and automated ticket dispatch.
            </p>
          </div>
          
          {isAuthenticated && (
            <div className="hero-user-pod">
              <div className="user-avatar-circle">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="user-pod-info">
                <span className="user-greeting">Welcome back,</span>
                <span className="user-display-name">{user?.username}</span>
                <span className="user-role-tag">{user?.role} ACCESS</span>
              </div>
            </div>
          )}
        </section>

        {/* Live Metrics Grid */}
        {isAuthenticated && (
          <section className="live-metrics-section">
            <div className="metrics-header">
              <span className="metrics-title">⚡ REAL-TIME SYSTEM METRICS</span>
              <span className="metrics-subtitle">Live Incident Telemetry</span>
            </div>

            <div className="home-metrics-grid">
              <div className="home-metric-card cyan">
                <div className="metric-icon-box">📊</div>
                <div className="metric-data">
                  <span className="metric-num">{stats.total}</span>
                  <span className="metric-text">TOTAL INCIDENTS</span>
                </div>
                <div className="metric-glow"></div>
              </div>

              <div className="home-metric-card amber">
                <div className="metric-icon-box">⏳</div>
                <div className="metric-data">
                  <span className="metric-num">{stats.pending}</span>
                  <span className="metric-text">AWAITING TRIAGE</span>
                </div>
                <div className="metric-glow"></div>
              </div>

              <div className="home-metric-card violet">
                <div className="metric-icon-box">🔧</div>
                <div className="metric-data">
                  <span className="metric-num">{stats.assigned}</span>
                  <span className="metric-text">IN FIELD VIEW</span>
                </div>
                <div className="metric-glow"></div>
              </div>

              <div className="home-metric-card green">
                <div className="metric-icon-box">✅</div>
                <div className="metric-data">
                  <span className="metric-num">{stats.closed}</span>
                  <span className="metric-text">RESOLVED UNITS</span>
                </div>
                <div className="metric-glow"></div>
              </div>
            </div>
          </section>
        )}

        {/* Quick Action Consoles */}
        <section className="action-consoles-section">
          <div className="section-label-bar">
            <h2>🚀 QUICK ACTION CONSOLE</h2>
            <span className="label-line"></span>
          </div>

          <div className="console-cards-grid">
            {(user?.role === "SuperAdmin" ? adminLinks : userLinks).map((link) => (
              <Link key={link.to} to={link.to} className={`console-action-card ${link.highlight ? 'highlight' : ''}`}>
                <div className="action-card-header">
                  <div className="action-icon-box">{link.icon}</div>
                  {link.tag && <span className="action-tag">{link.tag}</span>}
                </div>
                <div className="action-card-body">
                  <h3 className="action-title">{link.label}</h3>
                  <p className="action-desc">{link.desc}</p>
                </div>
                <div className="action-card-arrow">↗</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Incident Feed */}
        {isAuthenticated && recentTickets.length > 0 && (
          <section className="recent-tickets-section">
            <div className="recent-header">
              <h2>📡 RECENT SYSTEM INCIDENTS</h2>
              <Link to="/complaints" className="view-all-link">View All Tickets ↗</Link>
            </div>

            <div className="recent-tickets-grid">
              {recentTickets.map((ticket) => (
                <div key={ticket._id} className="recent-ticket-card">
                  <div className="ticket-card-top">
                    <span className="ticket-location">🏢 {ticket.blockName} • {ticket.roomNumber}</span>
                    <span className={`status-tag ${getStatusClass(ticket.status)}`}>{ticket.status}</span>
                  </div>
                  <div className="ticket-card-mid">
                    <span className="ticket-cat">{ticket.complaintType}</span>
                    <p className="ticket-remarks">{ticket.remarks ? (ticket.remarks.length > 60 ? ticket.remarks.substring(0, 60) + '...' : ticket.remarks) : 'No remarks provided.'}</p>
                  </div>
                  <div className="ticket-card-bottom">
                    <span className="ticket-date">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    <span className="ticket-by">{ticket.createdBy?.username || "Anonymous"}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default HomePage;
