import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [email, setEmail]   = useState('');
  const [pass, setPass]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !pass) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      await login(email, pass);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Demo login shortcut
  const demoLogin = async () => {
    setEmail('demo@gramai.in');
    setPass('demo1234');
    setLoading(true);
    try {
      await login('demo@gramai.in', 'demo1234');
      navigate('/');
    } catch {
      // If backend not available, manually set demo user
      localStorage.setItem('gram_token', 'demo_token');
      localStorage.setItem('gram_user', JSON.stringify({
        id: 1, name: 'Raju Kumar', email: 'demo@gramai.in',
        role: 'Farmer', location: 'Kolar, Karnataka',
      }));
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-background-secondary)', padding: 20,
    }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, background: '#1D9E75', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
          }}>
            <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, stroke: '#fff', fill: 'none', strokeWidth: 2 }}>
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>GramAI</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>Rural AI Assistant Platform</div>
        </div>

        <div className="auth-card">
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6, letterSpacing: '-0.3px' }}>Sign in</h1>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Access your GramAI dashboard</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
              <input
                className="gram-input"
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email"
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
              <input
                className="gram-input"
                type="password" value={pass} onChange={e => setPass(e.target.value)}
                placeholder="••••••••" autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div style={{ position: 'relative', margin: '20px 0', textAlign: 'center' }}>
            <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)', position: 'absolute', top: '50%', left: 0, right: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', background: 'var(--color-background-primary)', padding: '0 10px', position: 'relative', fontFamily: 'JetBrains Mono, monospace' }}>or</span>
          </div>

          <button onClick={demoLogin} className="btn-secondary" style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
            <i className="ti ti-player-play" style={{ fontSize: 14, marginRight: 6 }} /> Try Demo Account
          </button>

          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 20 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#1D9E75', textDecoration: 'none', fontWeight: 500 }}>Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
