import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-logo">Split<span>Smart</span></span>
      </Link>
      <div className="navbar-actions">
        {user && (
          <>
            <div className="avatar-chip">
              <div className="avatar">{user.avatar}</div>
              {user.name.split(' ')[0]}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
