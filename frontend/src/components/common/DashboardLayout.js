import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markAllRead } from '../../utils/api';
import {
  LayoutDashboard, BookOpen, BookMarked, ClipboardList, TrendingUp,
  Brain, MessageSquare, Bell, User, LogOut, Menu, X, GraduationCap,
  Users, Settings, Award, ChevronRight, BookCheck
} from 'lucide-react';

const studentNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
  { label: 'All Courses', icon: BookOpen, path: '/student/courses' },
  { label: 'My Courses', icon: BookMarked, path: '/student/my-courses' },
  { label: 'Assignments', icon: ClipboardList, path: '/student/assignments' },
  { label: 'Progress', icon: TrendingUp, path: '/student/progress' },
  { label: 'Quizzes', icon: Brain, path: '/student/quizzes' },
  { label: 'Certificates', icon: Award, path: '/student/certificates' },
  { label: 'Messages', icon: MessageSquare, path: '/student/messages' },
  { label: 'Notifications', icon: Bell, path: '/student/notifications' },
  { label: 'Profile', icon: User, path: '/student/profile' },
];

const teacherNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher/dashboard' },
  { label: 'My Courses', icon: BookOpen, path: '/teacher/courses' },
  { label: 'Students', icon: Users, path: '/teacher/students' },
  { label: 'Assignments', icon: ClipboardList, path: '/teacher/assignments' },
  { label: 'Quizzes', icon: Brain, path: '/teacher/quizzes' },
  { label: 'Certificates', icon: Award, path: '/teacher/certificates' },
  { label: 'Messages', icon: MessageSquare, path: '/teacher/messages' },
  { label: 'Notifications', icon: Bell, path: '/teacher/notifications' },
  { label: 'Profile', icon: User, path: '/teacher/profile' },
];

