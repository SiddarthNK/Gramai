import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import StatCard, { SkeletonStatCard } from '../components/ui/StatCard';
import ActivityFeed from '../components/ui/ActivityFeed';
import { ChatBubble } from '../components/chat/ChatBubble';
import VoiceBar from '../components/ui/VoiceBar';
import { analyticsAPI } from '../services/api';
import { useChat } from '../contexts/ChatContext';

// Default fallback data shown when API is loading/offline
const DEFAULT_STATS = [
  { label: 'Total queries', value: '2,841', delta: '12% this week', deltaPositive: true, icon: 'ti-message-dots' },
  { label: 'Crop scans',    value: '387',   delta: '8% this week',  deltaPositive: true, icon: 'ti-leaf'         },
  { label: 'Avg response',  value: '1.4s',  delta: 'Faster by 0.3s',deltaPositive: true, icon: 'ti-clock'        },
  { label: 'Active users',  value: '142',   delta: '3% this week',  deltaPositive: false,icon: 'ti-users'         },
];

const DEFAULT_AGENTS = [
  { name: 'Agriculture', stat: '1,204 queries · 94% satisfaction', pct: 94, color: '#1D9E75', pctColor: '#0F6E56', bg: '#E1F5EE', emoji: '🌾' },
  { name: 'Medical',     stat: '891 queries · 88% satisfaction',   pct: 88, color: '#378ADD', pctColor: '#185FA5', bg: '#E6F1FB', emoji: '🩺' },
  { name: 'Education',   stat: '746 queries · 91% satisfaction',   pct: 91, color: '#EF9F27', pctColor: '#854F0B', bg: '#FAEEDA', emoji: '📚' },
];

const PREVIEW_MESSAGES = [
  {
    id: 1, role: 'user', content: 'ನನ್ನ ಟೊಮೇಟೊ ಎಲೆಗಳಲ್ಲಿ ಹಳದಿ ಕಲೆಗಳಿವೆ',
    timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: 2, role: 'assistant', agent: 'agriculture', confidence: 0.94,
    content: 'Yellow spots on tomato leaves indicate Early Blight (Alternaria solani). Apply copper-based fungicide and ensure proper drainage.',
    timestamp: new Date(Date.now() - 19 * 60000).toISOString(),
  },
  {
    id: 3, role: 'user', content: 'My child has had fever for 2 days',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 4, role: 'assistant', agent: 'medical', confidence: 0.91,
    content: '⚠️ Please consult a qualified doctor immediately. For now, ensure hydration and monitor temperature every 4 hours.',
    timestamp: new Date(Date.now() - 9 * 60000).toISOString(),
  },
];

const DEFAULT_ACTIVITY = [
  { id: 1, title: 'Agriculture agent routed query about wheat irrigation', agent: 'agriculture', timestamp: new Date(Date.now() - 2 * 60000).toISOString() },
  { id: 2, title: 'Medical agent issued safety escalation for fever query',  agent: 'medical',     timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 3, title: 'Education agent generated quiz: Grade 8 Science',         agent: 'education',   timestamp: new Date(Date.now() - 11 * 60000).toISOString() },
  { id: 4, title: 'Crop scan: Tomato — Early Blight (87%)',                  agent: 'agriculture', timestamp: new Date(Date.now() - 18 * 60000).toISOString() },
  { id: 5, title: 'New user registered: Priya Devi, Raichur',                agent: 'system',      timestamp: new Date(Date.now() - 32 * 60000).toISOString() },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { sendMessage } = useChat();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(DEFAULT_ACTIVITY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then(res => {
        setStats(res.data.stats || DEFAULT_STATS);
        setActivity(res.data.activity || DEFAULT_ACTIVITY);
      })
      .catch(() => setStats(DEFAULT_STATS))
      .finally(() => setLoading(false));
  }, []);

  const displayStats = stats || DEFAULT_STATS;

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Main scrollable area */}
      <div className="content" style={{ flex: 1 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {loading
            ? Array(4).fill(0).map((_, i) => <SkeletonStatCard key={i} />)
            : displayStats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.07} />)
          }
        </div>

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Agent Performance Panel */}
          <motion.div className="panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Agent performance</span>
              <button onClick={() => navigate('/analytics')} style={{
                fontSize: 11, color: '#0F6E56', cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', background: 'none', border: 'none',
              }}>View all →</button>
            </div>
            {DEFAULT_AGENTS.map(a => (
              <div key={a.name} className="agent-card" onClick={() => navigate('/chat')}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>{a.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>{a.stat}</div>
                </div>
                <div style={{ flexShrink: 0, width: 60 }}>
                  <div style={{ height: 4, background: 'var(--color-background-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${a.pct}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                      style={{ height: '100%', background: a.color, borderRadius: 2 }}
                    />
                  </div>
                  <div style={{ fontSize: 10, color: a.pctColor, fontFamily: 'JetBrains Mono, monospace', marginTop: 3, textAlign: 'right' }}>{a.pct}%</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Chat preview panel */}
          <motion.div className="panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '16px 0 0' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 16px' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Recent conversation</span>
              <button onClick={() => navigate('/chat')} style={{
                fontSize: 11, color: '#0F6E56', cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', background: 'none', border: 'none',
              }}>Open chat →</button>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', padding: '0 16px', maxHeight: 200 }}>
              {PREVIEW_MESSAGES.map((m, i) => <ChatBubble key={m.id} message={m} index={i} />)}
            </div>
            <div style={{ padding: '12px 16px 16px', borderTop: '0.5px solid var(--color-border-tertiary)', marginTop: 12 }}>
              <VoiceBar compact />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Right Panel ─── */}
      <div className="right-col">
        {/* Crop Scan */}
        <div style={{ padding: 16, borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Crop disease scan</span>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', background: '#E1F5EE', color: '#0F6E56', padding: '2px 8px', borderRadius: 4 }}>NEW</span>
          </div>
          {/* Upload area */}
          <div
            onClick={() => navigate('/crop-upload')}
            style={{
              width: '100%', aspectRatio: '4/3',
              background: 'var(--color-background-secondary)',
              borderRadius: 10, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 12, cursor: 'pointer',
              border: '1.5px dashed var(--color-border-tertiary)',
              transition: 'border-color 0.15s',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#1D9E75'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-tertiary)'}
          >
            <i className="ti ti-photo" style={{ fontSize: 32, color: 'var(--color-text-tertiary)' }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Drop crop image here</span>
            <div style={{
              fontSize: 10, background: '#1D9E75', color: '#fff',
              padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
            }}>Upload photo</div>
          </div>
          {/* Disease result */}
          <div style={{
            padding: '10px 12px', borderRadius: 10,
            border: '0.5px solid #9FE1CB', background: '#E1F5EE',
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#0F6E56', marginBottom: 2 }}>Early Blight detected</div>
            <div style={{ fontSize: 11, color: '#1D9E75', fontFamily: 'JetBrains Mono, monospace' }}>Confidence: 87.3% · PlantVillage</div>
            <div style={{ height: 3, background: '#9FE1CB', borderRadius: 2, marginTop: 6 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '87%' }}
                transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
                style={{ height: '100%', background: '#0F6E56', borderRadius: 2 }}
              />
            </div>
          </div>
        </div>

        {/* Live Activity */}
        <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 14 }}>Live activity</div>
          <ActivityFeed items={activity} />
        </div>
      </div>
    </div>
  );
}
