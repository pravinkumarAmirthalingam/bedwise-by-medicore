import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, BedDouble, Users, Settings, Bell, LogOut, Activity, SlidersHorizontal
} from 'lucide-react'

export default function AppShell({ children }) {
  const { user, logout, isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'HO'

  return (
    <div className="page-wrapper">
      {/* ── Top Navbar ── */}
      <nav className="navbar" aria-label="Main navigation">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <div className="navbar-logo" aria-hidden="true">
              <Activity size={18} strokeWidth={2.5} />
            </div>
            <div className="navbar-brand-text">
              <span className="navbar-title">
                HORM&nbsp;
                <span style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  background: 'rgba(13, 148, 136, 0.12)',
                  color: 'var(--primary)',
                  padding: '1px 6px',
                  borderRadius: 4,
                  letterSpacing: '0.06em',
                  verticalAlign: 'middle',
                }}>
                  ADMIN
                </span>
              </span>
              <span className="navbar-subtitle">
                Metro General - East...
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="navbar-links" aria-label="Primary desktop navigation">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `navbar-nav-item${isActive ? ' active' : ''}`}
              id="nav-desktop-dashboard"
            >
              <LayoutDashboard size={15} />
              Dashboard
            </NavLink>
            <NavLink
              to="/beds"
              className={({ isActive }) => `navbar-nav-item${isActive ? ' active' : ''}`}
              id="nav-desktop-beds"
            >
              <BedDouble size={15} />
              Beds
            </NavLink>
            <NavLink
              to="/patients"
              className={({ isActive }) => `navbar-nav-item${isActive ? ' active' : ''}`}
              id="nav-desktop-patients"
            >
              <Users size={15} />
              Patients
            </NavLink>
            {isSuperAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `navbar-nav-item${isActive ? ' active' : ''}`}
                id="nav-desktop-admin"
              >
                <Settings size={15} />
                Admin
              </NavLink>
            )}
          </div>

          <div className="navbar-actions">
            <button
              className="navbar-icon-btn"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="navbar-badge" aria-label="3 notifications">3</span>
            </button>
            <div
              className="navbar-avatar"
              title={user?.username}
              aria-label={`Logged in as ${user?.username}`}
            >
              {initials}
            </div>
            <button
              className="navbar-icon-btn"
              onClick={handleLogout}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <main className="page-content" id="main-content">
        {children}
      </main>

      {/* ── Bottom Tab Bar ── */}
      <nav className="tab-bar" aria-label="Bottom navigation">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
          id="tab-dashboard"
        >
          <span className="tab-icon-wrap" aria-hidden="true">
            <LayoutDashboard size={20} />
          </span>
          Dashboard
        </NavLink>

        <NavLink
          to="/beds"
          className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
          id="tab-beds"
        >
          <span className="tab-icon-wrap" aria-hidden="true">
            <BedDouble size={20} />
          </span>
          Beds
        </NavLink>

        <NavLink
          to="/patients"
          className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
          id="tab-patients"
        >
          <span className="tab-icon-wrap" aria-hidden="true">
            <Users size={20} />
          </span>
          Patients
        </NavLink>

        {isSuperAdmin ? (
          <NavLink
            to="/admin"
            className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
            id="tab-admin"
          >
            <span className="tab-icon-wrap" aria-hidden="true">
              <Settings size={20} />
            </span>
            Admin
          </NavLink>
        ) : (
          <button
            type="button"
            className="tab-item"
            id="tab-more"
            onClick={() => alert(`Logged in as: ${user?.username}\nHospital: Metro General Hospital\nRole: Hospital Admin\nSpring Boot Backend: Active`)}
          >
            <span className="tab-icon-wrap" aria-hidden="true">
              <SlidersHorizontal size={20} />
            </span>
            More
          </button>
        )}
      </nav>
    </div>
  )
}
