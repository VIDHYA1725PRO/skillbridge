// MyCourses.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, unenrollCourse } from '../../utils/api';
import { BookOpen, Users, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMe().then(r => { setCourses(r.data.enrolledCourses || []); setLoading(false); });
  }, []);

  const handleUnenroll = async (id, title) => {
    if (!window.confirm(`Unenroll from "${title}"?`)) return;
    await unenrollCourse(id);
    setCourses(courses.filter(c => c._id !== id));
    toast.success('Unenrolled successfully');
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Courses</h1>
        <p className="page-subtitle">{courses.length} enrolled courses</p>
      </div>
      {courses.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} />
          <h3>No enrolled courses</h3>
          <p>Browse and enroll in courses to start learning</p>
          <button className="btn btn-primary" style={{marginTop:'16px'}} onClick={() => navigate('/student/courses')}>Browse Courses</button>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px'}}>
          {courses.map(course => (
            <div key={course._id} className="card" style={{overflow:'hidden'}}>
              <div style={{height:'10px', background: course.color || '#A8D8EA'}} />
              <div style={{padding:'20px'}}>
                <div style={{fontSize:'12px', fontWeight:'700', color:'#667eea', textTransform:'uppercase', marginBottom:'6px'}}>{course.category}</div>
                <h3 style={{fontSize:'16px', fontWeight:'700', marginBottom:'12px'}}>{course.title}</h3>
                <div style={{display:'flex', gap:'12px', marginBottom:'16px'}}>
                  <span style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'#A0AEC0'}}>
                    <Users size={13} /> {course.enrolledStudents?.length || 0} students
                  </span>
                </div>
                <div style={{display:'flex', gap:'8px'}}>
                  <button className="btn btn-secondary btn-sm" style={{flex:1, justifyContent:'center'}}
                    onClick={() => handleUnenroll(course._id, course.title)}>
                    Unenroll
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyCourses;
