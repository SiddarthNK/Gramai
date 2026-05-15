import { motion } from 'framer-motion';

export default function StatCard({ label, value, delta, deltaPositive, icon, delay = 0 }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div style={{
        fontSize: 11, color: 'var(--color-text-secondary)',
        marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: 14 }} />}
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)',
        fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-1px',
      }}>
        {value}
      </div>
      {delta && (
        <div style={{
          fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 3,
          color: deltaPositive !== false ? '#0F6E56' : '#993C1D',
        }}>
          <i className={`ti ${deltaPositive !== false ? 'ti-arrow-up' : 'ti-arrow-down'}`} style={{ fontSize: 11 }} />
          {delta}
        </div>
      )}
    </motion.div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <div className="skeleton" style={{ height: 11, width: '60%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 28, width: '70%', marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 11, width: '40%' }} />
    </div>
  );
}
