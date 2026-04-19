import React, { useState, useEffect } from 'react';
import { getAdminUsers, addAdminUser, updateAdminUser, deleteAdminUser } from '../../utils/api';
import { Plus, Trash2, Edit2, Search, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { name: '', email: '', password: '', role: 'student', department: '', studentId: '', phone: '' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    const params = {};
    if (roleFilter !== 'all') params.role = roleFilter;
    if (search) params.search = search;
    const res = await getAdminUsers(params);
    const payload = res.data;
    setUsers(Array.isArray(payload) ? payload : payload?.users || []);
  };

  useEffect(() => { fetchUsers().finally(() => setLoading(false)); }, []);
  useEffect(() => { fetchUsers(); }, [roleFilter, search]);

  const openCreate = () => { setEditUser(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (user) => { setEditUser(user); setForm({ name: user.name, email: user.email, password: '', role: user.role, department: user.department || '', studentId: user.studentId || '', phone: user.phone || '' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editUser) {
        const { password, ...rest } = form;
        await updateAdminUser(editUser._id, rest);
        toast.success('User updated!');
      } else {
        await addAdminUser(form);
        toast.success('User added!');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    await deleteAdminUser(id);
    toast.success('User deactivated');
    fetchUsers();
  };

  const roleColors = { student: 'badge-blue', teacher: 'badge-green', admin: 'badge-red' };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div><h1 className="page-title">User Management</h1><p className="page-subtitle">{users.length} users</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add User</button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
          <Search size={18} />
          <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tab-bar" style={{ margin: 0 }}>
          {['all', 'student', 'teacher', 'admin'].map(r => (
            <button key={r} className={`tab ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)} style={{ textTransform: 'capitalize' }}>{r}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Department</th><th>Student ID</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: u.role === 'student' ? '#A8D8EA' : u.role === 'teacher' ? '#B5EAD7' : '#FFB7B2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', overflow: 'hidden' }}>
                        {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.name?.[0]}
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', color: '#718096' }}>{u.email}</td>
                  <td><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                  <td style={{ fontSize: '13px', color: '#718096' }}>{u.department || '-'}</td>
                  <td style={{ fontSize: '13px' }}>{u.studentId || '-'}</td>
                  <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ fontSize: '12px', color: '#A0AEC0' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}><Edit2 size={12} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id, u.name)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#A0AEC0' }}>No users found</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editUser ? 'Edit User' : 'Add New User'}</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#A0AEC0' }} onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                {!editUser && (
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Computer Science" />
                  </div>
                </div>
                {form.role === 'student' && (
                  <div className="form-group">
                    <label className="form-label">Student ID</label>
                    <input className="form-input" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} placeholder="e.g. STU-2024-001" />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editUser ? 'Update' : 'Add User'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
