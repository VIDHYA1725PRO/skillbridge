import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTeacherCourses, getTeacherAssignments, getTeacherQuizzes } from '../../utils/api';
import { BookOpen, Users, ClipboardList, Brain, TrendingUp, Clock } from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTeacherCourses().then(r => setCourses(r.data)),
      getTeacherAssignments().then(r => setAssignments(r.data)),
      getTeacherQuizzes().then(r => setQuizzes(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const totalStudents = new Set(courses.flatMap(c => c.enrolledStudents?.map(e => e.student?._id || e.student))).size;
  const pendingGrades = assignments.reduce((acc, a) => acc + a.submissions?.filter(s => s.status === 'submitted').length, 0);
  const liveQuizzes = quizzes.filter(q => q.isActive).length;
  const recentSubmissions = assignments.flatMap(a => (a.submissions || []).map(s => ({ ...s, assignment: a.title, course: a.course?.title })))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).slice(0, 5);

  return (
    <div>
      <div style={styles.banner}>
        <div>
          <h1 style={styles.greeting}>Welcome back, {user?.name?.split(' ')[0]}! 👨‍🏫</h1>
          <p style={styles.sub}>Here's what's happening with your classes today</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Total Courses', value: courses.length, icon: '📚', color: '#A8D8EA', path: '/teacher/courses' },
          { label: 'Total Students', value: totalStudents, icon: '👩‍🎓', color: '#B5EAD7', path: '/teacher/students' },
          { label: 'Pending Grades', value: pendingGrades, icon: '📝', color: '#FFDAC1', path: '/teacher/assignments' },
          { label: 'Live Quizzes', value: liveQuizzes, icon: '🧠', color: '#C7CEEA', path: '/teacher/quizzes' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '20px', background: stat.color, cursor: 'pointer' }}
            onClick={() => navigate(stat.path)}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '28px', fontWeight: '800' }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* My Courses */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: '700' }}>📚 My Courses</h3>
            <button style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }} onClick={() => navigate('/teacher/courses')}>View all →</button>
          </div>
          {courses.slice(0, 4).map(c => (
            <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #EDF2F7' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.color || '#A8D8EA', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>{c.title}</div>
                <div style={{ fontSize: '12px', color: '#A0AEC0' }}>{c.enrolledStudents?.length || 0} students</div>
              </div>
              <span className="badge badge-blue">{c.level}</span>
            </div>
          ))}
          {courses.length === 0 && <p style={{ color: '#A0AEC0', fontSize: '14px' }}>No courses yet. Create one!</p>}
        </div>

        {/* Recent Submissions */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: '700' }}>📬 Recent Submissions</h3>
            <button style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }} onClick={() => navigate('/teacher/assignments')}>Grade all →</button>
          </div>
          {recentSubmissions.length === 0
            ? <p style={{ color: '#A0AEC0', fontSize: '14px' }}>No submissions yet</p>
            : recentSubmissions.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #EDF2F7' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#B5EAD7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
                  {s.student?.name?.[0] || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{s.student?.name}</div>
                  <div style={{ fontSize: '12px', color: '#A0AEC0' }}>{s.assignment}</div>
                </div>
                <span className={`badge ${s.status === 'graded' ? 'badge-green' : s.status === 'late' ? 'badge-red' : 'badge-yellow'}`}>
                  {s.status}
                </span>
              </div>
            ))
          }
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: '700', marginBottom: '16px' }}>⚡ Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Create Course', icon: '📚', color: '#A8D8EA', path: '/teacher/courses' },
              { label: 'New Assignment', icon: '📝', color: '#B5EAD7', path: '/teacher/assignments' },
              { label: 'Create Quiz', icon: '🧠', color: '#C7CEEA', path: '/teacher/quizzes' },
              { label: 'View Students', icon: '👩‍🎓', color: '#FFDAC1', path: '/teacher/students' },
              { label: 'Check Certs', icon: '🏆', color: '#FFB7B2', path: '/teacher/certificates' },
              { label: 'Messages', icon: '💬', color: '#FFEAA7', path: '/teacher/messages' },
            ].map(a => (
              <button key={a.label} style={{ padding: '12px', background: a.color, border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fontSize: '13px' }}
                onClick={() => navigate(a.path)}>
                <span style={{ fontSize: '18px' }}>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quiz overview */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: '700' }}>🧠 Quizzes</h3>
            <button style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }} onClick={() => navigate('/teacher/quizzes')}>Manage →</button>
          </div>
          {quizzes.slice(0, 5).map(q => (
            <div key={q._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #EDF2F7' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>{q.title}</div>
                <div style={{ fontSize: '12px', color: '#A0AEC0' }}>{q.attempts?.length || 0} attempts · {q.duration} min</div>
              </div>
              <span className={`badge ${q.isActive ? 'badge-green' : 'badge-purple'}`}>{q.isActive ? 'Live' : 'Inactive'}</span>
            </div>
          ))}
          {quizzes.length === 0 && <p style={{ color: '#A0AEC0', fontSize: '14px' }}>No quizzes yet</p>}
        </div>
      </div>
    </div>
  );
}

const styles = {
  banner: { background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', borderRadius: '20px', padding: '28px 32px', marginBottom: '28px' },
  greeting: { fontFamily: 'Sora, sans-serif', fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '6px' },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: '14px' },
};
