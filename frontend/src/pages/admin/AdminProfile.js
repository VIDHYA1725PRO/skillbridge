import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../utils/api';
import { Save, Lock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProfile() {
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
      <div className="page-header"><h1 className="page-title">Admin Profile</h1><p className="page-subtitle">Manage your administrator account</p></div>

      <div className="card" style={{ padding: '28px', display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, #FFF0F5, #F5F0FF)', flexWrap: 'wrap' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #FC5C7D, #6A3093)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: 'white', overflow: 'hidden' }}>
          {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(user?.name)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '22px', fontWeight: '800' }}>{user?.name}</h2>
            <Shield size={18} color="#FC5C7D" />
          </div>
          <p style={{ color: '#718096', fontSize: '14px', marginBottom: '10px' }}>{user?.email}</p>
          <span className="badge badge-red">Administrator</span>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Personal Info</button>
        <button className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>Change Password</button>
      </div>

      {tab === 'profile' && (
        <div className="card" style={{ padding: '28px', maxWidth: '600px' }}>
          <form onSubmit={handleSave}>
            {[['Full Name', 'name', true], ['Phone', 'phone', false], ['Department', 'department', false], ['Avatar URL', 'avatar', false]].map(([label, field, required]) => (
              <div className="form-group" key={field}>
                <label className="form-label">{label}</label>
                <input className="form-input" value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} required={required} placeholder={label} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} style={{ resize: 'vertical' }} />
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
                <input className="form-input" type="password" value={pwForm[field]} onChange={e => setPwForm({ ...pwForm, [field]: e.target.value })} required />
              </div>
            ))}
            <button className="btn btn-primary" type="submit" disabled={saving}><Lock size={16} /> {saving ? 'Changing...' : 'Change Password'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
