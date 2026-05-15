import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { analyticsAPI } from '../services/api';

const TIMESERIES = [
  { date: 'Mon', queries: 320, crop_scans: 45, voice: 89 },
  { date: 'Tue', queries: 410, crop_scans: 62, voice: 101 },
  { date: 'Wed', queries: 380, crop_scans: 55, voice: 95 },
  { date: 'Thu', queries: 490, crop_scans: 71, voice: 140 },
  { date: 'Fri', queries: 520, crop_scans: 83, voice: 162 },
  { date: 'Sat', queries: 380, crop_scans: 49, voice: 110 },
  { date: 'Sun', queries: 341, crop_scans: 42, voice: 91 },
];

const AGENT_PIE = [
  { name: 'Agriculture', value: 44, color: '#1D9E75' },
  { name: 'Medical',     value: 32, color: '#378ADD' },
  { name: 'Education',   value: 24, color: '#EF9F27' },
];

const DISEASE_DATA = [
  { disease: 'Early Blight',    count: 112 },
  { disease: 'Late Blight',     count: 78  },
  { disease: 'Leaf Spot',       count: 65  },
  { disease: 'Rust',            count: 44  },
  { disease: 'Mosaic Virus',    count: 38  },
  { disease: 'Powdery Mildew',  count: 31  },
];

const SUMMARY_CARDS = [
  { label: 'Total Users',    value: '1,247', delta: '+18%', icon: 'ti-users',        color: '#1D9E75' },
  { label: 'Queries Today',  value: '341',   delta: '+12%', icon: 'ti-message-dots', color: '#378ADD' },
  { label: 'Voice Sessions', value: '91',    delta: '+8%',  icon: 'ti-microphone',   color: '#EF9F27' },
  { label: 'Crop Scans',     value: '42',    delta: '+5%',  icon: 'ti-leaf',         color: '#1D9E75' },
  { label: 'Avg Response',   value: '1.4s',  delta: '-0.3s',icon: 'ti-clock',        color: '#378ADD' },
  { label: 'Satisfaction',   value: '91%',   delta: '+2%',  icon: 'ti-star',         color: '#EF9F27' },
];

const TT = {
  background: 'var(--color-background-primary)',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 8, fontSize: 11,
  fontFamily: 'JetBrains Mono, monospace',
  color: 'var(--color-text-primary)',
};

export default function Analytics() {
  const [range, setRange] = useState('7d');
  const [ts, setTs] = useState(TIMESERIES);

  useEffect(() => {
    analyticsAPI.getTimeSeries(range)
      .then(r => setTs(r.data.timeseries || TIMESERIES))
      .catch(() => setTs(TIMESERIES));
  }, [range]);

  return (
    <div className="content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>Analytics</h1>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Platform performance & AI usage</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--color-background-secondary)', borderRadius: 8, padding: 3 }}>
          {['7d','30d','90d'].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 11,
              fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
              border: range === r ? '0.5px solid var(--color-border-tertiary)' : 'none',
              background: range === r ? 'var(--color-background-primary)' : 'transparent',
              color: range === r ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: range === r ? 500 : 400,
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        {SUMMARY_CARDS.map((c, i) => (
          <motion.div key={c.label} className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <i className={`ti ${c.icon}`} style={{ fontSize: 14, color: c.color }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.5px' }}>{c.value}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{c.label}</div>
            <div style={{ fontSize: 10, color: '#0F6E56', marginTop: 3, fontFamily: 'JetBrains Mono, monospace' }}>{c.delta}</div>
          </motion.div>
        ))}
      </div>

      {/* Area chart */}
      <div className="panel">
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 16 }}>Query Volume ({range})</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={ts} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TT} />
            <Area type="monotone" dataKey="queries" stroke="#1D9E75" fill="url(#qGrad)" strokeWidth={2} name="Queries" dot={false} />
            <Area type="monotone" dataKey="voice"   stroke="#378ADD" fill="none"          strokeWidth={1.5} name="Voice" dot={false} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Pie */}
        <div className="panel">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 16 }}>Agent Distribution</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={AGENT_PIE} cx={65} cy={65} innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {AGENT_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={TT} formatter={v => [`${v}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {AGENT_PIE.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--color-text-secondary)' }}>{p.name}</span>
                  <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-text-primary)' }}>{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Diseases bar */}
        <div className="panel">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 16 }}>Top Crop Diseases</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={DISEASE_DATA} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 60 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="disease" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={55} />
              <Tooltip contentStyle={TT} />
              <Bar dataKey="count" fill="#1D9E75" radius={[0, 4, 4, 0]} name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
