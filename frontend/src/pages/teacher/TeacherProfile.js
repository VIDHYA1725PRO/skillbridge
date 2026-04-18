import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../utils/api';
import { Save, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherProfile() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '', department: user?.department || '', avatar: user?.avatar || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await updateProfile(form); await refreshUser(); toast.success('Profile updated!'); }
    catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try { await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }); toast.success('Password changed!'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div>
      <div className="page-header"><h1 className="page-title">My Profile</h1><p className="page-subtitle">Manage your faculty profile</p></div>

      <div className="card" style={{ padding: '28px', display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #B5EAD7, #A8D8EA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', overflow: 'hidden' }}>
          {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(user?.name)}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>{user?.name}</h2>
          <p style={{ color: '#718096', fontSize: '14px', marginBottom: '10px' }}>{user?.email}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-green">Faculty</span>
            {user?.department && <span className="badge badge-blue">{user.department}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '24px', fontWeight: '800' }}>{user?.createdCourses?.length || 0}</div>
            <div style={{ fontSize: '12px', color: '#A0AEC0' }}>Courses</div>
          </div>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}><User size={14} /> Personal Info</button>
        <button className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}><Lock size={14} /> Change Password</button>
      </div>

      {tab === 'profile' && (
        <div className="card" style={{ padding: '28px', maxWidth: '600px' }}>
          <form onSubmit={handleSave}>
            {[['Full Name', 'name', 'text', 'Your full name', true], ['Phone', 'phone', 'text', '+91 9999999999', false], ['Department', 'department', 'text', 'e.g. Computer Science', false], ['Avatar URL', 'avatar', 'text', 'https://...', false]].map(([label, field, type, placeholder, required]) => (
              <div className="form-group" key={field}>
                <label className="form-label">{label}</label>
                <input className="form-input" type={type} placeholder={placeholder} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} required={required} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} placeholder="Tell students about yourself..." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} style={{ resize: 'vertical' }} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="card" style={{ padding: '28px', maxWidth: '480px' }}>
          <form onSubmit={handleChangePassword}>
            {[['Current Password', 'currentPassword'], ['New Password', 'newPassword'], ['Confirm New Password', 'confirmPassword']].map(([label, field]) => (
              <div className="form-group" key={field}>
                <label className="form-label">{label}</label>
                <input className="form-input" type="password" value={pwForm[field]} onChange={e => setPwForm({ ...pwForm, [field]: e.target.value })} required minLength={field !== 'currentPassword' ? 6 : undefined} />
              </div>
            ))}
            <button className="btn btn-primary" type="submit" disabled={saving}><Lock size={16} /> {saving ? 'Changing...' : 'Change Password'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
