import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', department: '', studentId: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created! Welcome to SkillBridge 🎓');
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bg}><div style={styles.blob1} /><div style={styles.blob2} /></div>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <div style={styles.logo}>🎓</div>
          <h1 style={styles.brand}>SkillBridge</h1>
        </div>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Join thousands of learners today</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Your full name"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="student">Student</option>
              <option value="teacher">Teacher / Faculty</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input className="form-input" placeholder="e.g. Computer Science"
              value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
          </div>
          {form.role === 'student' && (
            <div className="form-group">
              <label className="form-label">Student ID (optional)</label>
              <input className="form-input" placeholder="e.g. STU-2024-001"
                value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} />
            </div>
          )}
          <button className="btn btn-primary btn-lg" type="submit" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Creating...' : 'Create Account →'}
          </button>
        </form>
        <p style={styles.login}>
          Already have an account? <Link to="/login" style={{color:'#667eea', fontWeight:600}}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', background:'linear-gradient(135deg, #F0F4FF 0%, #FFF0F5 50%, #F0FFF4 100%)', padding:'20px' },
  bg: { position:'absolute', inset:0, pointerEvents:'none' },
  blob1: { position:'absolute', top:'-100px', right:'-100px', width:'400px', height:'400px', borderRadius:'50%', background:'rgba(199,206,234,0.3)', filter:'blur(60px)' },
  blob2: { position:'absolute', bottom:'-100px', left:'-100px', width:'350px', height:'350px', borderRadius:'50%', background:'rgba(181,234,215,0.3)', filter:'blur(50px)' },
  card: { background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)', borderRadius:'24px', padding:'40px', width:'100%', maxWidth:'460px', boxShadow:'0 20px 60px rgba(0,0,0,0.1)', border:'1px solid rgba(255,255,255,0.8)', position:'relative', zIndex:1 },
  logoArea: { textAlign:'center', marginBottom:'24px' },
  logo: { fontSize:'40px', marginBottom:'6px' },
  brand: { fontFamily:'Sora, sans-serif', fontSize:'24px', fontWeight:'800', background:'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  title: { fontFamily:'Sora, sans-serif', fontSize:'22px', fontWeight:'700', marginBottom:'4px' },
  subtitle: { fontSize:'14px', color:'#718096', marginBottom:'24px' },
  login: { textAlign:'center', fontSize:'14px', color:'#718096', marginTop:'20px' },
};
