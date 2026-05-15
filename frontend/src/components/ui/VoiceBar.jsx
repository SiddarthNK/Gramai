import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { voiceAPI } from '../../services/api';
import { useChat } from '../../contexts/ChatContext';
import toast from 'react-hot-toast';

const WAVE_BARS = 16;

export default function VoiceBar({ compact = false }) {
  const { sendMessage, language } = useChat();
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        setProcessing(true);
        stream.getTracks().forEach(t => t.stop());
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const fd = new FormData();
          fd.append('audio', blob, 'voice.webm');
          fd.append('language', language);
          const res = await voiceAPI.transcribe(fd);
          const text = res.data.text;
          if (text?.trim()) {
            toast.success(`"${text.slice(0, 40)}…"`);
            await sendMessage(text, 'voice');
          } else {
            toast('No speech detected', { icon: '🎤' });
          }
        } catch {
          toast.error('Voice processing failed');
        } finally {
          setProcessing(false);
        }
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      toast.error('Microphone access denied');
    }
  }, [language, sendMessage]);

  const stopRecording = useCallback(() => {
    mediaRef.current?.stop();
    setRecording(false);
  }, []);

  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 12, padding: compact ? '10px 14px' : '12px 16px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      {/* Mic button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={recording ? stopRecording : startRecording}
        disabled={processing}
        style={{
          width: 40, height: 40, borderRadius: '50%',
          background: recording ? '#E53E3E' : '#1D9E75',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'background 0.2s',
          boxShadow: recording ? '0 0 0 6px rgba(229,62,62,0.2)' : 'none',
        }}
        aria-label={recording ? 'Stop recording' : 'Start recording'}
      >
        {processing ? (
          <i className="ti ti-loader-2" style={{ fontSize: 18, color: '#fff', animation: 'spin 1s linear infinite' }} />
        ) : (
          <i className={`ti ${recording ? 'ti-square-filled' : 'ti-microphone'}`} style={{ fontSize: 18, color: '#fff' }} />
        )}
      </motion.button>

      {/* Waveform */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 3, height: 32 }}>
        {Array.from({ length: WAVE_BARS }, (_, i) => (
          <div
            key={i}
            className={`wave-bar ${recording ? 'active' : ''}`}
            style={{
              animationDelay: `${(i * 0.07).toFixed(2)}s`,
              animationPlayState: recording ? 'running' : 'paused',
              height: recording ? undefined : 4,
            }}
          />
        ))}
      </div>

      {/* Language */}
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
        {language === 'kn' ? 'ಕನ್ನಡ' : 'EN'} · {recording ? '🔴 REC' : 'Ready'}
      </div>
    </div>
  );
}

// Add spin keyframe via style tag if needed
const style = document.createElement('style');
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
