import { createContext, useContext, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [histories, setHistories] = useState({
    all: [],
    agriculture: [],
    medical: [],
    education: [],
  });
  const [activeTopic, setActiveTopic] = useState('all');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [language, setLanguage] = useState('en');
  const abortRef = useRef(null);

  const messages = histories[activeTopic] || [];

  const sendMessage = useCallback(async (content, mode = 'text') => {
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      mode,
    };
    
    // Add to both 'all' and the specific topic history
    setHistories(prev => ({
      ...prev,
      [activeTopic]: [...prev[activeTopic], userMsg],
      ...(activeTopic !== 'all' ? { all: [...prev.all, userMsg] } : {})
    }));

    setIsTyping(true);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await api.post('/api/chat/message', {
        message: content,
        session_id: sessionId,
        language,
        topic: activeTopic === 'all' ? null : activeTopic,
      }, { signal: controller.signal });

      const { response, agent, confidence, sources } = res.data;

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        agent,
        confidence,
        sources,
        timestamp: new Date().toISOString(),
      };

      setHistories(prev => {
        const next = { ...prev };
        // Add to specific agent history
        if (agent && next[agent]) {
          next[agent] = [...next[agent], aiMsg];
        }
        // Always add to 'all' history
        next.all = [...next.all, aiMsg];
        
        // If we are in 'all' view, the UI already gets 'next.all' via messages ref
        return next;
      });
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      const fallback = getOfflineFallback(content);
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: fallback.response,
        agent: fallback.agent,
        offline: true,
        timestamp: new Date().toISOString(),
      };
      setHistories(prev => ({
        ...prev,
        all: [...prev.all, aiMsg],
        [fallback.agent]: [...prev[fallback.agent], aiMsg]
      }));
      toast('Offline mode — limited responses available', { icon: '📶' });
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, language, activeTopic]);

  const clearMessages = useCallback(() => {
    setHistories(prev => ({ ...prev, [activeTopic]: [] }));
  }, [activeTopic]);

  return (
    <ChatContext.Provider value={{
      messages, histories, activeTopic, setActiveTopic,
      isTyping, sessionId, language, setLanguage, 
      sendMessage, clearMessages,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

function getOfflineFallback(query) {
  const q = query.toLowerCase();
  if (q.includes('crop') || q.includes('plant') || q.includes('farm') || q.includes('leaf')) {
    return {
      agent: 'agriculture',
      response: '🌾 [Offline Mode] For crop issues, ensure proper watering and check for pests. Upload a crop image when connected for AI disease detection.',
    };
  }
  if (q.includes('fever') || q.includes('pain') || q.includes('sick') || q.includes('symptom')) {
    return {
      agent: 'medical',
      response: '⚠️ [Offline Mode] For medical concerns, please consult a qualified doctor. In emergency, call 108. Stay hydrated and rest.',
    };
  }
  return {
    agent: 'education',
    response: '📚 [Offline Mode] I can help you learn! Try asking me about science, math, or history when the connection is restored.',
  };
}

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
