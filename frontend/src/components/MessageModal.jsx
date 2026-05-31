import { imgUrl } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import toast from 'react-hot-toast';

export default function MessageModal({ onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conv, setConv] = useState(null);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoType, setPhotoType] = useState('photo');
  const [sending, setSending] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [started, setStarted] = useState(!!user);
  const bottomRef = useRef();
  const fileRef = useRef();

  const loadChat = async () => {
    if (!user) return;
    const r = await API.get('/messages/my');
    setConv(r.data.conversation);
    setMessages(r.data.messages);
  };

  useEffect(() => { if (started) loadChat(); }, [started]);

  // Poll every 4s for new owner replies
  useEffect(() => {
    if (!started || !user) return;
    const t = setInterval(loadChat, 4000);
    return () => clearInterval(t);
  }, [started, user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim() && !photo) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append('content', text.trim());
      if (photo) { fd.append('photo', photo); fd.append('photo_type', photoType); }
      const r = await API.post('/messages/my', fd);
      setMessages(prev => [...prev, r.data]);
      setText(''); setPhoto(null);
    } catch { toast.error('Could not send message'); }
    setSending(false);
  };

  const startGuest = async () => {
    if (!guestName.trim()) { toast.error('Please enter your name'); return; }
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('content', text.trim() || 'Hello! 👋');
      fd.append('sender_name', guestName);
      fd.append('sender_email', guestEmail);
      await API.post('/messages/my', fd);
      toast.success('Message sent! We will reply soon 💕');
      onClose();
    } catch { toast.error('Could not send'); }
    setSending(false);
  };

  // Guest (not logged in) — simple form
  if (!user) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div style={{ padding: '24px 20px' }}>
            <div style={s.header}>
              <h2 style={s.title}>💌 Send Message</h2>
              <button onClick={onClose} style={s.closeBtn}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <input placeholder="Your name *" value={guestName} onChange={e => setGuestName(e.target.value)} />
              <input placeholder="Your email (optional)" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
              <textarea placeholder="Your message to Hermella 💕" value={text} onChange={e => setText(e.target.value)} style={{ minHeight: 100 }} />
              <button className="btn-primary" onClick={startGuest} disabled={sending} style={{ justifyContent: 'center' }}>
                {sending ? '⏳ Sending...' : '💌 Send Message'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-light)' }}>
                Sign in to see full chat history and get replies 💕
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in user — full chat
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480, height: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={s.chatHeader}>
          <div style={s.ownerAvatar}>H</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Hermella</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>TUBA Team Owner 👑</div>
          </div>
          <button onClick={onClose} style={{ ...s.closeBtn, marginLeft: 'auto' }}>✕</button>
        </div>

        {/* Messages */}
        <div style={s.messages}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px 20px' }}>
              <div style={{ fontSize: 40 }}>💬</div>
              <p style={{ marginTop: 12, fontSize: 14 }}>Start a conversation with Hermella!</p>
              <p style={{ fontSize: 13, marginTop: 6 }}>Ask about products, sizes, custom orders, or send your payment receipt 📄</p>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender_role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 3, padding: '0 4px' }}>
                {m.sender_role === 'user' ? 'You' : '👑 Hermella'} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {m.photo_url ? (
                <div style={{ maxWidth: '75%' }}>
                  {m.photo_type === 'receipt' && (
                    <div style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '10px 10px 0 0', fontSize: 12, fontWeight: 600 }}>
                      📄 Payment Receipt
                    </div>
                  )}
                  <img src={imgUrl(m.photo_url)} alt="shared"
                    style={{ maxWidth: '100%', borderRadius: m.photo_type === 'receipt' ? '0 0 14px 14px' : 14, display: 'block', cursor: 'pointer', boxShadow: '0 2px 8px var(--shadow)' }}
                    onClick={() => window.open(imgUrl(m.photo_url), '_blank')}
                  />
                  {m.content && <div className={m.sender_role === 'user' ? 'bubble-user' : 'bubble-owner'} style={{ marginTop: 4 }}>{m.content}</div>}
                </div>
              ) : (
                <div className={m.sender_role === 'user' ? 'bubble-user' : 'bubble-owner'}>{m.content}</div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Photo type picker */}
        {photo && (
          <div style={{ padding: '8px 16px', background: '#fef3c7', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>📎 {photo.name}</span>
            <select value={photoType} onChange={e => setPhotoType(e.target.value)} style={{ width: 'auto', padding: '4px 8px', fontSize: 13 }}>
              <option value="photo">📷 Regular Photo</option>
              <option value="receipt">📄 Payment Receipt</option>
            </select>
            <button onClick={() => setPhoto(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rose-dark)', fontWeight: 700, marginLeft: 'auto' }}>✕ Remove</button>
          </div>
        )}

        {/* Input */}
        <div style={s.inputRow}>
          <button onClick={() => fileRef.current.click()} style={s.iconBtn} title="Attach photo or receipt">📎</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => setPhoto(e.target.files[0])} />
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder="Type a message..." style={{ flex: 1, borderRadius: 50, padding: '11px 16px' }} />
          <button onClick={send} disabled={sending || (!text.trim() && !photo)} className="btn-primary"
            style={{ padding: '11px 16px', flexShrink: 0, opacity: (!text.trim() && !photo) ? 0.5 : 1 }}>
            {sending ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: 'var(--mauve)' },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-light)', padding: 4 },
  chatHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'white', borderRadius: '24px 24px 0 0', flexShrink: 0 },
  ownerAvatar: { width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-rose)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 700, flexShrink: 0 },
  messages: { flex: 1, overflowY: 'auto', padding: '16px', background: 'var(--blush)', display: 'flex', flexDirection: 'column' },
  inputRow: { display: 'flex', gap: 8, alignItems: 'center', padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'white', flexShrink: 0 },
  iconBtn: { background: 'var(--blush)', border: 'none', borderRadius: '50%', width: 42, height: 42, cursor: 'pointer', fontSize: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
