import React, { useState, useEffect } from 'react';
import { getTeacherCourses } from '../../utils/api';
import { Users, Search, BookOpen } from 'lucide-react';

export default function TeacherStudents() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');

  useEffect(() => {
    getTeacherCourses().then(r => { setCourses(r.data); setLoading(false); });
  }, []);

  const allStudents = [];
  const seen = new Set();
  courses.forEach(course => {
    course.enrolledStudents?.forEach(enrollment => {
      const student = enrollment.student;
      if (student && !seen.has(student._id)) {
        seen.add(student._id);
        allStudents.push({ ...student, courses: [course.title], courseColor: course.color });
      } else if (student && seen.has(student._id)) {
        const existing = allStudents.find(s => s._id === student._id);
        if (existing) existing.courses.push(course.title);
      }
    });
  });

  const filtered = allStudents.filter(s => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase());
    const matchCourse = selectedCourse === 'all' || s.courses?.includes(selectedCourse);
    return matchSearch && matchCourse;
  });

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Students</h1>
        <p className="page-subtitle">{allStudents.length} enrolled students</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
          <Search size={18} />
          <input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ padding: '10px 14px', borderRadius: '10px', border: '2px solid #EDF2F7', background: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px' }}
          value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
          <option value="all">All Courses</option>
          {courses.map(c => <option key={c._id} value={c.title}>{c.title}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><Users size={48} /><h3>No students found</h3></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Student</th><th>Email</th><th>Student ID</th><th>Department</th><th>Enrolled Courses</th></tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: s.courseColor || '#A8D8EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', overflow: 'hidden' }}>
                          {s.avatar ? <img src={s.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : s.name?.[0]}
                        </div>
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: '#718096' }}>{s.email}</td>
                    <td><span className="badge badge-blue">{s.studentId || 'N/A'}</span></td>
                    <td style={{ fontSize: '13px', color: '#718096' }}>{s.department || '-'}</td>
                    <td>
                      {s.courses?.map((c, i) => <span key={i} className="badge badge-purple" style={{ marginRight: '4px' }}>{c}</span>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
