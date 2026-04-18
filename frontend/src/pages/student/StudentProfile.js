import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../utils/api';
import { User, Lock, Save, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentProfile() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    department: user?.department || '',
    avatar: user?.avatar || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your personal information</p>
      </div>

      {/* Profile Header Card */}
      <div className="card" style={styles.profileCard}>
        <div style={styles.avatarWrap}>
          <div style={styles.avatar}>{user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : getInitials(user?.name)}</div>
          <div style={styles.avatarBadge}><Camera size={14} /></div>
        </div>
        <div style={styles.profileInfo}>
          <h2 style={styles.profileName}>{user?.name}</h2>
          <p style={styles.profileEmail}>{user?.email}</p>
          <div style={styles.profileTags}>
            <span className="badge badge-blue">{user?.role}</span>
            {user?.department && <span className="badge badge-purple">{user?.department}</span>}
            {user?.studentId && <span className="badge badge-green">{user?.studentId}</span>}
          </div>
        </div>
        <div style={styles.profileStats}>
          <div style={styles.stat}>
            <div style={styles.statNum}>{user?.enrolledCourses?.length || 0}</div>
            <div style={styles.statLabel}>Courses</div>
          </div>
          <div style={styles.statDiv} />
          <div style={styles.stat}>
            <div style={styles.statNum}>{user?.certificates?.length || 0}</div>
            <div style={styles.statLabel}>Certificates</div>
          </div>
        </div>
      </div>

      <div className="tab-bar" style={{ marginTop: '24px' }}>
        <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}><User size={14} /> Personal Info</button>
        <button className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}><Lock size={14} /> Change Password</button>
      </div>

      {tab === 'profile' && (
        <div className="card" style={{ padding: '28px', maxWidth: '600px' }}>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="+91 9999999999" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" placeholder="e.g. Computer Science" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} placeholder="Tell us about yourself..." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Avatar URL (optional)</label>
              <input className="form-input" placeholder="https://..." value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="card" style={{ padding: '28px', maxWidth: '480px' }}>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              <Lock size={16} /> {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  profileCard: { padding: '28px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #A8D8EA, #C7CEEA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontSize: '28px', fontWeight: '800', color: '#2D3748', overflow: 'hidden' },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: '#667eea', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', cursor: 'pointer' },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: 'Sora, sans-serif', fontSize: '22px', fontWeight: '800', marginBottom: '4px' },
  profileEmail: { color: '#718096', fontSize: '14px', marginBottom: '10px' },
  profileTags: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  profileStats: { display: 'flex', alignItems: 'center', gap: '24px' },
  stat: { textAlign: 'center' },
  statNum: { fontFamily: 'Sora, sans-serif', fontSize: '24px', fontWeight: '800' },
  statLabel: { fontSize: '12px', color: '#A0AEC0' },
  statDiv: { width: '1px', height: '40px', background: '#EDF2F7' },
};
