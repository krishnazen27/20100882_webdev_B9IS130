import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const canViewShipments = ['admin', 'operator', 'client'].includes(user?.role);
  const canViewCustoms = ['admin', 'customs'].includes(user?.role);
  const homePath = user?.role === 'customs' ? '/customs' : '/';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to={homePath} className="brand">
          SKR-Global <span>Marine Logistics Management</span>
        </Link>
        {user && (
          <nav aria-label="Main Navigation" className="nav-links">
            {canViewShipments && <Link to="/">Shipments Console</Link>}
            {canViewCustoms && <Link to="/customs">Customs Console</Link>}
            <span className="role-pill">{user.role.toUpperCase()}</span>
            <button type="button" onClick={handleLogout} className="btn-outline">
              Sign Out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
