import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('arushi@jiit.ac.in');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 460, padding: '56px 24px' }}>
      <div className="glass-card">
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div className="logo-badge" style={{ margin: '0 auto 12px' }}>
            <Sparkles size={20} />
          </div>
          <h1 style={{ fontSize: '1.65rem' }}>{isRegister ? 'Create Solvix Account' : 'Welcome to Solvix'}</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: 4 }}>
            {isRegister
              ? 'Get an auto-generated anonymous alias to ask & verify solutions safely.'
              : 'Sign in to access your personal problem-solving dashboard.'}
          </p>
        </div>

        {error && (
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(244,63,94,0.16)', color: '#fda4af', marginBottom: 14, fontSize: '0.86rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="arushi_dev"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="you@jiit.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: 13 }}>
            {loading ? 'Authenticating...' : isRegister ? 'Create Account & Generate Alias' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: '0.88rem', color: '#94a3b8' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: '#a78bfa', fontWeight: 600, cursor: 'pointer' }}
          >
            {isRegister ? 'Sign In' : 'Register Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
