// TeacherMessages.js - same as StudentMessages but teacher perspective
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getConversations, getMessages, sendMessage } from '../../utils/api';
import { format } from 'date-fns';
import { Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherMessages() {
  const { user, socket } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef();

  useEffect(() => {
    getConversations().then(r => setConversations(r.data));
  }, []);

  useEffect(() => {
    if (selected) getMessages(selected._id).then(r => setMessages(r.data));
  }, [selected]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!socket) return;
    socket.on('receive_message', (msg) => {
      if (selected && (msg.sender?._id === selected._id || msg.sender === selected._id)) {
        setMessages(prev => [...prev, msg]);
      }
      getConversations().then(r => setConversations(r.data));
    });
    return () => socket.off('receive_message');
  }, [socket, selected]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !selected) return;
    setSending(true);
    try {
      const res = await sendMessage({ receiverId: selected._id, content: newMsg });
      setMessages(prev => [...prev, res.data]);
      setNewMsg('');
      getConversations().then(r => setConversations(r.data));
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const s = {
    container: { display: 'flex', height: 'calc(100vh - 200px)', background: 'white', borderRadius: '16px', border: '1px solid #EDF2F7', overflow: 'hidden' },
    sidebar: { width: '280px', borderRight: '1px solid #EDF2F7', overflowY: 'auto' },
    sidebarHeader: { padding: '16px', borderBottom: '1px solid #EDF2F7', fontWeight: '700', fontSize: '15px' },
    convItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #EDF2F7', background: 'transparent' },
    avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#A8D8EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 },
    chatArea: { flex: 1, display: 'flex', flexDirection: 'column' },
    noChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    chatHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #EDF2F7' },
    messages: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
    msgWrap: { display: 'flex' },
    msgBubble: { maxWidth: '70%', padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
    inputArea: { display: 'flex', gap: '10px', padding: '16px 20px', borderTop: '1px solid #EDF2F7' },
    msgInput: { flex: 1, padding: '12px 16px', borderRadius: '12px', border: '2px solid #EDF2F7', fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif' },
    sendBtn: { width: '44px', height: '44px', background: 'linear-gradient(135deg, #11998e, #38ef7d)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">Student queries & communications</p>
      </div>
      <div style={s.container}>
        <div style={s.sidebar}>
          <div style={s.sidebarHeader}>Conversations ({conversations.length})</div>
          {conversations.length === 0 && <p style={{ padding: '20px', color: '#A0AEC0', fontSize: '13px' }}>No messages yet</p>}
          {conversations.map(conv => (
            <button key={conv.user._id} style={{ ...s.convItem, background: selected?._id === conv.user._id ? '#F0FFF4' : 'transparent' }}
              onClick={() => setSelected(conv.user)}>
              <div style={s.avatar}>{conv.user.name[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600', fontSize: '13px' }}>{conv.user.name}</span>
                  {conv.unreadCount > 0 && <span style={{ background: '#48BB78', color: 'white', borderRadius: '10px', fontSize: '11px', fontWeight: '700', padding: '2px 6px' }}>{conv.unreadCount}</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#A0AEC0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMessage?.content}</div>
              </div>
            </button>
          ))}
        </div>
        <div style={s.chatArea}>
          {!selected ? (
            <div style={s.noChat}><MessageSquare size={48} color="#CBD5E0" /><h3 style={{ color: '#718096', marginTop: '16px' }}>Select a conversation</h3></div>
          ) : (
            <>
              <div style={s.chatHeader}>
                <div style={{ ...s.avatar, background: '#A8D8EA' }}>{selected.name[0]}</div>
                <div><div style={{ fontWeight: '700' }}>{selected.name}</div><div style={{ fontSize: '12px', color: '#A0AEC0' }}>Student · {selected.department}</div></div>
              </div>
              <div style={s.messages}>
                {messages.map((msg, i) => {
                  const isMe = msg.sender?._id === user._id || msg.sender === user._id;
                  return (
                    <div key={i} style={{ ...s.msgWrap, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ ...s.msgBubble, background: isMe ? 'linear-gradient(135deg, #11998e, #38ef7d)' : 'white', color: isMe ? 'white' : '#2D3748', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px' }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>{msg.content}</p>
                        <span style={{ fontSize: '11px', opacity: 0.7, display: 'block', marginTop: '4px', textAlign: 'right' }}>{format(new Date(msg.createdAt), 'h:mm a')}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEnd} />
              </div>
              <form onSubmit={handleSend} style={s.inputArea}>
                <input style={s.msgInput} placeholder="Reply to student..." value={newMsg} onChange={e => setNewMsg(e.target.value)} />
                <button type="submit" style={s.sendBtn} disabled={sending || !newMsg.trim()}><Send size={18} /></button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
