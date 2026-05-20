import { createContext, useContext, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { sendChatMessage } from '../services/groqService';

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
      [activeTopic]: [...(prev[activeTopic] || []), userMsg],
      ...(activeTopic !== 'all' ? { all: [...(prev.all || []), userMsg] } : {})
    }));

    setIsTyping(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const res = await sendChatMessage(content, activeTopic, language, history);

      if (!res.success) {
        throw new Error(res.error || 'Failed to send message');
      }

      const response = res.response;
      const agent = activeTopic;

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        agent,
        confidence: 1.0,
        sources: [],
        timestamp: new Date().toISOString(),
      };

      setHistories(prev => {
        const next = { ...prev };
        next[agent] = [...(next[agent] || []), aiMsg];
        if (agent !== 'all') {
          next.all = [...(next.all || []), aiMsg];
        }
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
        all: [...(prev.all || []), aiMsg],
        [activeTopic]: [...(prev[activeTopic] || []), aiMsg]
      }));
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, language, activeTopic, messages]);

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
