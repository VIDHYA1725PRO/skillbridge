import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCourses, enrollCourse } from '../../utils/api';
import { Search, BookOpen, Users, Clock, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const COURSE_EMOJIS = { 'Programming': '💻', 'Mathematics': '📐', 'Science': '🔬', 'Language': '📖', 'Design': '🎨', 'Business': '💼', 'Data Science': '📊', 'Engineering': '⚙️', 'Arts': '🎭', 'Health': '🏥' };
const COURSE_COLORS = ['#A8D8EA', '#B5EAD7', '#C7CEEA', '#FFDAC1', '#FFB7B2', '#FFEAA7', '#E2F0CB', '#D4A5E8'];

export default function AllCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);

  useEffect(() => {
    getCourses().then(r => { setCourses(r.data); setFiltered(r.data); setLoading(false); });
  }, []);

  useEffect(() => {
    let res = courses;
    if (search) res = res.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'All') res = res.filter(c => c.category === category);
    if (level !== 'All') res = res.filter(c => c.level === level);
    setFiltered(res);
  }, [search, category, level, courses]);

  const categories = ['All', ...new Set(courses.map(c => c.category))];
  const isEnrolled = (course) => user?.enrolledCourses?.some(e => (e._id || e) === course._id);

  const handleEnroll = async (course) => {
    if (isEnrolled(course)) return;
    setEnrolling(course._id);
    try {
      await enrollCourse(course._id);
      toast.success(`Enrolled in ${course.title}!`);
      // Refresh courses
      const r = await getCourses();
      setCourses(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Explore Courses</h1>
        <p className="page-subtitle">Discover {courses.length} courses across all subjects</p>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div className="search-bar" style={{flex:1, maxWidth:'400px'}}>
          <Search size={18} />
          <input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={styles.filterGroup}>
          <select style={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select style={styles.select} value={level} onChange={e => setLevel(e.target.value)}>
            {['All','Beginner','Intermediate','Advanced'].map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      <div style={styles.results}>
        <span style={styles.resultCount}>{filtered.length} courses found</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} />
          <h3>No courses found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map((course, idx) => {
            const enrolled = user?.enrolledCourses?.some(e => (e._id || e) === course._id);
            const color = course.color || COURSE_COLORS[idx % COURSE_COLORS.length];
            const emoji = COURSE_EMOJIS[course.category] || '📚';
            return (
              <div key={course._id} className="course-card">
                <div className="course-card-header" style={{background: color}}>
                  <span style={{fontSize:'48px'}}>{emoji}</span>
                  <span style={{...styles.levelBadge, background: 'rgba(255,255,255,0.8)'}}>{course.level}</span>
                </div>
                <div className="course-card-body">
                  <div style={styles.category}>{course.category}</div>
                  <h3 className="course-card-title">{course.title}</h3>
                  <p style={styles.desc}>{course.description.slice(0, 80)}...</p>
                  <div style={styles.courseMeta}>
                    <span style={styles.metaItem}><Users size={13} /> {course.totalEnrollments}</span>
                    {course.duration && <span style={styles.metaItem}><Clock size={13} /> {course.duration}</span>}
                  </div>
                  <div style={styles.teacher}>
                    <div style={{...styles.teacherAvatar, background: color}}>
                      {course.teacher?.name?.[0]}
                    </div>
                    <span style={styles.teacherName}>{course.teacher?.name}</span>
                  </div>
                  <button
                    className={`btn ${enrolled ? 'btn-secondary' : 'btn-primary'}`}
                    style={{width:'100%', marginTop:'12px', justifyContent:'center'}}
                    onClick={() => handleEnroll(course)}
                    disabled={enrolled || enrolling === course._id}>
                    {enrolling === course._id ? 'Enrolling...' : enrolled ? '✓ Enrolled' : 'Enroll Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  filters: { display:'flex', gap:'16px', marginBottom:'20px', flexWrap:'wrap', alignItems:'center' },
  filterGroup: { display:'flex', gap:'10px' },
  select: { padding:'10px 14px', borderRadius:'10px', border:'2px solid #EDF2F7', background:'white', fontSize:'14px', fontFamily:'Plus Jakarta Sans, sans-serif', color:'#2D3748', cursor:'pointer' },
  results: { marginBottom:'20px' },
  resultCount: { fontSize:'14px', color:'#718096' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px' },
  category: { fontSize:'12px', fontWeight:'700', color:'#667eea', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' },
  levelBadge: { position:'absolute', top:'12px', right:'12px', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', color:'#2D3748' },
  desc: { fontSize:'13px', color:'#718096', marginBottom:'12px', lineHeight:'1.5' },
  courseMeta: { display:'flex', gap:'16px', marginBottom:'12px' },
  metaItem: { display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'#A0AEC0' },
  teacher: { display:'flex', alignItems:'center', gap:'8px' },
  teacherAvatar: { width:'26px', height:'26px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', color:'#2D3748' },
  teacherName: { fontSize:'13px', color:'#718096', fontWeight:'500' },
};
