import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChat } from '../contexts/ChatContext';
import { ChatBubble, TypingIndicator } from '../components/chat/ChatBubble';
import ChatInput from '../components/chat/ChatInput';
import { cropAPI } from '../services/api';
import toast from 'react-hot-toast';
import { getAgentEmoji } from '../utils/helpers';

const AGENT_TABS = [
  { key: 'all',         label: 'All',         emoji: '🤖' },
  { key: 'agriculture', label: 'Agriculture', emoji: '🌾' },
  { key: 'medical',     label: 'Medical',     emoji: '🩺' },
  { key: 'education',   label: 'Education',   emoji: '📚' },
];

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
                  fontFamily: 'Sora, sans-serif', fontWeight: activeTopic === t.key ? 500 : 400,
                  background: activeTopic === t.key ? '#1D9E75' : 'var(--color-background-secondary)',
                  color: activeTopic === t.key ? '#fff' : 'var(--color-text-secondary)',
                  borderColor: activeTopic === t.key ? '#1D9E75' : 'var(--color-border-tertiary)',
                }}
              >
                <span>{t.emoji}</span> {t.label}
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
              style={{ textAlign: 'center', marginTop: 80 }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌾</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                Ask GramAI anything
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Crop diseases · Medical advice · Education help<br />
                Supports English & ಕನ್ನಡ · Voice enabled
              </div>
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
      </div>

      {/* Right: Agent info panel */}
      <div className="right-col" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 14 }}>AI Agents</div>
          {[
            { key: 'agriculture', emoji: '🌾', label: 'Agriculture', desc: 'Crops, pests, weather, market', bg: '#E1F5EE', color: '#0F6E56' },
            { key: 'medical',     emoji: '🩺', label: 'Medical',     desc: 'Symptoms, safety, hospitals',  bg: '#E6F1FB', color: '#185FA5' },
            { key: 'education',   emoji: '📚', label: 'Education',   desc: 'Concepts, quizzes, tutoring',  bg: '#FAEEDA', color: '#854F0B' },
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
