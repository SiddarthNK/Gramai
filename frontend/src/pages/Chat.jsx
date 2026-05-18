import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChat } from '../contexts/ChatContext';
import { ChatBubble, TypingIndicator } from '../components/chat/ChatBubble';
import ChatInput from '../components/chat/ChatInput';
import { cropAPI } from '../services/api';
import toast from 'react-hot-toast';
import { getAgentEmoji } from '../utils/helpers';

const AGENT_CONFIG = {
  agriculture: {
    icon: "🌾",
    title: "Ask KrishiBot",
    subtitle: "Crops · Diseases · Fertilizers · Weather",
    color: "#22c55e",
    badge: "Agriculture AI",
    placeholder: "Ask about crops, soil, diseases..."
  },
  medical: {
    icon: "🏥",
    title: "Ask HealthBot",
    subtitle: "Symptoms · Medicine · Health advice",
    color: "#3b82f6",
    badge: "Health AI",
    placeholder: "Describe your symptoms..."
  },
  education: {
    icon: "🎓",
    title: "Ask TutorBot",
    subtitle: "Math · Science · Any subject",
    color: "#a855f7",
    badge: "Education AI",
    placeholder: "Ask any study question..."
  },
  all: {
    icon: "🤖",
    title: "Personal Assistant",
    subtitle: "Weather · Time · Planning · Anything",
    color: "#f59e0b",
    badge: "AI Assistant",
    placeholder: "Ask me anything at all..."
  },
  grammar: {
    icon: "✍️",
    title: "Grammar Fixer",
    subtitle: "Correct · Improve · Rewrite text",
    color: "#ec4899",
    badge: "Writing AI",
    placeholder: "Paste your text to check grammar..."
  },
  planner: {
    icon: "📅",
    title: "Day Planner",
    subtitle: "Schedule · Tasks · Productivity",
    color: "#06b6d4",
    badge: "Planner AI",
    placeholder: "Tell me your tasks for today..."
  }
};

const AGENT_TABS = [
  { key: 'all',         label: '🤖 Assistant' },
  { key: 'agriculture', label: '🌾 Farming' },
  { key: 'medical',     label: '🏥 Health' },
  { key: 'education',   label: '🎓 Education' },
  { key: 'grammar',     label: '✍️ Grammar' },
  { key: 'planner',     label: '📅 Planner' }
];

const QUICK_ACTIONS = {
  all: [
    "What time is it now?",
    "What is the weather today?",
    "Plan my day for me",
    "Tell me a joke"
  ],
  grammar: [
    "Check my grammar",
    "Rewrite this formally",
    "Translate to Kannada",
    "Simplify this text"
  ],
  planner: [
    "Plan my morning routine",
    "Make a study schedule",
    "Help me prioritize tasks",
    "Plan a productive week"
  ],
  agriculture: [
    "Best crop for June in Karnataka",
    "How to treat yellow leaves",
    "Fertilizer for tomato",
    "Pest control tips"
  ],
  medical: [
    "I have fever and cold",
    "Headache remedies",
    "When to see a doctor",
    "Healthy diet tips"
  ],
  education: [
    "Explain photosynthesis",
    "Solve math problem",
    "Help me write an essay",
    "Quiz me on science"
  ]
};

