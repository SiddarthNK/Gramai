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

      if (res.data.error) {
        throw new Error(res.data.error);
      }

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
        if (agent && next[agent]) {
          next[agent] = [...next[agent], aiMsg];
        }
        next.all = [...next.all, aiMsg];
        return next;
      });
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      
      console.error("AI Error:", err);
      toast.error('Something went wrong. Please try again.');
      
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again later.",
        agent: 'system',
        error: true,
        timestamp: new Date().toISOString(),
      };
      
      setHistories(prev => ({
        ...prev,
        all: [...prev.all, aiMsg],
        [activeTopic]: [...prev[activeTopic], aiMsg]
      }));
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

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
