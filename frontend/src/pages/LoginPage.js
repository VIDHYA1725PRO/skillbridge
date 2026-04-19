import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bg}>
        <div style={styles.blob1} />
        <div style={styles.blob2} />
        <div style={styles.blob3} />
      </div>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <div style={styles.logo}>🎓</div>
          <h1 style={styles.brand}>SkillBridge</h1>
          <p style={styles.tagline}>Academic Learning Effectiveness Platform</p>
        </div>
        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.subtitle}>Sign in to continue your learning journey</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={styles.register}>
           Don't have an account? <Link to="/register" style={{color:'#667eea', fontWeight:600}}>Register here</Link>
        </p>
        
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', background:'linear-gradient(135deg, #F0F4FF 0%, #FFF0F5 50%, #F0FFF4 100%)' },
  bg: { position:'absolute', inset:0, pointerEvents:'none' },
  blob1: { position:'absolute', top:'-100px', left:'-100px', width:'400px', height:'400px', borderRadius:'50%', background:'rgba(168,216,234,0.3)', filter:'blur(60px)' },
  blob2: { position:'absolute', bottom:'-100px', right:'-100px', width:'400px', height:'400px', borderRadius:'50%', background:'rgba(181,234,215,0.3)', filter:'blur(60px)' },
  blob3: { position:'absolute', top:'40%', left:'40%', width:'300px', height:'300px', borderRadius:'50%', background:'rgba(199,206,234,0.2)', filter:'blur(40px)' },
  card: { background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:'24px', padding:'48px 40px', width:'100%', maxWidth:'440px', boxShadow:'0 20px 60px rgba(0,0,0,0.1)', border:'1px solid rgba(255,255,255,0.8)', position:'relative', zIndex:1 },
  logoArea: { textAlign:'center', marginBottom:'32px' },
  logo: { fontSize:'48px', marginBottom:'8px' },
  brand: { fontFamily:'Sora, sans-serif', fontSize:'28px', fontWeight:'800', background:'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:'4px' },
  tagline: { fontSize:'13px', color:'#718096' },
  title: { fontFamily:'Sora, sans-serif', fontSize:'22px', fontWeight:'700', marginBottom:'4px' },
  subtitle: { fontSize:'14px', color:'#718096', marginBottom:'28px' },
  register: { textAlign:'center', fontSize:'14px', color:'#718096' },
};
