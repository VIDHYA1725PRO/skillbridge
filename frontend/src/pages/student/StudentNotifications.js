import React, { useState, useEffect } from 'react';
import { getNotifications, markAllRead, markRead } from '../../utils/api';
import { format } from 'date-fns';
import { Bell, CheckCheck, Trash2, BookOpen, ClipboardList, Brain, Star, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications().then(r => { setNotifications(r.data); setLoading(false); });
  }, []);

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications(notifications.map(n => ({...n, isRead: true})));
    toast.success('All marked as read');
  };

  const handleMarkRead = async (id) => {
    await markRead(id);
    setNotifications(notifications.map(n => n._id === id ? {...n, isRead: true} : n));
  };

  const icons = { assignment: <ClipboardList size={18} color="#667eea" />, quiz: <Brain size={18} color="#9B59B6" />, grade: <Star size={18} color="#ED8936" />, course: <BookOpen size={18} color="#48BB78" />, announcement: <Megaphone size={18} color="#FC8181" />, system: <Bell size={18} color="#718096" /> };
  const colors = { assignment: '#EBF4FF', quiz: '#F3E8FF', grade: '#FFFBEB', course: '#F0FFF4', announcement: '#FFF5F5', system: '#F7FAFC' };

  const unread = notifications.filter(n => !n.isRead).length;

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread} unread notifications</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state"><Bell size={48} /><h3>No notifications yet</h3><p>You'll see updates here</p></div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
          {notifications.map(n => (
            <div key={n._id} style={{...styles.notif, background: n.isRead ? 'white' : (colors[n.type] || '#F7FAFC'), borderLeft: n.isRead ? '3px solid #EDF2F7' : '3px solid #667eea'}}
              onClick={() => !n.isRead && handleMarkRead(n._id)}>
              <div style={styles.notifIcon}>{icons[n.type] || <Bell size={18} />}</div>
              <div style={{flex:1}}>
                <div style={styles.notifTitle}>{n.title}</div>
                <div style={styles.notifMsg}>{n.message}</div>
                <div style={styles.notifTime}>{format(new Date(n.createdAt), 'MMM d, h:mm a')}</div>
              </div>
              {!n.isRead && <div style={styles.unreadDot} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  notif: { display:'flex', alignItems:'flex-start', gap:'14px', padding:'16px 20px', borderRadius:'12px', border:'1px solid #EDF2F7', cursor:'pointer', transition:'all 0.2s' },
  notifIcon: { width:'36px', height:'36px', borderRadius:'10px', background:'#F8FAFF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  notifTitle: { fontWeight:'700', fontSize:'14px', marginBottom:'3px' },
  notifMsg: { fontSize:'13px', color:'#718096' },
  notifTime: { fontSize:'12px', color:'#A0AEC0', marginTop:'4px' },
  unreadDot: { width:'8px', height:'8px', borderRadius:'50%', background:'#667eea', flexShrink:0, marginTop:'6px' },
};
