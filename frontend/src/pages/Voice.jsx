import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { voiceAPI } from '../services/api';
import { useChat } from '../contexts/ChatContext';
import { ChatBubble } from '../components/chat/ChatBubble';
import toast from 'react-hot-toast';

const WAVE_COUNT = 24;

export default function Voice() {
  const { sendMessage, messages, language, setLanguage } = useChat();
  const [state, setState] = useState('idle'); // idle | recording | processing | speaking
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const [amplitudes, setAmplitudes] = useState(Array(WAVE_COUNT).fill(4));
  const animRef = useRef(null);

  const animateWave = useCallback(() => {
    setAmplitudes(prev => prev.map(() => Math.random() * 28 + 4));
    animRef.current = requestAnimationFrame(() => {
      setTimeout(animateWave, 80);
    });
  }, []);

  const stopAnimation = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    setAmplitudes(Array(WAVE_COUNT).fill(4));
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stopAnimation();
        setState('processing');
        stream.getTracks().forEach(t => t.stop());
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const fd = new FormData();
          fd.append('audio', blob, 'voice.webm');
          fd.append('language', language);

          const sttRes = await voiceAPI.transcribe(fd);
          const text = sttRes.data.text?.trim();
          if (!text) { setState('idle'); toast('No speech detected', { icon: '🎤' }); return; }
          setTranscript(text);

          // Send to AI
          await sendMessage(text, 'voice');
          const lastMsg = messages[messages.length - 1];
          const responseText = lastMsg?.content || '';

          // TTS
          setState('speaking');
          try {
            const ttsRes = await voiceAPI.synthesize({ text: responseText, language });
            const url = URL.createObjectURL(ttsRes.data);
            setAudioUrl(url);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => setState('idle');
            audio.play();
          } catch {
            setState('idle');
          }
        } catch {
          setState('idle');
          toast.error('Voice processing failed');
        }
      };
      mr.start();
      mediaRef.current = mr;
      setState('recording');
      animateWave();
    } catch {
      toast.error('Microphone access denied');
    }
  }, [language, sendMessage, animateWave, stopAnimation, messages]);

  const stopRecording = () => {
    mediaRef.current?.stop();
  };

  const stopSpeaking = () => {
    audioRef.current?.pause();
    setState('idle');
  };

  useEffect(() => () => stopAnimation(), [stopAnimation]);

  const voiceMessages = messages.filter(m => m.mode === 'voice' || m.role === 'user');

  const stateConfig = {
    idle:       { color: '#1D9E75', icon: 'ti-microphone', label: 'Tap to speak',     btnLabel: 'Start' },
    recording:  { color: '#E53E3E', icon: 'ti-square-filled', label: 'Listening…',    btnLabel: 'Stop'  },
    processing: { color: '#EF9F27', icon: 'ti-loader-2',  label: 'Processing…',       btnLabel: '…'     },
    speaking:   { color: '#378ADD', icon: 'ti-volume',    label: 'AI is speaking…',   btnLabel: 'Stop'  },
  };
  const sc = stateConfig[state];

  return (
    <div className="content" style={{ alignItems: 'center', justifyContent: 'center', gap: 32 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 20, padding: 32, width: '100%', maxWidth: 480,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
        }}
      >
        {/* Language toggle */}
        <div className="lang-toggle">
          <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
          <button className={`lang-btn ${language === 'kn' ? 'active' : ''}`} onClick={() => setLanguage('kn')}>ಕನ್ನಡ</button>
        </div>

        {/* Big mic button */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {state === 'recording' && (
            <>
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: '#E53E3E' }}
              />
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: '#E53E3E' }}
              />
            </>
          )}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={state === 'idle' ? startRecording : state === 'recording' ? stopRecording : state === 'speaking' ? stopSpeaking : undefined}
            disabled={state === 'processing'}
            style={{
              width: 80, height: 80, borderRadius: '50%',
              background: sc.color, border: 'none', cursor: state === 'processing' ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1, position: 'relative',
            }}
            aria-label={sc.label}
          >
            <i className={`ti ${sc.icon}`} style={{
              fontSize: 32, color: '#fff',
              animation: state === 'processing' ? 'spin 1s linear infinite' : 'none',
            }} />
          </motion.button>
        </div>

        {/* State label */}
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 15, color: 'var(--color-text-secondary)', textAlign: 'center' }}
        >
          {sc.label}
        </motion.div>

        {/* Waveform */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 48, width: '100%' }}>
          {amplitudes.map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: state === 'recording' ? h : 4 }}
              transition={{ duration: 0.08 }}
              style={{
                flex: 1, borderRadius: 2,
                background: sc.color,
                opacity: state === 'idle' ? 0.3 : 1,
              }}
            />
          ))}
        </div>

        {/* Transcript */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'var(--color-background-secondary)',
                borderRadius: 10, fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5,
                border: '0.5px solid var(--color-border-tertiary)',
              }}
            >
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>YOU SAID</span>
              {transcript}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'center', lineHeight: 1.6 }}>
          Supports English and ಕನ್ನಡ<br />
          Speech → AI Agent → Voice Response
        </div>
      </motion.div>

      {/* Recent voice chats */}
      {messages.length > 0 && (
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>RECENT INTERACTIONS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.slice(-4).map((m, i) => <ChatBubble key={m.id} message={m} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
