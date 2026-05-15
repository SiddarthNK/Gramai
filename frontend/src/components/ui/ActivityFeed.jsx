import { formatRelative } from '../../utils/helpers';

const dotColors = {
  agriculture: '#1D9E75',
  medical:     '#378ADD',
  education:   '#EF9F27',
  system:      '#888780',
};

export default function ActivityFeed({ items = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((item, i) => (
        <div key={item.id || i} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 10, height: 10, marginTop: 3, flexShrink: 0,
              background: dotColors[item.agent] || dotColors.system,
              borderRadius: '50%',
            }} />
            {i < items.length - 1 && (
              <div className="act-line" />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
              {formatRelative(item.timestamp)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
