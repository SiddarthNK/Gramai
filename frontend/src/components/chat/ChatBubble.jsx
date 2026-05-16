import { motion } from 'framer-motion';
import { getAgentColor, getAgentIcon, getAgentLabel, formatTime } from '../../utils/helpers';
import FormattedResponse from '../FormattedResponse';

export function ChatBubble({ message, index }) {
  const isUser = message.role === 'user';
  const colors = getAgentColor(message.agent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {/* Agent tag */}
      {!isUser && message.agent && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, padding: '2px 7px', borderRadius: 4,
          marginBottom: 4, fontFamily: 'JetBrains Mono, monospace',
          background: colors.bg, color: colors.text,
        }}>
          <i className={`ti ${getAgentIcon(message.agent)}`} style={{ fontSize: 10 }} />
          {getAgentLabel(message.agent)}
          {message.confidence && (
            <span style={{ opacity: 0.7 }}>· {Math.round(message.confidence * 100)}%</span>
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={isUser ? 'bubble-user' : 'bubble-ai'}>
        {!isUser ? (
          <FormattedResponse text={message.content} />
        ) : (
          <p style={{
            fontSize: "14px",
            lineHeight: "1.7",
            color: "#ffffff",
            margin: "0"
          }}>
            {message.content}
          </p>
        )}
      </div>

      {/* Meta */}
      <div style={{
        fontSize: 10, color: 'var(--color-text-tertiary)',
        marginTop: 3, fontFamily: 'JetBrains Mono, monospace',
        textAlign: isUser ? 'right' : 'left',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {formatTime(message.timestamp)}
        {message.offline && <span>· 📶 offline</span>}
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}
    >
      <div className="bubble-ai" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px' }}>
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </motion.div>
  );
}
