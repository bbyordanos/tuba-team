import { imgUrl } from '../config';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api';
import toast from 'react-hot-toast';

export default function MessagesPage() {
  const [convs, setConvs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [showConvList, setShowConvList] = useState(true);
  const bottomRef = useRef();
  const fileRef = useRef();

  const fetchConvs = useCallback(async () => {
    const r = await API.get('/messages');
    setConvs(r.data);
  }, []);

  useEffect(() => { fetchConvs(); }, [fetchConvs]);

  const openConv = async (conv) => {
    setSelected(conv);
    setShowConvList(false);
    const r = await API.get(`/messages/${conv.id}`);
    setMessages(r.data.messages);
    setConvs(prev => prev.map(c => c.id === conv.id ? { ...c, unread_owner: 0 } : c));
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 4 seconds
  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(async () => {
      const r = await API.get(`/messages/${selected.id}`);
      setMessages(r.data.messages);
    }, 4000);
    return () => clearInterval(interval);
  }, [selected]);

  const sendReply = async () => {
    if (!text.trim() && !photo) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append('content', text.trim());
      if (photo) fd.append('photo', photo);
      const r = await API.post(`/messages/${selected.id}/reply`, fd);
      setMessages(prev => [...prev, r.data]);
      setText('');
      setPhoto(null);
      fetchConvs();
    } catch { toast.error('Could not send'); }
    setSending(false);
  };

  const totalUnread = convs.reduce((s, c) => s + (c.unread_owner || 0), 0);

  return (
    <div style={s.page}>
      {/* Conversation list — hidden on mobile when chat open */}
      <div style={{ ...s.sidebar, display: showConvList ? 'flex' : 'none' }}>
        <div style={s.sidebarHeader}>
          <h2 style={s.title}>💬 Inbox</h2>
          {totalUnread > 0 && <span style={s.unreadBadge}>{totalUnread} new</span>}
        </div>
        {convs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-light)' }}>
            <div style={{ fontSize: 40 }}>💌</div>
            <p style={{ marginTop: 12 }}>No conversations yet</p>
          </div>
        ) : convs.map(c => (
          <div key={c.id} onClick={() => openConv(c)} style={{
            ...s.convRow,
            background: selected?.id === c.id ? 'var(--blush)' : 'white',
            borderLeft: c.unread_owner > 0 ? '4px solid var(--rose)' : '4px solid transparent',
          }}>
            <div style={s.convAvatar}>{(c.user_name||'?')[0].toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: c.unread_owner > 0 ? 700 : 500, fontSize: 14, color: 'var(--text)' }}>
                  {c.user_name || 'Guest'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-light)' }}>
                  {c.last_at ? new Date(c.last_at).toLocaleDateString() : ''}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginTop: 2 }}>
                {c.last_message || 'No messages yet'}
              </div>
            </div>
            {c.unread_owner > 0 && <span style={s.unreadDot}>{c.unread_owner}</span>}
          </div>
        ))}
      </div>

      {/* Chat panel */}
      <div style={{ ...s.chatPanel, display: !showConvList || window.innerWidth >= 768 ? 'flex' : 'none' }}>
        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-light)', padding: 40 }}>
            <div style={{ fontSize: 60 }}>💌</div>
            <p style={{ marginTop: 16, fontSize: 16 }}>Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={s.chatHeader}>
              <button onClick={() => { setShowConvList(true); setSelected(null); }} style={s.backBtn}>←</button>
              <div style={s.convAvatar}>{(selected.user_name||'?')[0].toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{selected.user_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{selected.user_email}</div>
              </div>
            </div>

            {/* Messages */}
            <div style={s.messages}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: 40 }}>No messages yet 🌸</div>
              )}
              {messages.map(m => (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender_role === 'owner' ? 'flex-start' : 'flex-end', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 4, paddingLeft: 4, paddingRight: 4 }}>
                    {m.sender_role === 'owner' ? '👑 You' : '👤 Customer'} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {m.photo_url ? (
                    <div style={{ maxWidth: '75%' }}>
                      {m.photo_type === 'receipt' && (
                        <div style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '10px 10px 0 0', fontSize: 12, fontWeight: 600 }}>
                          📄 Payment Receipt
                        </div>
                      )}
                      <img src={imgUrl(m.photo_url)} alt="shared"
                        style={{ maxWidth: '100%', borderRadius: m.photo_type === 'receipt' ? '0 0 14px 14px' : 14, display: 'block', boxShadow: '0 2px 8px var(--shadow)', cursor: 'pointer' }}
                        onClick={() => window.open(imgUrl(m.photo_url), '_blank')}
                      />
                      {m.content && <div className={m.sender_role === 'owner' ? 'bubble-owner' : 'bubble-user'} style={{ marginTop: 4 }}>{m.content}</div>}
                    </div>
                  ) : (
                    <div className={m.sender_role === 'owner' ? 'bubble-owner' : 'bubble-user'}>
                      {m.content}
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={s.inputArea}>
              {photo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--blush)', borderRadius: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--mauve)' }}>📎 {photo.name}</span>
                  <button onClick={() => setPhoto(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rose-dark)', fontWeight: 700 }}>✕</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <button onClick={() => fileRef.current.click()} style={s.iconBtn} title="Send photo">📷</button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => setPhoto(e.target.files[0])} />
                <textarea value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Type a reply..." rows={1}
                  style={{ flex: 1, resize: 'none', borderRadius: 20, padding: '11px 16px', minHeight: 44, maxHeight: 120 }} />
                <button onClick={sendReply} disabled={sending || (!text.trim() && !photo)} className="btn-primary"
                  style={{ padding: '11px 18px', flexShrink: 0, opacity: (!text.trim() && !photo) ? 0.5 : 1 }}>
                  {sending ? '⏳' : '➤'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden', maxWidth: 1100, margin: '0 auto' },
  sidebar: { width: 300, borderRight: '1px solid var(--border)', background: 'white', overflowY: 'auto', flexDirection: 'column', flexShrink: 0, '@media(max-width:767px)': { width: '100%' } },
  sidebarHeader: { padding: '20px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: 'var(--mauve)' },
  unreadBadge: { background: 'var(--gradient-rose)', color: 'white', padding: '3px 10px', borderRadius: 50, fontSize: 12, fontWeight: 700 },
  convRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' },
  convAvatar: { width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-rose)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond,serif', fontSize: 18, fontWeight: 700, flexShrink: 0 },
  unreadDot: { background: 'var(--rose)', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 },
  chatPanel: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  chatHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'white' },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--mauve)', padding: '4px 8px', borderRadius: 8 },
  messages: { flex: 1, overflowY: 'auto', padding: '16px', background: 'var(--blush)', display: 'flex', flexDirection: 'column' },
  inputArea: { padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'white' },
  iconBtn: { background: 'var(--blush)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', fontSize: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
