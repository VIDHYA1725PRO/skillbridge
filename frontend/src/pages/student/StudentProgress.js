import React, { useState, useEffect } from 'react';
import { getHeatmap, logProgress, getMe } from '../../utils/api';
import { format, subDays } from 'date-fns';
import { TrendingUp, BookOpen, Award } from 'lucide-react';

export default function StudentProgress() {
  const [heatmap, setHeatmap] = useState([]);
  const [profile, setProfile] = useState(null);
  const [studyMins, setStudyMins] = useState('');
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    getHeatmap().then(r => setHeatmap(r.data));
    getMe().then(r => setProfile(r.data));
  }, []);

  const handleLog = async () => {
    if (!studyMins) return;
    setLogging(true);
    await logProgress({ studyMinutes: parseInt(studyMins), activitiesCompleted: 1 });
    setLogging(false);
    setStudyMins('');
    const r = await getHeatmap();
    setHeatmap(r.data);
  };

  const totalMins = heatmap.reduce((acc, d) => acc + d.studyMinutes, 0);
  const totalDays = heatmap.filter(d => d.studyMinutes > 0).length;
  const streak = (() => {
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const key = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (heatmap.find(d => format(new Date(d.date), 'yyyy-MM-dd') === key && d.studyMinutes > 0)) s++;
      else break;
    }
    return s;
  })();

  const heatColors = ['#EDF2F7', '#BEE3F8', '#63B3ED', '#3182CE', '#1A365D'];
  const buildGrid = () => {
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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Progress</h1>
        <p className="page-subtitle">Track your learning journey</p>
      </div>

      <div className="grid-4" style={{marginBottom:'24px'}}>
        {[
          { label: 'Total Study Time', value: `${Math.round(totalMins/60)}h ${totalMins%60}m`, color: '#A8D8EA', icon: '⏱️' },
          { label: 'Active Days', value: totalDays, color: '#B5EAD7', icon: '📅' },
          { label: 'Current Streak', value: `${streak} days`, color: '#C7CEEA', icon: '🔥' },
          { label: 'Enrolled Courses', value: profile?.enrolledCourses?.length || 0, color: '#FFDAC1', icon: '📚' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{padding:'20px', background: stat.color}}>
            <div style={{fontSize:'24px', marginBottom:'8px'}}>{stat.icon}</div>
            <div style={{fontFamily:'Sora, sans-serif', fontSize:'24px', fontWeight:'800'}}>{stat.value}</div>
            <div style={{fontSize:'13px', color:'#718096', marginTop:'4px'}}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{padding:'24px', marginBottom:'24px'}}>
        <h3 style={{fontFamily:'Sora, sans-serif', fontWeight:'700', marginBottom:'16px'}}>🔥 Study Heatmap</h3>
        <div style={{overflowX:'auto'}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:'3px', gridAutoFlow:'column', gridTemplateRows:'repeat(7, 14px)', minWidth:'500px'}}>
            {buildGrid().map((d, i) => (
              <div key={i} title={`${format(d.date, 'MMM d')}: ${d.mins} mins`}
                style={{width:'14px', height:'14px', borderRadius:'3px', background: heatColors[d.level]}} />
            ))}
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'4px', marginTop:'12px', fontSize:'12px', color:'#A0AEC0'}}>
            <span>Less</span>
            {heatColors.map((c, i) => <div key={i} style={{width:'14px', height:'14px', borderRadius:'3px', background: c}} />)}
            <span>More</span>
          </div>
        </div>
      </div>

      <div className="card" style={{padding:'24px'}}>
        <h3 style={{fontFamily:'Sora, sans-serif', fontWeight:'700', marginBottom:'16px'}}>📝 Log Today's Study</h3>
        <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
          <input className="form-input" type="number" placeholder="Minutes studied today" value={studyMins}
            onChange={e => setStudyMins(e.target.value)} style={{maxWidth:'250px'}} />
          <button className="btn btn-primary" onClick={handleLog} disabled={logging}>
            {logging ? 'Logging...' : 'Log Activity'}
          </button>
        </div>
      </div>
    </div>
  );
}
