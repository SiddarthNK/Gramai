import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    location: user?.location || '',
    role: user?.role || 'Farmer',
    language: 'en',
    notifications: true,
    voiceEnabled: true,
    darkMode: false,
  });
  const [saved, setSaved] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSave = async () => {
    await updateUser({ name: form.name, location: form.location, role: form.role });
    setSaved(true);
    toast.success('Settings saved!');
    setTimeout(() => setSaved(false), 2000);
  };

  const Section = ({ title, children }) => (
    <div className="panel">
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 18, paddingBottom: 12, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  );

  const Field = ({ label, hint, children }) => (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{hint}</p>}
    </div>
  );

  const Toggle = ({ label, checked, onChange, iconOn, iconOff }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {checked ? (iconOn && <i className={`ti ${iconOn}`} style={{ fontSize: 16, color: '#1D9E75' }} />) : (iconOff && <i className={`ti ${iconOff}`} style={{ fontSize: 16, color: 'var(--color-text-tertiary)' }} />)}
        {label}
      </span>
      <button
        onClick={onChange}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: checked ? '#1D9E75' : 'var(--color-border-tertiary)',
          position: 'relative', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
           <i className={`ti ${checked ? (iconOn || '') : (iconOff || '')}`} style={{ fontSize: 10, color: checked ? '#1D9E75' : 'var(--color-text-tertiary)' }} />
        </div>
      </button>
    </div>
  );

  return (
    <div className="content" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>Settings</h1>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Manage your account and preferences</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className="btn-primary"
          style={{ background: saved ? '#0F6E56' : '#1D9E75' }}
        >
          <i className={`ti ${saved ? 'ti-check' : 'ti-device-floppy'}`} style={{ fontSize: 14 }} />
          {saved ? 'Saved!' : 'Save Changes'}
        </motion.button>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <Field label="Full Name">
          <input className="gram-input" value={form.name} onChange={set('name')} placeholder="Your name" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Location">
            <input className="gram-input" value={form.location} onChange={set('location')} placeholder="Village, District" />
          </Field>
          <Field label="Role">
            <select className="gram-input" value={form.role} onChange={set('role')}>
              {['Farmer','Student','Healthcare Worker','Teacher','Admin'].map(r => <option key={r}>{r}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Email" hint="Email cannot be changed">
          <input className="gram-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
        </Field>
      </Section>

      {/* Language */}
      <Section title="Language & Voice">
        <Field label="Preferred Language">
          <div style={{ display: 'flex', gap: 8 }}>
            {[['en', '🇬🇧 English'], ['kn', '🇮🇳 Kannada']].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setForm(f => ({ ...f, language: k }))}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  border: `0.5px solid ${form.language === k ? '#1D9E75' : 'var(--color-border-tertiary)'}`,
                  background: form.language === k ? '#E1F5EE' : 'var(--color-background-secondary)',
                  color: form.language === k ? '#0F6E56' : 'var(--color-text-secondary)',
                  fontWeight: form.language === k ? 500 : 400,
                }}
              >{l}</button>
            ))}
          </div>
        </Field>
        <Toggle label="Enable voice interaction" checked={form.voiceEnabled} onChange={() => setForm(f => ({ ...f, voiceEnabled: !f.voiceEnabled }))} iconOn="ti-volume" iconOff="ti-volume-off" />
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <Toggle label="Push notifications" checked={form.notifications} onChange={() => setForm(f => ({ ...f, notifications: !f.notifications }))} iconOn="ti-bell" iconOff="ti-bell-off" />
        <Toggle label="Dark mode" checked={form.darkMode} onChange={() => {
          setForm(f => ({ ...f, darkMode: !f.darkMode }));
          document.documentElement.classList.toggle('dark');
        }} iconOn="ti-moon" iconOff="ti-sun" />
      </Section>

      {/* Danger zone */}
      <Section title="Account">
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" style={{ flex: 1 }}>
            <i className="ti ti-download" style={{ fontSize: 14, marginRight: 6 }} /> Export Data
          </button>
          <button
            onClick={logout}
            style={{
              flex: 1, padding: '10px 20px', borderRadius: 8, fontSize: 13,
              background: '#FDE8E8', color: '#9B2121', border: '0.5px solid #F5ACAC', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Sora, sans-serif',
            }}
          >
            <i className="ti ti-logout" style={{ fontSize: 14 }} /> Sign Out
          </button>
        </div>
      </Section>
    </div>
  );
}
