import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminStats } from '../../utils/api';
import { Users, BookOpen, ClipboardList, Brain, TrendingUp, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAdminStats().then(r => { setStats(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const roleColors = { student: '#A8D8EA', teacher: '#B5EAD7', admin: '#FFB7B2' };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #FC5C7D 0%, #6A3093 100%)', borderRadius: '20px', padding: '28px 32px', marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '6px' }}>Admin Dashboard 🛡️</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Total Students', value: stats?.students, icon: '👩‍🎓', color: '#A8D8EA', path: '/admin/users?role=student' },
          { label: 'Total Teachers', value: stats?.teachers, icon: '👨‍🏫', color: '#B5EAD7', path: '/admin/users?role=teacher' },
          { label: 'Total Admins', value: stats?.admins, icon: '🛡️', color: '#FFB7B2', path: '/admin/users?role=admin' },
          { label: 'Total Courses', value: stats?.courses, icon: '📚', color: '#C7CEEA', path: '/admin/courses' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '20px', background: s.color, cursor: 'pointer' }} onClick={() => navigate(s.path)}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '32px', fontWeight: '800' }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-4" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Total Enrollments', value: stats?.totalEnrollments, icon: '📊', color: '#FFDAC1' },
          { label: 'Total Assignments', value: stats?.assignments, icon: '📝', color: '#FFEAA7' },
          { label: 'Total Quizzes', value: stats?.quizzes, icon: '🧠', color: '#E2F0CB' },
          { label: 'Total Users', value: (stats?.students || 0) + (stats?.teachers || 0) + (stats?.admins || 0), icon: '👥', color: '#D4A5E8' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '20px', background: s.color }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '28px', fontWeight: '800' }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Users */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: '700' }}>👥 Recent Users</h3>
            <button style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }} onClick={() => navigate('/admin/users')}>View all →</button>
          </div>
          {stats?.recentUsers?.map(u => (
            <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #EDF2F7' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: roleColors[u.role] || '#C7CEEA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', overflow: 'hidden' }}>
                {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>{u.name}</div>
                <div style={{ fontSize: '12px', color: '#A0AEC0' }}>{u.email}</div>
              </div>
              <span className={`badge ${u.role === 'student' ? 'badge-blue' : u.role === 'teacher' ? 'badge-green' : 'badge-red'}`}>{u.role}</span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: '700', marginBottom: '16px' }}>⚡ Admin Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Add Student', icon: '👩‍🎓', color: '#A8D8EA', action: () => navigate('/admin/users') },
              { label: 'Add Teacher', icon: '👨‍🏫', color: '#B5EAD7', action: () => navigate('/admin/users') },
              { label: 'Add Course', icon: '📚', color: '#C7CEEA', action: () => navigate('/admin/courses') },
              { label: 'Announcements', icon: '📢', color: '#FFDAC1', action: () => navigate('/admin/notifications') },
              { label: 'Manage Users', icon: '⚙️', color: '#FFB7B2', action: () => navigate('/admin/users') },
              { label: 'View Reports', icon: '📊', color: '#FFEAA7', action: () => {} },
            ].map(a => (
              <button key={a.label} style={{ padding: '14px', background: a.color, border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fontSize: '13px' }}
                onClick={a.action}>
                <span style={{ fontSize: '20px' }}>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
