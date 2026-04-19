import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTeachers, getConversations, getMessages, sendMessage } from '../../utils/api';
import { format } from 'date-fns';
import { Send, MessageSquare, Search, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentMessages() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showTeachers, setShowTeachers] = useState(false);
  const messagesEnd = useRef();

  useEffect(() => {
    getTeachers().then(r => setTeachers(r.data));
    getConversations().then(r => setConversations(r.data));
  }, []);

  useEffect(() => {
    if (selected) {
      getMessages(selected._id).then(r => setMessages(r.data));
    }
  }, [selected]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !selected) return;
    setSending(true);
    try {
      const res = await sendMessage({ receiverId: selected._id, content: newMsg, subject: 'Student Query' });
      setMessages(prev => [...prev, res.data]);
      setNewMsg('');
      getConversations().then(r => setConversations(r.data));
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const startChat = (teacher) => {
    setSelected(teacher);
    setShowTeachers(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">Ask your teachers for help</p>
      </div>

      <div style={styles.container}>
        {/* Left: Conversations */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={{fontWeight:'700', fontSize:'15px'}}>Conversations</span>
            <button style={styles.newBtn} onClick={() => setShowTeachers(!showTeachers)}>
              <Plus size={16} /> New
            </button>
          </div>

          {showTeachers && (
            <div style={styles.teacherList}>
              <div style={{padding:'8px', fontSize:'12px', fontWeight:'700', color:'#A0AEC0', textTransform:'uppercase'}}>Select Teacher</div>
              {teachers.map(t => (
                <button key={t._id} style={styles.teacherItem} onClick={() => startChat(t)}>
                  <div style={{...styles.avatar, background:'#B5EAD7'}}>{t.name[0]}</div>
                  <div>
                    <div style={{fontWeight:'600', fontSize:'13px'}}>{t.name}</div>
                    <div style={{fontSize:'12px', color:'#A0AEC0'}}>{t.department}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {conversations.length === 0 && !showTeachers && (
            <div style={{padding:'20px', textAlign:'center', color:'#A0AEC0', fontSize:'13px'}}>
              Start a conversation with a teacher
            </div>
          )}

          {conversations.map(conv => (
            <button key={conv.user._id} style={{...styles.convItem, background: selected?._id === conv.user._id ? '#F0F4FF' : 'transparent'}}
              onClick={() => setSelected(conv.user)}>
              <div style={{...styles.avatar, background:'#B5EAD7'}}>{conv.user.name[0]}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontWeight:'600', fontSize:'13px'}}>{conv.user.name}</span>
                  {conv.unreadCount > 0 && <span style={styles.unread}>{conv.unreadCount}</span>}
                </div>
                <div style={{fontSize:'12px', color:'#A0AEC0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                  {conv.lastMessage?.content}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right: Chat */}
        <div style={styles.chatArea}>
          {!selected ? (
            <div style={styles.noChat}>
              <MessageSquare size={48} color="#CBD5E0" />
              <h3 style={{color:'#718096', marginTop:'16px'}}>Select a conversation</h3>
              <p style={{color:'#A0AEC0', fontSize:'14px'}}>Or start a new one with a teacher</p>
            </div>
          ) : (
            <>
              <div style={styles.chatHeader}>
                <div style={{...styles.avatar, background:'#B5EAD7', width:'36px', height:'36px'}}>{selected.name[0]}</div>
                <div>
                  <div style={{fontWeight:'700'}}>{selected.name}</div>
                  <div style={{fontSize:'12px', color:'#A0AEC0'}}>{selected.department} · Teacher</div>
                </div>
              </div>
              <div style={styles.messages}>
                {messages.map((msg, i) => {
                  const isMe = msg.sender?._id === user._id || msg.sender === user._id;
                  return (
                    <div key={i} style={{...styles.msgWrap, justifyContent: isMe ? 'flex-end' : 'flex-start'}}>
                      <div style={{...styles.msgBubble, background: isMe ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'white', color: isMe ? 'white' : '#2D3748', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px'}}>
                        <p style={{margin:0, fontSize:'14px'}}>{msg.content}</p>
                        <span style={{fontSize:'11px', opacity:0.7, display:'block', marginTop:'4px', textAlign:'right'}}>
                          {format(new Date(msg.createdAt), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEnd} />
              </div>
              <form onSubmit={handleSend} style={styles.inputArea}>
                <input style={styles.msgInput} placeholder="Type your question..." value={newMsg}
                  onChange={e => setNewMsg(e.target.value)} />
                <button type="submit" style={styles.sendBtn} disabled={sending || !newMsg.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display:'flex', height:'calc(100vh - 200px)', background:'white', borderRadius:'16px', border:'1px solid #EDF2F7', overflow:'hidden' },
  sidebar: { width:'280px', borderRight:'1px solid #EDF2F7', display:'flex', flexDirection:'column', flexShrink:0 },
  sidebarHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', borderBottom:'1px solid #EDF2F7' },
  newBtn: { display:'flex', alignItems:'center', gap:'4px', background:'linear-gradient(135deg, #667eea, #764ba2)', color:'white', border:'none', padding:'6px 12px', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' },
  teacherList: { borderBottom:'1px solid #EDF2F7', maxHeight:'200px', overflowY:'auto' },
  teacherItem: { display:'flex', alignItems:'center', gap:'10px', padding:'10px 16px', width:'100%', border:'none', background:'none', cursor:'pointer', textAlign:'left', transition:'background 0.2s' },
  convItem: { display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', width:'100%', border:'none', cursor:'pointer', textAlign:'left', transition:'background 0.2s', borderBottom:'1px solid #EDF2F7' },
  avatar: { width:'36px', height:'36px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'14px', color:'#2D3748', flexShrink:0 },
  unread: { background:'#667eea', color:'white', borderRadius:'10px', fontSize:'11px', fontWeight:'700', padding:'2px 6px' },
  chatArea: { flex:1, display:'flex', flexDirection:'column' },
  noChat: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' },
  chatHeader: { display:'flex', alignItems:'center', gap:'12px', padding:'16px 20px', borderBottom:'1px solid #EDF2F7' },
  messages: { flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'12px' },
  msgWrap: { display:'flex' },
  msgBubble: { maxWidth:'70%', padding:'12px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' },
  inputArea: { display:'flex', gap:'10px', padding:'16px 20px', borderTop:'1px solid #EDF2F7' },
  msgInput: { flex:1, padding:'12px 16px', borderRadius:'12px', border:'2px solid #EDF2F7', fontSize:'14px', fontFamily:'Plus Jakarta Sans, sans-serif' },
  sendBtn: { width:'44px', height:'44px', background:'linear-gradient(135deg, #667eea, #764ba2)', color:'white', border:'none', borderRadius:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
};
