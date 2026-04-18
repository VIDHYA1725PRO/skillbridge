// TeacherNotifications.js
import React, { useState, useEffect } from 'react';
import { getNotifications, markAllRead, markRead } from '../../utils/api';
import { format } from 'date-fns';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export function TeacherNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications().then(r => { setNotifications(r.data); setLoading(false); });
  }, []);

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    toast.success('All marked as read');
  };

  const colors = { assignment: '#EBF4FF', quiz: '#F3E8FF', grade: '#FFFBEB', course: '#F0FFF4', announcement: '#FFF5F5', system: '#F7FAFC', message: '#F0FFF4' };
  const unread = notifications.filter(n => !n.isRead).length;

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div><h1 className="page-title">Notifications</h1><p className="page-subtitle">{unread} unread</p></div>
        {unread > 0 && <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}><CheckCheck size={14} /> Mark all read</button>}
      </div>
      {notifications.length === 0 ? (
        <div className="empty-state"><Bell size={48} /><h3>No notifications</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map(n => (
            <div key={n._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 20px', borderRadius: '12px', background: n.isRead ? 'white' : (colors[n.type] || '#F7FAFC'), border: '1px solid #EDF2F7', borderLeft: `3px solid ${n.isRead ? '#EDF2F7' : '#48BB78'}`, cursor: 'pointer' }}
              onClick={() => !n.isRead && markRead(n._id).then(() => setNotifications(notifications.map(x => x._id === n._id ? { ...x, isRead: true } : x)))}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F8FAFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {n.type === 'assignment' ? '📝' : n.type === 'quiz' ? '🧠' : n.type === 'course' ? '📚' : '🔔'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '3px' }}>{n.title}</div>
                <div style={{ fontSize: '13px', color: '#718096' }}>{n.message}</div>
                <div style={{ fontSize: '12px', color: '#A0AEC0', marginTop: '4px' }}>{format(new Date(n.createdAt), 'MMM d, h:mm a')}</div>
              </div>
              {!n.isRead && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#48BB78', flexShrink: 0, marginTop: '6px' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeacherNotifications;
