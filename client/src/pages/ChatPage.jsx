import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/chat/history').then(d => { setMessages(d.messages); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg, created_at: new Date().toISOString() }]);
    setSending(true);
    try {
      const data = await api.post('/chat', { message: msg });
      setMessages(prev => [...prev, { role: 'assistant', content: data.message, created_at: new Date().toISOString() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again. 💙', created_at: new Date().toISOString() }]);
    }
    setSending(false);
  };

  const clearChat = async () => {
    try { await api.delete('/chat/clear'); setMessages([]); } catch {}
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const suggestions = ['I\'m feeling anxious', 'I need help sleeping', 'I feel overwhelmed', 'Tell me a breathing exercise'];

  return (
    <div className="page chat-page">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar">🧠</div>
            <div>
              <h2>MindCare AI</h2>
              <span className="chat-status"><span className="status-dot" /> Online</span>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={clearChat}>Clear Chat</button>
        </div>

        <div className="chat-messages">
          {!loaded ? (
            <div className="empty-state"><div className="spinner" /></div>
          ) : messages.length === 0 ? (
            <div className="message ai-message fade-in">
              <div className="message-avatar">🧠</div>
              <div className="message-bubble">
                <p>Hello! I'm MindCare AI, your mental health support companion. 💙</p>
                <p>I'm here to listen and support your well-being. How are you feeling today?</p>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`message ${m.role === 'user' ? 'user-message' : 'ai-message'} fade-in`}>
                <div className="message-avatar">{m.role === 'user' ? '👤' : '🧠'}</div>
                <div className="message-bubble">
                  <div
                    className="message-text"
                    dangerouslySetInnerHTML={{
                      __html: (m.content || '')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br />')
                    }}
                  />
                  <span className="message-time">{formatTime(m.created_at)}</span>
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="message ai-message fade-in">
              <div className="message-avatar">🧠</div>
              <div className="message-bubble"><div className="typing-indicator"><span /><span /><span /></div></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length === 0 && (
          <div className="chat-suggestions">
            {suggestions.map((s, i) => (
              <button key={i} className="suggestion-chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}

        <div className="chat-input-area">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type your message…"
            rows={1}
          />
          <button className="btn btn-primary btn-send" onClick={() => send()} disabled={!input.trim() || sending}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
