import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChat } from '../contexts/ChatContext';
import toast from 'react-hot-toast';
import FormattedResponse from '../components/FormattedResponse';

export default function Voice() {
  const [recording, setRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [error, setError] = useState(null);
  const { language } = useChat();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const responseEndRef = useRef(null);

  useEffect(() => {
    if (responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcribedText, aiResponse]);

  const startRecording = async () => {
    try {
      setTranscribedText("");
      setAiResponse("");
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        if (audioBlob.size < 1000) {
          setError("Recording too short. Please speak for at least 2 seconds.");
          return;
        }

        await handleTranscription(audioBlob, mimeType);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      if (err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow microphone in browser settings.");
      } else {
        setError("Could not start recording: " + err.message);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleTranscription = async (audioBlob, mimeType) => {
    try {
      setIsProcessing(true);
      setError("");

      const token = localStorage.getItem('gram_token');
      const extension = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
      
      const formData = new FormData();
      formData.append("file", audioBlob, `recording.${extension}`);

      const transcribeRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/audio/transcribe`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        body: formData
      });

      if (!transcribeRes.ok) {
        throw new Error(`Transcription HTTP error: ${transcribeRes.status}`);
      }

      const transcribeData = await transcribeRes.json();
      if (!transcribeData.success || !transcribeData.text) {
        setError("Could not understand audio. Please speak clearly.");
        return;
      }

      const spokenText = transcribeData.text.trim();
      setTranscribedText(spokenText);

      // Get AI response
      const aiRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: spokenText,
          session_id: `voice_session_${Date.now()}`,
          language: language || "en",
          topic: "agriculture"
        })
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        throw new Error(`AI HTTP ${aiRes.status}: ${errText}`);
      }

      const aiData = await aiRes.json();
      if (aiData.response) {
        setAiResponse(aiData.response);
      } else {
        setError("AI did not return a response. Please try again.");
      }

    } catch (err) {
      console.error("[VOICE] Full error:", err);
      setError("Voice processing failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, height: '100%', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', marginBottom: 30, flexShrink: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Voice Assistant</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
          Stand-alone voice section. Auto-scrolling enabled.
        </p>
      </div>

      <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 20 }}>
        {recording && (
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#1D9E75' }}
          />
        )}
        
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={isProcessing}
          style={{
            width: 80, height: 80, borderRadius: '50%', border: 'none',
            background: recording ? '#EF4444' : '#1D9E75',
            color: '#fff', fontSize: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)', zIndex: 2
          }}
        >
          {isProcessing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <i className="ti ti-loader-2" />
            </motion.div>
          ) : (
            <i className={`ti ti-mic${recording ? '-filled' : ''}`} />
          )}
        </button>
      </div>

      <div style={{ marginBottom: 20, textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: recording ? '#EF4444' : 'var(--color-text-tertiary)' }}>
          {recording ? 'Recording... Tap to stop' : isProcessing ? 'Processing...' : 'Tap to Start'}
        </div>
        {error && <div style={{ marginTop: 8, color: '#EF4444', fontSize: 12 }}>⚠️ {error}</div>}
      </div>

      <div 
        className="voice-scroll-area"
        style={{ 
          width: '100%', 
          maxWidth: 500, 
          flex: 1,
          overflowY: 'auto',
          display: 'flex', 
          flexDirection: 'column', 
          gap: 16,
          padding: '10px 16px',
          background: 'rgba(0,0,0,0.02)',
          borderRadius: 16,
          border: '1px solid var(--color-border-tertiary)',
          scrollbarWidth: 'thin',
          scrollbarColor: '#1D9E75 transparent'
        }}
      >
        <style>{`
          .voice-scroll-area::-webkit-scrollbar { width: 4px; }
          .voice-scroll-area::-webkit-scrollbar-track { background: transparent; }
          .voice-scroll-area::-webkit-scrollbar-thumb { background: #1D9E75; border-radius: 4px; }
          .voice-scroll-area::-webkit-scrollbar-thumb:hover { background: #178F68; }
        `}</style>

        {transcribedText && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 14, background: 'var(--color-background-secondary)', borderRadius: 12, border: '1px solid var(--color-border-tertiary)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', marginBottom: 4, textTransform: 'uppercase' }}>You said:</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{transcribedText}</div>
          </motion.div>
        )}
        
        {aiResponse && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 14, background: '#E1F5EE', borderRadius: 12, border: '1px solid #9FE1CB' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1D9E75', marginBottom: 4, textTransform: 'uppercase' }}>Gram AI Response:</div>
            <FormattedResponse text={aiResponse} />
          </motion.div>
        )}
        
        <div ref={responseEndRef} />
      </div>
    </div>
  );
}
