import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import axios from '../api/axios'
import AmbientBackground from './AmbientBackground'

const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    path: '/tasks',
    label: 'Tasks',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    path: '/courses',
    label: 'Courses',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  {
    path: '/calendar',
    label: 'Calendar',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    path: '/notifications',
    label: 'Notifications',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
]

const Layout = ({ children }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarCollapsed')
    return stored === 'true'
  })

  useEffect(() => {
    axios.get('/notifications/unread-count')
      .then(res => setUnreadCount(res.data.count || 0))
      .catch(() => {})
  }, [location.pathname])

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=DM+Sans:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .layout-root {
          display: flex;
          min-height: 100vh;
          background: #0a0a0f;
          font-family: 'DM Sans', sans-serif;
          color: #e9d5ff;
          position: relative;
          isolation: isolate;
        }

        .ambient-bg-layer {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .ambient-canvas {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .ambient-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(88px);
          pointer-events: none;
          animation: ambientDrift 13s ease-in-out infinite alternate;
        }

        .ambient-blob-1 {
          width: 460px;
          height: 460px;
          background: rgba(109, 40, 217, 0.16);
          top: -130px;
          left: -90px;
          animation-delay: 0s;
        }

        .ambient-blob-2 {
          width: 320px;
          height: 320px;
          background: rgba(76, 29, 149, 0.2);
          bottom: -80px;
          right: -70px;
          animation-delay: -4s;
        }

        .ambient-blob-3 {
          width: 230px;
          height: 230px;
          background: rgba(139, 92, 246, 0.1);
          top: 48%;
          left: 52%;
          transform: translate(-50%, -50%);
          animation-delay: -8s;
        }

        @keyframes ambientDrift {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(26px, 18px) scale(1.08); }
        }

        /* ── Sidebar (desktop) ── */
        .sidebar {
          width: 220px;
          min-height: 100vh;
          background: rgba(15, 10, 30, 0.95);
          border-right: 1px solid rgba(139, 92, 246, 0.12);
          display: flex;
          flex-direction: column;
          padding: 28px 16px 24px;
          position: fixed;
          top: 0; left: 0;
          z-index: 50;
          backdrop-filter: blur(20px);
          transition: width 0.22s ease;
        }

        .layout-root.sidebar-collapsed .sidebar {
          width: 76px;
          padding-left: 10px;
          padding-right: 10px;
        }

        .sidebar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 26px;
        }

        .sidebar-toggle {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.22);
          color: rgba(233, 213, 255, 0.8);
          width: 28px;
          height: 28px;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }

        .sidebar-toggle:hover {
          background: rgba(139, 92, 246, 0.18);
          border-color: rgba(139, 92, 246, 0.35);
          color: #e9d5ff;
        }

        .sidebar-logo {
          font-family: 'Poppins', sans-serif;
          font-size: 22px;
          font-weight: 400;
          color: #e9d5ff;
          letter-spacing: -0.5px;
          padding: 0 8px;
          margin-bottom: 0;
          text-decoration: none;
          overflow: hidden;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
        }

        .sidebar-logo span {
          font-weight: 700;
          background: linear-gradient(135deg, #c084fc, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          color: rgba(167, 139, 250, 0.5);
          text-decoration: none;
          font-size: 14px;
          font-weight: 400;
          transition: background 0.18s, color 0.18s;
          position: relative;
        }

        .nav-text {
          white-space: nowrap;
        }

        .nav-link:hover {
          background: rgba(139, 92, 246, 0.08);
          color: rgba(233, 213, 255, 0.85);
        }

        .nav-link.active {
          background: rgba(139, 92, 246, 0.15);
          color: #e9d5ff;
        }

        .nav-link.active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 3px;
          background: linear-gradient(180deg, #c084fc, #7c3aed);
          border-radius: 0 3px 3px 0;
        }

        .nav-badge {
          margin-left: auto;
          background: #7c3aed;
          color: #f3e8ff;
          font-size: 10px;
          font-weight: 600;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
        }

        .sidebar-footer {
          border-top: 1px solid rgba(139, 92, 246, 0.1);
          padding-top: 16px;
          margin-top: 8px;
        }

        .layout-root.sidebar-collapsed .nav-text,
        .layout-root.sidebar-collapsed .user-name,
        .layout-root.sidebar-collapsed .sidebar-logo .logo-text {
          display: none;
        }

        .layout-root.sidebar-collapsed .sidebar-logo {
          justify-content: center;
          width: 100%;
          padding: 0;
          font-size: 20px;
        }

        .layout-root.sidebar-collapsed .sidebar-logo .logo-short {
          display: inline;
        }

        .sidebar-logo .logo-short {
          display: none;
        }

        .layout-root.sidebar-collapsed .sidebar-top {
          flex-direction: column;
          margin-bottom: 18px;
        }

        .layout-root.sidebar-collapsed .nav-link {
          justify-content: center;
          padding-left: 10px;
          padding-right: 10px;
        }

        .layout-root.sidebar-collapsed .nav-link .nav-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          margin-left: 0;
          min-width: 14px;
          height: 14px;
          font-size: 9px;
          border-radius: 7px;
          padding: 0 3px;
        }

        .layout-root.sidebar-collapsed .user-row {
          justify-content: center;
          padding-left: 0;
          padding-right: 0;
        }

        .user-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 10px;
        }

        .user-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #c084fc;
          flex-shrink: 0;
        }

        .user-name {
          font-size: 13px;
          color: rgba(233, 213, 255, 0.6);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .logout-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(167, 139, 250, 0.4);
          padding: 4px;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
          display: flex; align-items: center;
        }

        .logout-btn:hover {
          color: rgba(233, 213, 255, 0.8);
          background: rgba(139, 92, 246, 0.1);
        }

        /* ── Main content ── */
        .main-content {
          margin-left: 220px;
          flex: 1;
          min-height: 100vh;
          padding: 32px;
          transition: margin-left 0.22s ease;
          position: relative;
          z-index: 1;
        }

        .layout-root.sidebar-collapsed .main-content {
          margin-left: 76px;
        }

        /* ── Bottom nav (mobile) ── */
        .bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: rgba(10, 8, 20, 0.97);
          border-top: 1px solid rgba(139, 92, 246, 0.12);
          backdrop-filter: blur(20px);
          z-index: 50;
          padding: 8px 0 env(safe-area-inset-bottom, 8px);
        }

        .bottom-nav-inner {
          display: flex;
          justify-content: space-around;
          align-items: center;
        }

        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 6px 12px;
          color: rgba(167, 139, 250, 0.45);
          text-decoration: none;
          font-size: 10px;
          transition: color 0.18s;
          position: relative;
        }

        .bottom-nav-item.active {
          color: #c084fc;
        }

        .bottom-nav-item .nav-badge {
          position: absolute;
          top: 2px; right: 4px;
          margin-left: 0;
        }

        /* ── Page enter animation ── */
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .page-enter {
          animation: pageIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main-content {
            margin-left: 0;
            padding: 20px 16px 80px;
          }
          .bottom-nav { display: block; }
        }
      `}</style>

      <div className={`layout-root${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <AmbientBackground />

        {/* ── Desktop Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-top">
            <NavLink to="/dashboard" className="sidebar-logo" title="Dashboard">
              <span className="logo-text">Priorit<span>Ease</span></span>
              <span className="logo-short">P<span>E</span></span>
            </NavLink>
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed((v) => !v)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {sidebarCollapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
              </svg>
            </button>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {item.icon}
                <span className="nav-text">{item.label}</span>
                {item.path === '/notifications' && unreadCount > 0 && (
                  <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-row">
              <div className="user-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="user-name">{user?.name || 'User'}</span>
            </div>
          </div>
        </aside>

        {/* ── Page content ── */}
        <main className="main-content">
          <div className="page-enter" key={location.pathname}>
            {children}
          </div>
        </main>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="bottom-nav">
          <div className="bottom-nav-inner">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
              >
                <span style={{ position: 'relative' }}>
                  {item.icon}
                  {item.path === '/notifications' && unreadCount > 0 && (
                    <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

      </div>
    </>
  )
}

export default Layout