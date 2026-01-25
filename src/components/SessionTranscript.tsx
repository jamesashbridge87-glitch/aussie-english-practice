import { useRef, useEffect, useState, useCallback } from 'react';
import { useToastHelpers } from './ui';
import './SessionTranscript.css';

export interface TranscriptMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface SessionTranscriptProps {
  messages: TranscriptMessage[];
  agentName: string;
  userName?: string;
  isSpeaking?: boolean;
  isListening?: boolean;
  isConnected?: boolean;
  highlightSlang?: boolean;
  onCopyTranscript?: () => void;
}

// Common Aussie slang terms to highlight
const AUSSIE_SLANG: Record<string, string> = {
  "g'day": "Hello/Good day",
  "mate": "Friend/Buddy",
  "no worries": "No problem/You're welcome",
  "arvo": "Afternoon",
  "brekkie": "Breakfast",
  "cuppa": "Cup of tea/coffee",
  "reckon": "Think/Believe",
  "heaps": "A lot/Many",
  "keen": "Eager/Interested",
  "suss": "Suspicious/To figure out",
  "stoked": "Very happy/Excited",
  "legend": "Great person",
  "ripper": "Excellent/Great",
  "fair dinkum": "Genuine/Really true",
  "chuck": "Throw/Put",
  "yarn": "Chat/Conversation",
  "bloody": "Very (intensifier)",
  "crikey": "Expression of surprise",
  "cheers": "Thanks/Goodbye",
  "ta": "Thank you",
  "servo": "Service/Gas station",
  "bottle-o": "Liquor store",
  "tradie": "Tradesperson",
  "bogan": "Unsophisticated person",
  "bloke": "Man/Guy",
  "sheila": "Woman",
  "chook": "Chicken",
  "barbie": "Barbecue",
  "snag": "Sausage",
  "esky": "Cooler/Ice box",
  "thongs": "Flip-flops",
  "ute": "Utility vehicle/Pickup truck",
  "bonnet": "Car hood",
  "boot": "Car trunk",
  "flat out": "Very busy",
  "knock off": "Finish work",
  "sickie": "Sick day (often faked)",
  "smoko": "Coffee/Smoke break",
};

// Create regex pattern for slang detection
const slangPattern = new RegExp(
  `\\b(${Object.keys(AUSSIE_SLANG).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'gi'
);

function highlightSlangInText(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  const regex = new RegExp(slangPattern.source, 'gi');

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the highlighted slang
    const slangTerm = match[0].toLowerCase();
    const definition = AUSSIE_SLANG[slangTerm] || AUSSIE_SLANG[slangTerm.replace("'", "'")];

    parts.push(
      <span
        key={`${match.index}-${match[0]}`}
        className="slang-highlight"
        title={definition}
        data-slang={match[0]}
      >
        {match[0]}
      </span>
    );

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
    </div>
  );
}

export function SessionTranscript({
  messages,
  agentName,
  userName = 'You',
  isSpeaking = false,
  isListening = false,
  isConnected = true,
  highlightSlang = true,
  onCopyTranscript,
}: SessionTranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const toast = useToastHelpers();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Detect if user has scrolled up
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isNearBottom);
  }, []);

  const copyMessage = async (message: TranscriptMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      toast.success('Copied!', 'Message copied to clipboard');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      toast.error('Failed to copy', 'Could not copy to clipboard');
    }
  };

  const copyFullTranscript = async () => {
    const transcriptText = messages
      .map((m) => `[${formatTime(m.timestamp)}] ${m.role === 'user' ? userName : agentName}: ${m.content}`)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(transcriptText);
      toast.success('Transcript copied!', 'Full conversation copied to clipboard');
      onCopyTranscript?.();
    } catch {
      toast.error('Failed to copy', 'Could not copy transcript');
    }
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setAutoScroll(true);
    }
  };

  return (
    <div className={`session-transcript ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="transcript-header">
        <div className="transcript-title">
          <svg className="transcript-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Conversation</span>
          <span className="message-count">{messages.length} messages</span>
        </div>
        <div className="transcript-actions">
          {messages.length > 0 && (
            <button
              className="transcript-action-btn"
              onClick={copyFullTranscript}
              title="Copy full transcript"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          )}
          <button
            className="transcript-action-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div
            className="transcript-messages"
            ref={containerRef}
            onScroll={handleScroll}
          >
            {messages.length === 0 ? (
              <div className="transcript-empty">
                <div className="empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </div>
                <p className="empty-text">Start speaking to begin the conversation</p>
                <p className="empty-hint">Your conversation will appear here in real-time</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`transcript-message ${message.role}`}
                  >
                    <div className="message-header">
                      <span className="message-sender">
                        {message.role === 'user' ? userName : agentName}
                      </span>
                      <span className="message-time">{formatTime(message.timestamp)}</span>
                    </div>
                    <div className="message-body">
                      {message.isTyping ? (
                        <TypingIndicator />
                      ) : (
                        <p className="message-text">
                          {highlightSlang
                            ? highlightSlangInText(message.content)
                            : message.content}
                        </p>
                      )}
                    </div>
                    {!message.isTyping && (
                      <button
                        className={`message-copy-btn ${copiedMessageId === message.id ? 'copied' : ''}`}
                        onClick={() => copyMessage(message)}
                        title="Copy message"
                      >
                        {copiedMessageId === message.id ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                ))}

                {/* Show typing indicator when agent is speaking */}
                {isSpeaking && (
                  <div className="transcript-message agent typing">
                    <div className="message-header">
                      <span className="message-sender">{agentName}</span>
                    </div>
                    <div className="message-body">
                      <TypingIndicator />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status footer */}
          <div className="transcript-footer">
            <div className="transcript-status">
              {!isConnected ? (
                <span className="status-disconnected">
                  <span className="status-dot disconnected"></span>
                  Disconnected
                </span>
              ) : isSpeaking ? (
                <span className="status-speaking">
                  <span className="status-dot speaking"></span>
                  {agentName} is speaking...
                </span>
              ) : isListening ? (
                <span className="status-listening">
                  <span className="status-dot listening"></span>
                  Listening to you...
                </span>
              ) : (
                <span className="status-ready">
                  <span className="status-dot ready"></span>
                  Ready
                </span>
              )}
            </div>

            {!autoScroll && messages.length > 0 && (
              <button className="scroll-to-bottom-btn" onClick={scrollToBottom}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                New messages
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default SessionTranscript;
