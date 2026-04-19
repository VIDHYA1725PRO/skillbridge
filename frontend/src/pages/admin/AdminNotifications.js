// AdminNotifications.js
import React, { useState } from 'react';
import { sendAnnouncement } from '../../utils/api';
import { Megaphone, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminNotifications() {
  const [form, setForm] = useState({ title: '', message: '', targetRole: 'all' });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await sendAnnouncement(form);
      toast.success(res.data.message);
      setHistory(prev => [{ ...form, sentAt: new Date(), ...res.data }, ...prev]);
      setForm({ title: '', message: '', targetRole: 'all' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Announcements</h1>
        <p className="page-subtitle">Send notifications to students, teachers, or everyone</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone size={20} color="#FC5C7D" /> New Announcement
          </h3>
          <form onSubmit={handleSend}>
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select className="form-input" value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })}>
                <option value="all">Everyone</option>
                <option value="student">Students Only</option>
                <option value="teacher">Teachers Only</option>
                <option value="admin">Admins Only</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Announcement Title *</label>
              <input className="form-input" placeholder="e.g. System Maintenance Notice" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Message *</label>
              <textarea className="form-input" rows={4} placeholder="Write your announcement here..." value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })} required style={{ resize: 'vertical' }} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={sending} style={{ width: '100%', justifyContent: 'center' }}>
              <Send size={16} /> {sending ? 'Sending...' : 'Send Announcement'}
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: '700', marginBottom: '20px' }}>📋 Sent History</h3>
          {history.length === 0
            ? <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '40px 0' }}>No announcements sent yet</div>
            : history.map((h, i) => (
              <div key={i} style={{ padding: '14px', background: '#F8FAFF', borderRadius: '10px', marginBottom: '10px', borderLeft: '3px solid #FC5C7D' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '700', fontSize: '14px' }}>{h.title}</span>
                  <span className="badge badge-purple" style={{ fontSize: '11px' }}>{h.targetRole === 'all' ? 'Everyone' : h.targetRole}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#718096', marginBottom: '4px' }}>{h.message}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#A0AEC0' }}>
                  <span>Sent to {h.count || 0} users</span>
                  <span>{new Date(h.sentAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

export default AdminNotifications;
