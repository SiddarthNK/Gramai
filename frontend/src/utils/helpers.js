export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatRelative(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function getAgentColor(agent) {
  const map = {
    agriculture: { bg: '#E1F5EE', text: '#0F6E56', dot: '#1D9E75' },
    medical:     { bg: '#E6F1FB', text: '#185FA5', dot: '#378ADD' },
    education:   { bg: '#FAEEDA', text: '#854F0B', dot: '#EF9F27' },
    default:     { bg: '#F5F5F3', text: '#636360', dot: '#9C9C99' },
  };
  return map[agent] || map.default;
}

export function getAgentIcon(agent) {
  const map = {
    agriculture: 'ti-leaf',
    medical:     'ti-heart-rate-monitor',
    education:   'ti-book',
    default:     'ti-brain',
  };
  return map[agent] || map.default;
}

export function getAgentLabel(agent) {
  const map = {
    agriculture: 'Senior Agriculture Expert',
    medical:     'Medical Health Officer',
    education:   'Lead Education Tutor',
    default:     'GramAI Orchestrator',
  };
  return map[agent] || map.default;
}

export function getAgentEmoji(agent) {
  const map = { agriculture: '🌾', medical: '🩺', education: '📚' };
  return map[agent] || '🤖';
}

export function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

export function truncate(str, len = 60) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function getSeverityColor(severity) {
  const map = {
    low:      { bg: '#E1F5EE', text: '#0F6E56', label: 'Low Risk' },
    medium:   { bg: '#FAEEDA', text: '#854F0B', label: 'Moderate' },
    high:     { bg: '#FDE8E8', text: '#9B2121', label: 'High Risk' },
    critical: { bg: '#FDDCDC', text: '#7B1A1A', label: 'CRITICAL' },
  };
  return map[severity] || map.low;
}
