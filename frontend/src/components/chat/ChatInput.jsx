import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import { voiceAPI } from '../../services/api';
import toast from 'react-hot-toast';

const QUICK_PROMPTS = [
  { label: 'Crop disease?', icon: 'ti-leaf', agent: 'agriculture' },
  { label: 'Fever advice', icon: 'ti-heart-rate-monitor', agent: 'medical' },
  { label: 'Explain math', icon: 'ti-book', agent: 'education' },
  { label: 'Weather crops', icon: 'ti-cloud', agent: 'agriculture' },
];

export default function ChatInput({ onImageUpload }) {
  const { sendMessage, language } = useChat();
  const [value, setValue] = useState('');
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const fileRef = useRef(null);

  const handleSend = useCallback(async () => {
    const text = value.trim();
    if (!text) return;
    setValue('');
    await sendMessage(text);
  }, [value, sendMessage]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const fd = new FormData();
        fd.append('audio', blob, 'voice.webm');
        fd.append('language', language);
        try {
          const res = await voiceAPI.transcribe(fd);
          const transcribed = res.data.text;
          setValue(transcribed);
          toast.success('Voice transcribed!');
        } catch {
          toast.error('Transcription failed — check backend connection');
        }
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    setUploading(true);
    try {
      await onImageUpload?.(file);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ padding: '12px 16px', borderTop: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
      {/* Quick prompts */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {QUICK_PROMPTS.map(p => (
          <button
            key={p.label}
            onClick={() => { setValue(p.label); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, padding: '4px 10px', borderRadius: 20,
              border: '0.5px solid var(--color-border-tertiary)',
              background: 'var(--color-background-secondary)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#1D9E75'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-tertiary)'}
          >
            <i className={`ti ${p.icon}`} style={{ fontSize: 11 }} />
            {p.label}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: 'var(--color-background-secondary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 14, padding: '8px 12px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = '#1D9E75'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--color-border-tertiary)'}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <textarea
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={handleKey}
              placeholder={language === 'kn' ? 'ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ...' : 'Ask about farming, health, or education...'}
              rows={1}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                resize: 'none', fontSize: 13, fontFamily: 'Sora, sans-serif',
                color: 'var(--color-text-primary)', lineHeight: 1.5,
                maxHeight: 120, minHeight: 24, overflowY: 'auto',
              }}
            />
            {/* Image upload inside input for cleaner look */}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                color: uploading ? '#1D9E75' : 'var(--color-text-tertiary)',
                cursor: 'pointer', background: 'none', border: 'none', padding: '2px 0'
              }}
              title="Upload crop image"
            >
              <i className={`ti ${uploading ? 'ti-loader-2' : 'ti-photo'}`} style={{ fontSize: 18, animation: uploading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
          
          {/* Bottom info bar inside input box */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: 'var(--color-text-tertiary)', opacity: value.length > 0 ? 1 : 0 }}>
              {value.length}/2000
            </span>
          </div>
        </div>

        {/* Action Buttons Group */}
        <div style={{ display: 'flex', gap: 8 }}>
          <AnimatePresence mode="wait">
            {recording ? (
              <motion.button
                key="stop"
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                onClick={stopRecording}
                style={{
                  width: 48, height: 48, borderRadius: '50%', background: '#E53E3E',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(229,62,62,0.3)',
                  transition: 'all 0.2s',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="ti ti-square-filled" style={{ fontSize: 20, color: '#fff' }} />
              </motion.button>
            ) : (
              <motion.button
                key="mic"
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                onClick={startRecording}
                style={{
                  width: 48, height: 48, borderRadius: '50%', background: '#1D9E75',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(29,158,117,0.25)',
                  transition: 'all 0.2s',
                }}
                whileHover={{ scale: 1.05, background: '#178F68' }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="ti ti-microphone" style={{ fontSize: 22, color: '#fff' }} />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleSend}
            disabled={!value.trim()}
            style={{
              width: 48, height: 48, borderRadius: 16,
              background: value.trim() ? '#1D9E75' : 'var(--color-background-secondary)',
              border: value.trim() ? 'none' : '1px solid var(--color-border-tertiary)',
              cursor: value.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: value.trim() ? '0 4px 15px rgba(29,158,117,0.3)' : 'none',
            }}
            whileHover={value.trim() ? { scale: 1.05, background: '#178F68' } : {}}
            whileTap={value.trim() ? { scale: 0.95 } : {}}
          >
            <i className="ti ti-send-2" style={{
              fontSize: 22,
              color: value.trim() ? '#fff' : 'var(--color-text-tertiary)',
              transform: value.trim() ? 'translateX(1px)' : 'none'
            }} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