export default function Chat() {
  const { messages, isTyping, sendMessage, clearMessages, activeTopic, setActiveTopic } = useChat();
  const [cropResult, setCropResult] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const filtered = messages;

  const handleImageUpload = async (file) => {
    const preview = URL.createObjectURL(file);
    const fd = new FormData();
    fd.append('image', file);
    toast.loading('Analyzing crop image…', { id: 'crop-analyze' });
    try {
      const res = await cropAPI.uploadImage(fd);
      setCropResult({ ...res.data, preview });
      toast.success(`Detected: ${res.data.plant_name} - ${res.data.disease} (${Math.round(res.data.confidence * 100)}%)`, { id: 'crop-analyze' });
      // Also send to chat
      await sendMessage(`I uploaded a crop image. It appears to be a ${res.data.plant_name}. Analysis result: ${res.data.disease} with ${Math.round(res.data.confidence * 100)}% confidence. What should I do?`);
    } catch {
      toast.error('Image analysis failed — check backend', { id: 'crop-analyze' });
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '12px 20px', borderBottom: '0.5px solid var(--color-border-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {AGENT_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTopic(t.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 20, fontSize: 12,
                  border: '0.5px solid', cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'Sora, sans-serif', fontWeight: activeTopic === t.key ? 600 : 400,
                  background: activeTopic === t.key ? `${AGENT_CONFIG[t.key].color}20` : 'var(--color-background-secondary)',
                  color: activeTopic === t.key ? AGENT_CONFIG[t.key].color : 'var(--color-text-secondary)',
                  borderColor: activeTopic === t.key ? AGENT_CONFIG[t.key].color : 'var(--color-border-tertiary)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeTopic && activeTopic !== 'all' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20,
                  background: '#E1F5EE', color: '#0F6E56',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {getAgentEmoji(activeTopic)} {activeTopic} active
              </motion.div>
            )}
            <button
              onClick={clearMessages}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 8,
                background: 'none', border: '0.5px solid var(--color-border-tertiary)',
                color: 'var(--color-text-tertiary)', cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', marginTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
            >
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 0.3; transform: scale(0.8) }
                  50% { opacity: 1; transform: scale(1) }
                }
              `}</style>
              <div style={{ 
                fontSize: 56, lineHeight: 1, 
                filter: `drop-shadow(0 0 12px ${AGENT_CONFIG[activeTopic]?.color || '#1D9E75'})`,
                transition: 'all 0.3s ease' 
              }}>
                {AGENT_CONFIG[activeTopic]?.icon || '🤖'}
              </div>

              <span style={{
                fontSize: '11px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase',
                color: AGENT_CONFIG[activeTopic]?.color || '#1D9E75',
                border: `1px solid ${(AGENT_CONFIG[activeTopic]?.color || '#1D9E75')}40`,
                borderRadius: '20px', padding: '4px 12px',
                background: `${(AGENT_CONFIG[activeTopic]?.color || '#1D9E75')}15`
              }}>
                {AGENT_CONFIG[activeTopic]?.badge || 'Gram AI'}
              </span>

              <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-text-primary)', margin: '0' }}>
                {AGENT_CONFIG[activeTopic]?.title || 'Ask GramAI anything'}
              </h2>

              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0', lineHeight: '1.6' }}>
                {AGENT_CONFIG[activeTopic]?.subtitle || 'Farming · Health · Education · Government schemes'}
              </p>

              <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: '0' }}>
                Supports English & ಕನ್ನಡ · Voice enabled
              </p>
            </motion.div>
          )}
          <AnimatePresence>
            {filtered.map((m, i) => <ChatBubble key={m.id} message={m} index={i} />)}
            {isTyping && <TypingIndicator key="typing" />}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Crop result preview inside chat */}
        {cropResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              margin: '0 20px 12px',
              padding: 12, borderRadius: 12,
              border: '0.5px solid #9FE1CB', background: '#E1F5EE',
              display: 'flex', gap: 12, alignItems: 'center',
            }}
          >
            <img src={cropResult.preview} alt="Analyzed crop" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F6E56' }}>
                {cropResult.plant_name} - {cropResult.disease}
              </div>
              <div style={{ fontSize: 11, color: '#1D9E75', fontFamily: 'JetBrains Mono, monospace' }}>
                Confidence: {Math.round((cropResult.confidence || 0) * 100)}%
              </div>
              <div style={{ fontSize: 11, color: '#0F6E56', marginTop: 2 }}>{cropResult.treatment_summary}</div>
            </div>
            <button onClick={() => setCropResult(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#0F6E56' }}>
              <i className="ti ti-x" style={{ fontSize: 16 }} />
            </button>
          </motion.div>
        )}

        <ChatInput onImageUpload={handleImageUpload} />
        
        {/* Quick Actions */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          padding: "8px 20px 16px 20px"
        }}>
          {(QUICK_ACTIONS[activeTopic] || []).map((action, i) => (
            <button
              key={i}
              onClick={() => {
                sendMessage(action);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#9ca3af",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => {
                e.target.style.borderColor = AGENT_CONFIG[activeTopic]?.color || "#1D9E75"
                e.target.style.color = AGENT_CONFIG[activeTopic]?.color || "#1D9E75"
              }}
              onMouseLeave={e => {
                e.target.style.borderColor = "rgba(255,255,255,0.1)"
                e.target.style.color = "#9ca3af"
              }}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Agent info panel */}
      <div className="right-col" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 14 }}>AI Agents</div>
          {[
            { key: 'all',         emoji: '🤖', label: 'Assistant',   desc: 'Weather, time, any question',  bg: '#FFF3E0', color: '#E65100' },
            { key: 'agriculture', emoji: '🌾', label: 'Agriculture', desc: 'Crops, pests, weather, market', bg: '#E1F5EE', color: '#0F6E56' },
            { key: 'medical',     emoji: '🩺', label: 'Medical',     desc: 'Symptoms, safety, hospitals',  bg: '#E6F1FB', color: '#185FA5' },
            { key: 'education',   emoji: '📚', label: 'Education',   desc: 'Concepts, quizzes, tutoring',  bg: '#FAEEDA', color: '#854F0B' },
            { key: 'grammar',     emoji: '✍️', label: 'Grammar',     desc: 'Correct and rewrite text',     bg: '#FCE4EC', color: '#AD1457' },
            { key: 'planner',     emoji: '📅', label: 'Planner',     desc: 'Schedule and productivity',    bg: '#E0F7FA', color: '#006064' },
          ].map(a => (
            <div 
              key={a.key} 
              className={`agent-card ${activeTopic === a.key ? 'active' : ''}`} 
              onClick={() => setActiveTopic(a.key)}
              style={{
                borderColor: activeTopic === a.key ? a.color : 'var(--color-border-tertiary)',
                background: activeTopic === a.key ? a.bg : 'none'
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{a.emoji}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{a.label}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: 16, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 12 }}>Tips</div>
          {[
            { icon: '🌾', tip: 'Upload a crop photo for instant disease detection' },
            { icon: '🎤', tip: 'Use voice in Kannada for hands-free interaction' },
            { icon: '⚠️', tip: 'Medical responses include safety disclaimers' },
            { icon: '🔒', tip: 'All conversations are private and encrypted' },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{t.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
