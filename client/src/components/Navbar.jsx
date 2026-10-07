import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar__brand">
        <span className="navbar__brand-dot" />
        DecisionDesk
      </Link>
      <div className="navbar__right">
        {user && (
          <span className="navbar__user">
            {user.name}
          </span>
        )}
        <button className="btn btn--ghost btn--sm" onClick={logout}>
          Sign out
        </button>
      </div>
    </nav>
  )
}
