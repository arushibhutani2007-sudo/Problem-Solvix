import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, Compass, Globe, PlusCircle, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo-wrap">
          <div className="logo-badge">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="brand-font">Solvix</span>
            <span style={{ fontSize: '0.7rem', display: 'block', color: '#94a3b8', fontWeight: 500, marginTop: -4 }}>
              Verified Problem Intelligence
            </span>
          </div>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Compass size={17} /> Knowledge Base
          </NavLink>
          <NavLink to="/explore-external" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Globe size={17} /> Federated Search
          </NavLink>
          {user && (
            <>
              <NavLink to="/post" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <PlusCircle size={17} /> Ask Anonymously
              </NavLink>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={17} /> Dashboard
              </NavLink>
            </>
          )}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.84rem'
                }}
                title={`Anonymous Alias: ${user.anonymous_alias}`}
              >
                <ShieldCheck size={15} color="#a78bfa" />
                <span>{user.username}</span>
                <span className="badge badge-verified">{user.reputation} rep</span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 12px' }} title="Logout">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary">
              Sign In / Register
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