const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Courses', icon: BookCheck, path: '/admin/courses' },
  { label: 'Announcements', icon: Bell, path: '/admin/notifications' },
  { label: 'Profile', icon: User, path: '/admin/profile' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifCount, setNotifCount] = useState(0);

  const navItems = user?.role === 'student' ? studentNav : user?.role === 'teacher' ? teacherNav : adminNav;

  useEffect(() => {
    getNotifications().then(res => {
      setNotifCount(res.data.filter(n => !n.isRead).length);
    }).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleColors = { student: '#A8D8EA', teacher: '#B5EAD7', admin: '#FFB7B2' };
  const roleColor = roleColors[user?.role] || '#C7CEEA';

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?';

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', width: sidebarOpen ? '260px' : '0' }}>
        {/* Logo */}
        <div style={styles.sidebarLogo}>
          <span style={styles.logoEmoji}>🎓</span>
          <div>
            <div style={styles.logoText}>SkillBridge</div>
            <div style={styles.logoRole}>{user?.role?.toUpperCase()}</div>
          </div>
          <button style={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* User card */}
        <div style={styles.userCard}>
          <div style={{...styles.avatarCircle, background: roleColor}}>
            {user?.avatar ? <img src={user.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} /> : getInitials(user?.name)}
          </div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userEmail}>{user?.email}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            const isNotif = item.path.includes('notification');
            return (
              <button key={item.path} className={`sidebar-link ${active ? 'active' : ''}`}
                onClick={() => { navigate(item.path); if(window.innerWidth < 768) setSidebarOpen(false); }}
                style={{position:'relative'}}>
                <Icon size={18} />
                <span>{item.label}</span>
                {isNotif && notifCount > 0 && (
                  <span style={styles.badge}>{notifCount > 99 ? '99+' : notifCount}</span>
                )}
                {active && <ChevronRight size={14} style={{marginLeft:'auto', color:'#667eea'}} />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={styles.sidebarFooter}>
          <button className="sidebar-link" onClick={handleLogout} style={{color:'#FC8181'}}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{...styles.main, marginLeft: sidebarOpen ? '260px' : '0'}}>
        {/* Header */}
        <header style={styles.header}>
          <button style={styles.menuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={22} />
          </button>
          <div style={styles.headerRight}>
            <button style={styles.headerBtn} onClick={() => navigate(`/${user?.role}/notifications`)}>
              <Bell size={20} />
              {notifCount > 0 && <span style={styles.notifDot} />}
            </button>
            <button style={styles.headerBtn} onClick={() => navigate(`/${user?.role}/messages`)}>
              <MessageSquare size={20} />
            </button>
            <button style={styles.profileBtn} onClick={() => navigate(`/${user?.role}/profile`)}>
              <div style={{...styles.avatarSmall, background: roleColor}}>
                {user?.avatar ? <img src={user.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} /> : getInitials(user?.name)}
              </div>
              <span style={styles.profileName}>{user?.name?.split(' ')[0]}</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}

const styles = {
  layout: { display:'flex', minHeight:'100vh', background:'#F8FAFF' },
  sidebar: { position:'fixed', top:0, left:0, height:'100vh', background:'white', borderRight:'1px solid #EDF2F7', display:'flex', flexDirection:'column', zIndex:100, transition:'all 0.3s ease', boxShadow:'2px 0 20px rgba(0,0,0,0.05)', overflow:'hidden' },
  sidebarLogo: { display:'flex', alignItems:'center', gap:'12px', padding:'24px 20px 16px', borderBottom:'1px solid #EDF2F7' },
  logoEmoji: { fontSize:'28px' },
  logoText: { fontFamily:'Sora, sans-serif', fontWeight:'800', fontSize:'18px', background:'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  logoRole: { fontSize:'10px', fontWeight:'700', color:'#A0AEC0', letterSpacing:'1px' },
  closeSidebar: { marginLeft:'auto', background:'none', border:'none', color:'#A0AEC0', cursor:'pointer', padding:'4px' },
  userCard: { display:'flex', alignItems:'center', gap:'12px', margin:'16px 12px', padding:'12px', borderRadius:'12px', background:'#F8FAFF' },
  avatarCircle: { width:'40px', height:'40px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'15px', color:'#2D3748', flexShrink:0, overflow:'hidden' },
  avatarSmall: { width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'13px', color:'#2D3748', overflow:'hidden' },
  userInfo: { overflow:'hidden' },
  userName: { fontWeight:'700', fontSize:'14px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  userEmail: { fontSize:'12px', color:'#A0AEC0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  nav: { flex:1, overflowY:'auto', padding:'8px 12px', display:'flex', flexDirection:'column', gap:'2px' },
  badge: { marginLeft:'auto', background:'#FC8181', color:'white', fontSize:'11px', fontWeight:'700', padding:'2px 6px', borderRadius:'10px', minWidth:'20px', textAlign:'center' },
  sidebarFooter: { padding:'12px', borderTop:'1px solid #EDF2F7' },
  main: { flex:1, display:'flex', flexDirection:'column', transition:'margin-left 0.3s ease', minWidth:0 },
  header: { height:'70px', background:'white', borderBottom:'1px solid #EDF2F7', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', position:'sticky', top:0, zIndex:50, boxShadow:'0 1px 10px rgba(0,0,0,0.04)' },
  menuBtn: { background:'none', border:'none', color:'#718096', cursor:'pointer', padding:'8px', borderRadius:'8px', display:'flex', alignItems:'center' },
  headerRight: { display:'flex', alignItems:'center', gap:'8px' },
  headerBtn: { background:'none', border:'none', color:'#718096', cursor:'pointer', padding:'8px', borderRadius:'10px', display:'flex', alignItems:'center', position:'relative', transition:'background 0.2s' },
  notifDot: { position:'absolute', top:'6px', right:'6px', width:'8px', height:'8px', borderRadius:'50%', background:'#FC8181', border:'2px solid white' },
  profileBtn: { display:'flex', alignItems:'center', gap:'8px', background:'#F8FAFF', border:'1px solid #EDF2F7', padding:'6px 12px 6px 6px', borderRadius:'20px', cursor:'pointer' },
  profileName: { fontSize:'14px', fontWeight:'600', color:'#2D3748' },
  content: { flex:1, padding:'28px', overflowY:'auto' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', zIndex:99, display:'none' },
};
