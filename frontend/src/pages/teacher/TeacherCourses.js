import React, { useState, useEffect } from 'react';
import { getTeacherCourses, createCourse, updateCourse, deleteCourse } from '../../utils/api';
import { Plus, Trash2, Edit2, Users, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#A8D8EA', '#B5EAD7', '#C7CEEA', '#FFDAC1', '#FFB7B2', '#FFEAA7', '#E2F0CB', '#D4A5E8'];
const CATEGORIES = ['Programming', 'Mathematics', 'Science', 'Language', 'Design', 'Business', 'Data Science', 'Engineering', 'Arts', 'Health', 'Other'];

const emptyForm = { title: '', description: '', category: 'Programming', level: 'Beginner', duration: '', color: '#A8D8EA', tags: '' };

export default function TeacherCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTeacherCourses().then(r => { setCourses(r.data); setLoading(false); });
  }, []);

  const openCreate = () => { setEditCourse(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (course) => {
    setEditCourse(course);
    setForm({ title: course.title, description: course.description, category: course.category, level: course.level, duration: course.duration, color: course.color || '#A8D8EA', tags: course.tags?.join(', ') || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] };
      if (editCourse) {
        const res = await updateCourse(editCourse._id, data);
        setCourses(courses.map(c => c._id === editCourse._id ? { ...c, ...res.data } : c));
        toast.success('Course updated!');
      } else {
        const res = await createCourse(data);
        setCourses([res.data, ...courses]);
        toast.success('Course created!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    await deleteCourse(id);
    setCourses(courses.filter(c => c._id !== id));
    toast.success('Course deleted');
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">My Courses</h1>
          <p className="page-subtitle">{courses.length} courses created</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Create Course</button>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state"><BookOpen size={48} /><h3>No courses yet</h3><p>Create your first course to get started</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={openCreate}>Create Course</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {courses.map(c => (
            <div key={c._id} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ height: '12px', background: c.color || '#A8D8EA' }} />
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#667eea', textTransform: 'uppercase' }}>{c.category}</span>
                  <span className={`badge ${c.level === 'Beginner' ? 'badge-green' : c.level === 'Intermediate' ? 'badge-yellow' : 'badge-red'}`}>{c.level}</span>
                </div>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>{c.title}</h3>
                <p style={{ fontSize: '13px', color: '#718096', marginBottom: '16px' }}>{c.description?.slice(0, 80)}...</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#718096' }}>
                    <Users size={14} /> {c.enrolledStudents?.length || 0} students
                  </span>
                  {c.duration && <span style={{ fontSize: '13px', color: '#A0AEC0' }}>⏱ {c.duration}</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEdit(c)}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id, c.title)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editCourse ? 'Edit Course' : 'Create New Course'}</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#A0AEC0' }} onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Course Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Introduction to Python" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="What will students learn?" style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Level *</label>
                    <select className="form-input" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input className="form-input" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 8 weeks" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma separated)</label>
                  <input className="form-input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="python, beginner, programming" />
                </div>
                <div className="form-group">
                  <label className="form-label">Course Color</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {COLORS.map(color => (
                      <button type="button" key={color} style={{ width: '32px', height: '32px', borderRadius: '50%', background: color, border: form.color === color ? '3px solid #667eea' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.1s' }}
                        onClick={() => setForm({ ...form, color })} />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editCourse ? 'Update Course' : 'Create Course'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
