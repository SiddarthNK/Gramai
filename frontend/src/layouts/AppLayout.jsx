import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, Bell, LogOut, Menu, User, 
  ChevronDown, LayoutDashboard, MessageSquare, 
  Mic, BarChart, Upload, Settings as SettingsIcon,
  LogIn
} from 'lucide-react';

const navItems = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard',   exact: true },
  { to: '/chat',        icon: MessageSquare,   label: 'Chat'         },
  { to: '/voice',       icon: Mic,             label: 'Voice'        },
  { to: '/analytics',   icon: BarChart,        label: 'Analytics'    },
];

const systemItems = [
  { to: '/crop-upload', icon: Upload,       label: 'Crop Upload' },
  { to: '/settings',    icon: SettingsIcon, label: 'Settings'    },
];

const agents = [
  { label: 'Agriculture', dot: '#1D9E75', to: '/chat?agent=agriculture' },
  { label: 'Medical',     dot: '#378ADD', to: '/chat?agent=medical'     },
  { label: 'Education',   dot: '#EF9F27', to: '/chat?agent=education'   },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useChat();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const toggleDark = () => setDark(!dark);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Sidebar ─── */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '0 20px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, background: '#1D9E75', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: '#fff', fill: 'none', strokeWidth: 2 }}>
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <path d="M9 9h.01M15 9h.01"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>GramAI</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.5px' }}>RURAL AI PLATFORM</div>
          </div>
        </div>

        {/* Main nav */}
        <div style={{ padding: '0 12px', marginBottom: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'monospace', letterSpacing: '1px', padding: '0 8px', marginBottom: 8 }}>MAIN</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} style={{ width: 20 }} />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Agents */}
        <div style={{ padding: '0 12px', marginTop: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'monospace', letterSpacing: '1px', padding: '0 8px', marginBottom: 8 }}>AGENTS</div>
          {agents.map(a => (
            <div key={a.label} className="agent-badge" onClick={() => { navigate(a.to); setSidebarOpen(false); }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.dot, flexShrink: 0 }} />
              {a.label}
            </div>
          ))}
        </div>

        {/* System nav */}
        <div style={{ padding: '0 12px', marginTop: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'monospace', letterSpacing: '1px', padding: '0 8px', marginBottom: 8 }}>SYSTEM</div>
          {systemItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} style={{ width: 20 }} />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* User row */}
        <div style={{ marginTop: 'auto', padding: '16px 12px 0' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, cursor: 'pointer' }}
            className="agent-badge"
            onClick={() => { navigate('/settings'); setSidebarOpen(false); }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: '#1D9E75',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0,
            }}>{initials}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{user?.role || 'Farmer'} · {user?.location || 'Karnataka'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main ─── */}
      <div className="main-area">
        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="icon-btn md:hidden"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Toggle sidebar"
            >
              <i className="ti ti-menu-2" style={{ fontSize: 16 }} />
            </button>
            <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              GramAI
            </span>
            <div className="lang-toggle">
              <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
              <button className={`lang-btn ${language === 'kn' ? 'active' : ''}`} onClick={() => setLanguage('kn')}>ಕನ್ನಡ</button>
              <button className={`lang-btn ${language === 'hi' ? 'active' : ''}`} onClick={() => setLanguage('hi')}>हिंदी</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
              className="icon-btn" 
              onClick={toggleDark} 
              aria-label="Toggle dark mode"
              style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: dark ? '#FACC15' : '#1D9E75' }}
            >
              {dark ? <Sun size={18} color="#FACC15" /> : <Moon size={18} color="#A855F7" />}
            </button>
            <button className="icon-btn" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--color-background-secondary)',
              padding: '4px 10px 4px 8px',
              borderRadius: 8,
              border: '0.5px solid var(--color-border-tertiary)',
              cursor: 'default',
            }}>
              <div style={{ width: 7, height: 7, background: '#1D9E75', borderRadius: '50%' }} className="pulse-dot" />
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>3 agents online</span>
            </div>
            <div style={{ position: "relative" }} className="user-dropdown">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "1px solid var(--color-border-tertiary)",
                  background: "var(--color-background-secondary)",
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500"
                }}
              >
                <div style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "#1D9E75",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: '#fff'
                }}>
                  {initials}
                </div>
                <span>{user?.name || "User"}</span>
                <ChevronDown size={14} />
              </button>

              {showDropdown && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: "0",
                  background: "var(--color-background-primary)",
                  border: "1px solid var(--color-border-tertiary)",
                  borderRadius: "12px",
                  padding: "6px",
                  minWidth: "160px",
                  zIndex: 1000,
                  boxShadow: "0 10px 40px rgba(0,0,0,0.1)"
                }}>
                  <button
                    onClick={() => { navigate('/settings'); setShowDropdown(false); }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "none",
                      background: "transparent",
                      color: "var(--color-text-primary)",
                      cursor: "pointer",
                      fontSize: "13px",
                      textAlign: "left",
                    }}
                  >
                    <User size={14} /> Profile Settings
                  </button>
                  <div style={{ height: '1px', background: 'var(--color-border-tertiary)', margin: '4px 0' }} />
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "none",
                      background: "transparent",
                      color: "#EF4444",
                      cursor: "pointer",
                      fontSize: "13px",
                      textAlign: "left",
                    }}
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <Outlet />
      </div>
    </div>
  );
}
