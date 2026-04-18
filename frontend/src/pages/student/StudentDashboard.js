import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTodos, createTodo, updateTodo, deleteTodo, getStudentAssignments, getHeatmap, getMe } from '../../utils/api';
import { format, isAfter, parseISO, startOfDay, subDays } from 'date-fns';
import { BookOpen, ClipboardList, Plus, Trash2, CheckCircle, Circle, AlertCircle, Calendar, Flame } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTodos().then(r => setTodos(r.data)),
      getStudentAssignments().then(r => setAssignments(r.data)),
      getHeatmap().then(r => setHeatmap(r.data)),
      getMe().then(r => setProfile(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    const todo = await createTodo({ title: newTodo });
    setTodos([todo.data, ...todos]);
    setNewTodo('');
  };

  const toggleTodo = async (todo) => {
    const updated = await updateTodo(todo._id, { isCompleted: !todo.isCompleted });
    setTodos(todos.map(t => t._id === todo._id ? updated.data : t));
  };

  const removeTodo = async (id) => {
    await deleteTodo(id);
    setTodos(todos.filter(t => t._id !== id));
  };

  const now = new Date();
  const pendingAssignments = assignments.filter(a => !a.mySubmission && isAfter(new Date(a.deadline), now));
  const overdueAssignments = assignments.filter(a => !a.mySubmission && !isAfter(new Date(a.deadline), now));
  const activeCourses = profile?.enrolledCourses?.length || 0;

  // Build heatmap grid: last 84 days (12 weeks)
  const buildHeatmapGrid = () => {
    const days = [];
    const dataMap = {};
    heatmap.forEach(d => { dataMap[format(new Date(d.date), 'yyyy-MM-dd')] = d.studyMinutes; });
    for (let i = 83; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const key = format(date, 'yyyy-MM-dd');
      const mins = dataMap[key] || 0;
      let level = 0;
      if (mins > 0) level = 1;
      if (mins >= 30) level = 2;
      if (mins >= 60) level = 3;
      if (mins >= 120) level = 4;
      days.push({ date, key, level, mins });
    }
    return days;
  };

  const heatColors = ['#EDF2F7', '#BEE3F8', '#63B3ED', '#3182CE', '#1A365D'];
  const heatDays = buildHeatmapGrid();

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      {/* Welcome Banner */}
      <div style={styles.banner}>
        <div>
          <h1 style={styles.greeting}>{greetingTime()}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p style={styles.greetingSub}>Ready to continue your learning journey?</p>
        </div>
        <div style={styles.bannerStats}>
          <div style={styles.bannerStat}>
            <span style={styles.bannerStatNum}>{activeCourses}</span>
            <span style={styles.bannerStatLabel}>Active Courses</span>
          </div>
          <div style={styles.bannerDivider} />
          <div style={styles.bannerStat}>
            <span style={styles.bannerStatNum}>{pendingAssignments.length}</span>
            <span style={styles.bannerStatLabel}>Pending Tasks</span>
          </div>
          <div style={styles.bannerDivider} />
          <div style={styles.bannerStat}>
            <span style={styles.bannerStatNum}>{todos.filter(t => !t.isCompleted).length}</span>
            <span style={styles.bannerStatLabel}>To-Do Items</span>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Left Column */}
        <div style={styles.leftCol}>
          {/* Study Heatmap */}
          <div className="card" style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitle}><Flame size={18} color="#ED8936" /> Study Activity</div>
              <span style={styles.sectionSub}>Last 12 weeks</span>
            </div>
            <div style={styles.heatmapWrap}>
              <div style={styles.heatmapGrid}>
                {heatDays.map((d, i) => (
                  <div key={i} title={`${format(d.date, 'MMM d')}: ${d.mins} mins`}
                    style={{...styles.heatCell, background: heatColors[d.level]}} />
                ))}
              </div>
              <div style={styles.heatLegend}>
                <span style={styles.legendLabel}>Less</span>
                {heatColors.map((c, i) => <div key={i} style={{...styles.heatCell, background: c}} />)}
                <span style={styles.legendLabel}>More</span>
              </div>
            </div>
          </div>

          {/* Active Courses quick view */}
          <div className="card" style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitle}><BookOpen size={18} color="#667eea" /> Active Courses</div>
              <button style={styles.linkBtn} onClick={() => navigate('/student/my-courses')}>View all →</button>
            </div>
            {activeCourses === 0 ? (
              <div className="empty-state">
                <BookOpen size={32} />
                <h3>No courses yet</h3>
                <p>Browse and enroll in courses</p>
                <button className="btn btn-primary btn-sm" style={{marginTop:'12px'}} onClick={() => navigate('/student/courses')}>
                  Browse Courses
                </button>
              </div>
            ) : (
              <div style={styles.courseList}>
                {profile?.enrolledCourses?.slice(0, 4).map(c => (
                  <div key={c._id} style={{...styles.courseItem, borderLeft:`4px solid ${c.color || '#A8D8EA'}`}}
                    onClick={() => navigate('/student/my-courses')}>
                    <div style={styles.courseItemTitle}>{c.title}</div>
                    <div style={styles.courseItemMeta}>{c.category}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignment Deadlines */}
          <div className="card" style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitle}><Calendar size={18} color="#48BB78" /> Upcoming Deadlines</div>
              <button style={styles.linkBtn} onClick={() => navigate('/student/assignments')}>View all →</button>
            </div>
            {pendingAssignments.length === 0 && overdueAssignments.length === 0 ? (
              <div style={styles.emptySmall}>🎉 No pending assignments!</div>
            ) : (
              <div style={styles.deadlineList}>
                {overdueAssignments.slice(0, 3).map(a => (
                  <div key={a._id} style={{...styles.deadlineItem, borderLeft:'3px solid #FC8181'}}>
                    <AlertCircle size={14} color="#FC8181" style={{flexShrink:0}} />
                    <div>
                      <div style={styles.deadlineTitle}>{a.title}</div>
                      <div style={{...styles.deadlineMeta, color:'#FC8181'}}>Overdue · {format(new Date(a.deadline), 'MMM d')}</div>
                    </div>
                  </div>
                ))}
                {pendingAssignments.slice(0, 4).map(a => (
                  <div key={a._id} style={{...styles.deadlineItem, borderLeft:'3px solid #68D391'}}>
                    <Calendar size={14} color="#48BB78" style={{flexShrink:0}} />
                    <div>
                      <div style={styles.deadlineTitle}>{a.title}</div>
                      <div style={styles.deadlineMeta}>{a.course?.title} · Due {format(new Date(a.deadline), 'MMM d, h:mm a')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - To Do */}
        <div style={styles.rightCol}>
          <div className="card" style={{...styles.section, height:'fit-content'}}>
            <div style={styles.sectionTitle}><ClipboardList size={18} color="#9B59B6" /> My To-Do List</div>
            <form onSubmit={handleAddTodo} style={styles.todoForm}>
              <input style={styles.todoInput} placeholder="Add a new task..." value={newTodo}
                onChange={e => setNewTodo(e.target.value)} />
              <button type="submit" style={styles.todoAddBtn}><Plus size={18} /></button>
            </form>
            <div style={styles.todoList}>
              {todos.length === 0 && <div style={styles.emptySmall}>Add your first task!</div>}
              {todos.map(todo => (
                <div key={todo._id} style={styles.todoItem}>
                  <button onClick={() => toggleTodo(todo)} style={styles.todoCheck}>
                    {todo.isCompleted
                      ? <CheckCircle size={20} color="#48BB78" />
                      : <Circle size={20} color="#CBD5E0" />}
                  </button>
                  <span style={{...styles.todoText, textDecoration: todo.isCompleted ? 'line-through' : 'none', color: todo.isCompleted ? '#A0AEC0' : '#2D3748'}}>
                    {todo.title}
                  </span>
                  <button onClick={() => removeTodo(todo._id)} style={styles.todoDelete}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {todos.length > 0 && (
              <div style={styles.todoStats}>
                {todos.filter(t => t.isCompleted).length}/{todos.length} completed
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card" style={styles.section}>
            <div style={styles.sectionTitle} >⚡ Quick Actions</div>
            <div style={styles.quickActions}>
              {[
                { label: 'Browse Courses', path: '/student/courses', color: '#A8D8EA', icon: '📚' },
                { label: 'View Assignments', path: '/student/assignments', color: '#B5EAD7', icon: '📝' },
                { label: 'Take Quiz', path: '/student/quizzes', color: '#C7CEEA', icon: '🧠' },
                { label: 'My Progress', path: '/student/progress', color: '#FFDAC1', icon: '📈' },
                { label: 'Upload Certificate', path: '/student/certificates', color: '#FFB7B2', icon: '🏆' },
                { label: 'Ask Teacher', path: '/student/messages', color: '#FFEAA7', icon: '💬' },
              ].map(a => (
                <button key={a.label} style={{...styles.quickBtn, background: a.color}} onClick={() => navigate(a.path)}>
                  <span style={styles.quickIcon}>{a.icon}</span>
                  <span style={styles.quickLabel}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  banner: { background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius:'20px', padding:'32px', marginBottom:'28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'20px' },
  greeting: { fontFamily:'Sora, sans-serif', fontSize:'26px', fontWeight:'800', color:'white', marginBottom:'6px' },
  greetingSub: { color:'rgba(255,255,255,0.8)', fontSize:'15px' },
  bannerStats: { display:'flex', alignItems:'center', gap:'24px' },
  bannerStat: { textAlign:'center' },
  bannerStatNum: { display:'block', fontSize:'28px', fontWeight:'800', color:'white' },
  bannerStatLabel: { fontSize:'12px', color:'rgba(255,255,255,0.75)', fontWeight:'500' },
  bannerDivider: { width:'1px', height:'40px', background:'rgba(255,255,255,0.3)' },
  grid: { display:'grid', gridTemplateColumns:'1fr 340px', gap:'24px', alignItems:'start' },
  leftCol: { display:'flex', flexDirection:'column', gap:'24px' },
  rightCol: { display:'flex', flexDirection:'column', gap:'24px' },
  section: { padding:'24px' },
  sectionHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' },
  sectionTitle: { display:'flex', alignItems:'center', gap:'8px', fontFamily:'Sora, sans-serif', fontWeight:'700', fontSize:'15px' },
  sectionSub: { fontSize:'13px', color:'#A0AEC0' },
  linkBtn: { background:'none', border:'none', color:'#667eea', fontSize:'13px', fontWeight:'600', cursor:'pointer' },
  heatmapWrap: { overflowX:'auto' },
  heatmapGrid: { display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:'3px', minWidth:'500px', gridAutoFlow:'column', gridTemplateRows:'repeat(7, 14px)' },
  heatCell: { width:'14px', height:'14px', borderRadius:'3px' },
  heatLegend: { display:'flex', alignItems:'center', gap:'4px', marginTop:'12px', fontSize:'12px', color:'#A0AEC0' },
  legendLabel: { fontSize:'12px', color:'#A0AEC0' },
  courseList: { display:'flex', flexDirection:'column', gap:'8px' },
  courseItem: { padding:'12px 14px', borderRadius:'10px', background:'#F8FAFF', cursor:'pointer', transition:'all 0.2s' },
  courseItemTitle: { fontWeight:'600', fontSize:'14px', marginBottom:'2px' },
  courseItemMeta: { fontSize:'12px', color:'#A0AEC0' },
  deadlineList: { display:'flex', flexDirection:'column', gap:'8px' },
  deadlineItem: { display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px 12px', borderRadius:'10px', background:'#F8FAFF' },
  deadlineTitle: { fontWeight:'600', fontSize:'13px' },
  deadlineMeta: { fontSize:'12px', color:'#A0AEC0', marginTop:'2px' },
  emptySmall: { textAlign:'center', color:'#A0AEC0', fontSize:'14px', padding:'20px 0' },
  todoForm: { display:'flex', gap:'8px', marginBottom:'16px', marginTop:'16px' },
  todoInput: { flex:1, padding:'10px 14px', borderRadius:'10px', border:'2px solid #EDF2F7', fontSize:'14px', background:'#F8FAFF' },
  todoAddBtn: { width:'40px', height:'40px', background:'linear-gradient(135deg, #667eea, #764ba2)', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  todoList: { display:'flex', flexDirection:'column', gap:'4px', maxHeight:'300px', overflowY:'auto' },
  todoItem: { display:'flex', alignItems:'center', gap:'10px', padding:'8px 4px', borderRadius:'8px' },
  todoCheck: { background:'none', border:'none', cursor:'pointer', flexShrink:0, padding:'0' },
  todoText: { flex:1, fontSize:'14px' },
  todoDelete: { background:'none', border:'none', cursor:'pointer', color:'#CBD5E0', padding:'4px', borderRadius:'6px', opacity:0, transition:'opacity 0.2s' },
  todoStats: { textAlign:'right', fontSize:'12px', color:'#A0AEC0', marginTop:'12px', paddingTop:'12px', borderTop:'1px solid #EDF2F7' },
  quickActions: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginTop:'16px' },
  quickBtn: { padding:'12px', borderRadius:'12px', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', transition:'transform 0.2s' },
  quickIcon: { fontSize:'20px' },
  quickLabel: { fontSize:'12px', fontWeight:'600', color:'#2D3748', textAlign:'center' },
};
