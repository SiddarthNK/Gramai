import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import toast from 'react-hot-toast';
import { Mic, MicOff, Send, Loader2, Image as ImageIcon } from 'lucide-react';

const QUICK_PROMPTS = [
  { label: 'Crop disease?', icon: 'ti-leaf', agent: 'agriculture' },
  { label: 'Fever advice', icon: 'ti-heart-rate-monitor', agent: 'medical' },
  { label: 'Explain math', icon: 'ti-book', agent: 'education' },
  { label: 'Weather crops', icon: 'ti-cloud', agent: 'agriculture' },
];

export default function ChatInput({ onImageUpload }) {
  const { sendMessage, language, activeTopic } = useChat();
  const [value, setValue] = useState('');
  const [recording, setRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
      
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const mr = new MediaRecorder(stream, { mimeType });
      
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 500) {
          toast.error("Recording too short");
          return;
        }

        await handleChatTranscription(blob, mimeType);
        stream.getTracks().forEach(t => t.stop());
      };
      
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && recording) {
      mediaRef.current.stop();
      setRecording(false);
    }
  };

  const handleChatTranscription = async (blob, mimeType) => {
    try {
      setIsProcessing(true);
      const extension = mimeType.includes("webm") ? "webm" : "ogg";
      const formData = new FormData();
      formData.append('file', blob, `chat_voice.${extension}`);
      formData.append('language', language);

      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/audio/transcribe`, {
        method: "POST",
        body: formData
      });
      
      const result = await response.json();
      if (result.success && result.text) {
        setValue(prev => prev ? prev + " " + result.text : result.text);
        toast.success('Voice transcribed!');
      } else {
        toast.error('Transcription failed');
      }
    } catch (err) {
      console.error("Transcription error:", err);
      toast.error('Could not transcribe audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await onImageUpload?.(file);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const getPlaceholder = () => {
    if (language === 'kn') return 'ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ...';
    
    const placeholders = {
      agriculture: "Ask about your crops, diseases, soil...",
      medical: "Describe your symptoms or health question...",
      education: "Ask any subject question or concept...",
      all: "Ask about farming, health, or education..."
    };
    return placeholders[activeTopic] || placeholders.all;
  };

  return (
    <div style={{ padding: '12px 16px', borderTop: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
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
            }}
          >
            <i className={`ti ${p.icon}`} style={{ fontSize: 11 }} />
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: 'var(--color-background-secondary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 14, padding: '8px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <textarea
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={handleKey}
              placeholder={getPlaceholder()}
              rows={1}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                resize: 'none', fontSize: 13, fontFamily: 'Sora, sans-serif',
                color: 'var(--color-text-primary)', lineHeight: 1.5,
                maxHeight: 120, minHeight: 24, overflowY: 'auto',
              }}
            />
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ color: 'var(--color-text-tertiary)', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <AnimatePresence mode="wait">
            {recording ? (
              <motion.button
                key="stop"
                initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                onClick={stopRecording}
                style={{
                  width: 48, height: 48, borderRadius: '50%', background: '#E53E3E',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(229,62,62,0.3)',
                }}
              >
                <MicOff size={20} color="#fff" />
              </motion.button>
            ) : (
              <motion.button
                key="mic"
                initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                onClick={startRecording}
                disabled={isProcessing}
                style={{
                  width: 48, height: 48, borderRadius: '50%', background: '#1D9E75',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(29,158,117,0.25)',
                }}
              >
                {isProcessing ? <Loader2 size={22} color="#fff" className="animate-spin" /> : <Mic size={22} color="#fff" />}
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
            }}
          >
            <Send size={22} color={value.trim() ? '#fff' : 'var(--color-text-tertiary)'} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
