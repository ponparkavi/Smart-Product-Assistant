import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Cpu, LogOut, User, LayoutDashboard, Box } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand-logo">
        <Cpu className="brand-badge" size={28} />
        <span>Smart<span className="brand-badge">Product</span> AI</span>
      </Link>

      {user ? (
        <ul className="nav-links">
          <li>
            <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              <LayoutDashboard size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/products" className={`nav-link ${location.pathname.startsWith('/products') ? 'active' : ''}`}>
              <Box size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Appliance Vault
            </Link>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginLeft: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <User size={16} />
              {user.full_name}
            </span>
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <LogOut size={14} />
              Logout
            </button>
          </li>
        </ul>
      ) : (
        <ul className="nav-links">
          <li>
            <Link to="/login" className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}>
              Sign In
            </Link>
          </li>
          <li>
            <Link to="/register" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}>
              Get Started
            </Link>
          </li>
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
