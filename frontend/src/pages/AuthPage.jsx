import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', identifier: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(form.identifier, form.password);
        toast.success(`Welcome back, ${user.name}! 💕`);
        navigate(user.role === 'owner' ? '/owner' : '/');
      } else {
        if (form.password !== form.confirm) { toast.error('Passwords do not match'); setLoading(false); return; }
        if (!form.email && !form.phone) { toast.error('Enter email or phone number'); setLoading(false); return; }
        const user = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
        toast.success(`Welcome, ${user.name}! 🌸`);
        navigate('/');
      }
    } catch (err) {
      toast.error(err.userMessage || err.response?.data?.error || err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      {/* Decorative */}
      <div style={styles.decorLeft}>🌸</div>
      <div style={styles.decorRight}>✨</div>

      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🌸</div>
          <h1 style={styles.title}>TUBA Team</h1>
          <p style={styles.subtitle}>
            {mode === 'login' ? 'Welcome back, beautiful! 💕' : 'Join our lovely community 🌸'}
          </p>
        </div>

        {/* Toggle */}
        <div style={styles.toggle}>
          <button onClick={() => setMode('login')} style={{ ...styles.toggleBtn, ...(mode === 'login' ? styles.toggleActive : {}) }}>
            Sign In
          </button>
          <button onClick={() => setMode('register')} style={{ ...styles.toggleBtn, ...(mode === 'register' ? styles.toggleActive : {}) }}>
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <FormField label="Full Name *" icon="👤">
              <input placeholder="Your beautiful name" value={form.name} onChange={e => set('name', e.target.value)} required />
            </FormField>
          )}

          {mode === 'login' ? (
            <FormField label="Email or Phone" icon="📧">
              <input placeholder="Email or phone number" value={form.identifier} onChange={e => set('identifier', e.target.value)} required />
            </FormField>
          ) : (
            <>
              <FormField label="Email" icon="📧">
                <input type="email" placeholder="your@email.com (optional if phone given)" value={form.email} onChange={e => set('email', e.target.value)} />
              </FormField>
              <FormField label="Phone Number" icon="📞">
                <input type="tel" placeholder="09XXXXXXXX (optional if email given)" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </FormField>
            </>
          )}

          <FormField label="Password" icon="🔒">
            <input type="password" placeholder="Your password" value={form.password} onChange={e => set('password', e.target.value)} required />
          </FormField>

          {mode === 'register' && (
            <FormField label="Confirm Password" icon="🔒">
              <input type="password" placeholder="Confirm password" value={form.confirm} onChange={e => set('confirm', e.target.value)} required />
            </FormField>
          )}

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ marginTop: 8, justifyContent: 'center', padding: '14px', opacity: loading ? 0.7 : 1 }}>
            {loading ? '⏳ Please wait...' : mode === 'login' ? '💕 Sign In' : '🌸 Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-light)', fontSize: 13 }}>
          {mode === 'login' ? (
            <>Don't have an account? <button onClick={() => setMode('register')} style={styles.linkBtn}>Sign up here 🌸</button></>
          ) : (
            <>Already have an account? <button onClick={() => setMode('login')} style={styles.linkBtn}>Sign in 💕</button></>
          )}
        </div>

        {mode === 'login' && (
          <div style={styles.ownerHint}>
            <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
              👑 Owner? Use your registered email & password
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const FormField = ({ label, icon, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--mauve)', marginBottom: 6 }}>
      {icon} {label}
    </label>
    {children}
  </div>
);

const styles = {
  page: {
    minHeight: 'calc(100vh - 64px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '32px 16px', position: 'relative',
  },
  decorLeft: { position: 'fixed', left: '5%', top: '30%', fontSize: 80, opacity: 0.1, pointerEvents: 'none' },
  decorRight: { position: 'fixed', right: '5%', top: '50%', fontSize: 80, opacity: 0.1, pointerEvents: 'none' },
  card: {
    background: 'white', borderRadius: 24, padding: '40px',
    width: '100%', maxWidth: 440,
    boxShadow: '0 20px 60px var(--shadow-lg)',
  },
  title: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: 32, color: 'var(--mauve)', fontWeight: 500,
  },
  subtitle: { color: 'var(--text-light)', fontSize: 14, marginTop: 4 },
  toggle: {
    display: 'flex', background: 'var(--blush)',
    borderRadius: 50, padding: 4, marginBottom: 24,
  },
  toggleBtn: {
    flex: 1, padding: '10px', border: 'none',
    borderRadius: 50, cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 14, fontWeight: 500,
    color: 'var(--text-light)', background: 'transparent',
    transition: 'all 0.3s',
  },
  toggleActive: {
    background: 'white', color: 'var(--mauve)',
    boxShadow: '0 2px 12px var(--shadow)',
  },
  linkBtn: {
    background: 'none', border: 'none',
    color: 'var(--rose-dark)', cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif', fontSize: 13,
    fontWeight: 600,
  },
  ownerHint: {
    marginTop: 16, textAlign: 'center',
    padding: '10px', background: 'var(--blush)',
    borderRadius: 12,
  },
};
