// AdminCourses.js
import React, { useState, useEffect } from 'react';
import { getAdminCourses, deleteCourse } from '../../utils/api';
import { Trash2, BookOpen, Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAdminCourses().then(r => { setCourses(r.data); setLoading(false); });
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete course "${title}"?`)) return;
    await deleteCourse(id);
    setCourses(courses.filter(c => c._id !== id));
    toast.success('Course deleted');
  };

  const filtered = courses.filter(c => !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.teacher?.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">All Courses</h1><p className="page-subtitle">{courses.length} total courses</p></div>
      <div className="search-bar" style={{ marginBottom: '20px', maxWidth: '400px' }}>
        <Search size={18} />
        <input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0
        ? <div className="empty-state"><BookOpen size={48} /><h3>No courses found</h3></div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filtered.map(c => (
              <div key={c._id} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ height: '10px', background: c.color || '#A8D8EA' }} />
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#667eea', textTransform: 'uppercase' }}>{c.category}</span>
                    <span className={`badge ${c.level === 'Beginner' ? 'badge-green' : c.level === 'Intermediate' ? 'badge-yellow' : 'badge-red'}`}>{c.level}</span>
                  </div>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>{c.title}</h3>
                  <p style={{ fontSize: '13px', color: '#718096', marginBottom: '12px' }}>{c.description?.slice(0, 70)}...</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#B5EAD7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>
                      {c.teacher?.name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{c.teacher?.name}</div>
                      <div style={{ fontSize: '11px', color: '#A0AEC0', display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={11} /> {c.enrolledStudents?.length || 0} enrolled</div>
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleDelete(c._id, c.title)}>
                    <Trash2 size={13} /> Delete Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

export default AdminCourses;
