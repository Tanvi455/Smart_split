import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Login failed. Check your credentials.'); }
    finally { setLoading(false); }
  };

  const demoLogin = async () => {
    setError(''); setLoading(true);
    try { await login('alice@demo.com', 'password123'); navigate('/'); }
    catch { setError('Demo login failed — make sure the backend is running and seeded.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-header">
          <h1>SplitSmart</h1>
          <p>Split expenses. Keep friendships.</p>
        </div>
        <div className="auth-card">
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary" style={{ width:'100%' }} disabled={loading}>
              {loading ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}} /> Signing in…</> : 'Sign In'}
            </button>
          </form>
          <button className="btn btn-ghost" style={{ width:'100%', marginTop:10 }}
            onClick={demoLogin} disabled={loading}>
            Try Demo Account
          </button>
        </div>
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
