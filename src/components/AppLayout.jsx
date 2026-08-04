import { NavLink, Outlet, useNavigate } from 'react-router'
import { useApp } from '../context/AppContext'

const userLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '◫' },
  { to: '/expenses', label: 'Expenses', icon: '↗' },
  { to: '/cards', label: 'My Cards', icon: '▣' },
  { to: '/recommend', label: 'Card Advisor', icon: '✦' },
]

const adminLinks = [{ to: '/admin', label: 'Admin Center', icon: '⚙' }]

export default function AppLayout() {
  const { currentUser, logout } = useApp()
  const navigate = useNavigate()
  const links = currentUser?.role === 'admin' ? adminLinks : userLinks

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <NavLink className="brand" to={currentUser?.role === 'admin' ? '/admin' : '/dashboard'}>
            <span className="brand-mark">$</span>
            <span>
              <strong>SmartWallet</strong>
              <small>Spend smarter.</small>
            </span>
          </NavLink>

          <nav className="side-nav" aria-label="Primary navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span aria-hidden="true">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{currentUser?.fullName?.charAt(0)}</span>
            <span>
              <strong>{currentUser?.fullName}</strong>
              <small>{currentUser?.role}</small>
            </span>
          </div>
          <button className="text-button" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
