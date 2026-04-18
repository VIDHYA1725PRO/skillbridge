import React, { useState, useEffect, useCallback } from 'react';
import { getStudentQuizzes, getQuizForAttempt, submitQuiz } from '../../utils/api';
import { format } from 'date-fns';
import { Brain, Clock, CheckCircle, Lock, Play, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('available');

  useEffect(() => {
    getStudentQuizzes().then(r => { setQuizzes(r.data); setLoading(false); });
  }, []);

  const handleSubmitQuiz = useCallback(async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([idx, ans]) => ({
        questionIndex: parseInt(idx), selectedAnswer: ans
      }));
      const res = await submitQuiz(activeQuiz._id, {
        answers: formattedAnswers,
        timeTaken: activeQuiz.duration * 60 - timeLeft
      });
      setResult(res.data);
      setActiveQuiz(null);
      toast.success('Quiz submitted!');
      const r = await getStudentQuizzes();
      setQuizzes(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [activeQuiz, answers, timeLeft]);

  useEffect(() => {
    if (!activeQuiz || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); handleSubmitQuiz(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, timeLeft, handleSubmitQuiz]);

  const startQuiz = async (quizId) => {
    try {
      const res = await getQuizForAttempt(quizId);
      setActiveQuiz(res.data);
      setAnswers({});
      setTimeLeft(res.data.duration * 60);
      setResult(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot start quiz');
    }
  };

  const now = new Date();
  const available = quizzes.filter(q => q.isActive && !q.myAttempt && q.isLive);
  const upcoming = quizzes.filter(q => q.isActive && !q.myAttempt && !q.isLive);
  const completed = quizzes.filter(q => q.myAttempt);

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  // Active quiz UI
  if (activeQuiz) {
    return (
      <div>
        <div style={styles.quizHeader}>
          <div>
            <h2 style={{fontFamily:'Sora, sans-serif', fontWeight:'700', fontSize:'20px'}}>{activeQuiz.title}</h2>
            <p style={{color:'#718096', fontSize:'14px'}}>{activeQuiz.questions?.length} questions · {activeQuiz.duration} minutes</p>
          </div>
          <div style={{...styles.timer, color: timeLeft < 120 ? '#FC8181' : '#2D3748'}}>
            <Clock size={20} />
            <span style={{fontFamily:'Sora', fontSize:'22px', fontWeight:'700'}}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: `${(Object.keys(answers).length / activeQuiz.questions?.length) * 100}%`}} />
        </div>
        <p style={{fontSize:'13px', color:'#A0AEC0', marginBottom:'24px'}}>
          {Object.keys(answers).length}/{activeQuiz.questions?.length} answered
        </p>

        {activeQuiz.questions?.map((q, qi) => (
          <div key={qi} className="card" style={{padding:'24px', marginBottom:'16px'}}>
            <div style={styles.questionNum}>Q{qi + 1}</div>
            <p style={styles.questionText}>{q.question}</p>
            <div style={styles.options}>
              {q.options?.map((opt, oi) => (
                <button key={oi} style={{...styles.option, ...(answers[qi] === oi ? styles.optionSelected : {})}}
                  onClick={() => setAnswers({...answers, [qi]: oi})}>
                  <span style={styles.optionLetter}>{String.fromCharCode(65+oi)}</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{display:'flex', gap:'12px', justifyContent:'flex-end'}}>
          <button className="btn btn-secondary" onClick={() => { if(window.confirm('Quit quiz? Progress will be lost.')) { setActiveQuiz(null); }}}>
            Cancel
          </button>
          <button className="btn btn-primary btn-lg" onClick={handleSubmitQuiz} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Quiz'} 🚀
          </button>
        </div>
      </div>
    );
  }

  // Result
  if (result) {
    return (
      <div style={{textAlign:'center', padding:'60px 20px'}}>
        <div style={{fontSize:'80px', marginBottom:'16px'}}>{result.passed ? '🏆' : '📚'}</div>
        <h2 style={{fontFamily:'Sora', fontSize:'28px', fontWeight:'800', marginBottom:'8px'}}>
          {result.passed ? 'Congratulations!' : 'Keep Practicing!'}
        </h2>
        <p style={{fontSize:'48px', fontWeight:'800', color: result.passed ? '#48BB78' : '#FC8181', marginBottom:'8px'}}>
          {result.percentage}%
        </p>
        <p style={{color:'#718096', marginBottom:'32px'}}>Score: {result.score}/{result.totalMarks}</p>
        <button className="btn btn-primary btn-lg" onClick={() => setResult(null)}>Back to Quizzes</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quizzes</h1>
        <p className="page-subtitle">{quizzes.length} quizzes available</p>
      </div>

      <div className="tab-bar">
        {[{id:'available', label:`Live (${available.length})`}, {id:'upcoming', label:`Upcoming (${upcoming.length})`}, {id:'completed', label:`Completed (${completed.length})`}].map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === 'available' && (
        available.length === 0 ? <div className="empty-state"><Brain size={48} /><h3>No live quizzes</h3><p>Check back when your teacher starts one</p></div> :
        <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
          {available.map(q => (
            <div key={q._id} className="card" style={{padding:'24px', borderLeft:'4px solid #48BB78'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <h3 style={{fontFamily:'Sora', fontWeight:'700', fontSize:'17px', marginBottom:'6px'}}>{q.title}</h3>
                  <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
                    <span style={styles.chip}><Clock size={12} /> {q.duration} min</span>
                    <span style={styles.chip}><Brain size={12} /> {q.questions?.length || 0} questions</span>
                    <span style={{...styles.chip, color:'#276749', background:'#C6F6D5'}}>🟢 LIVE NOW</span>
                  </div>
                  {q.endTime && <p style={{fontSize:'12px', color:'#A0AEC0', marginTop:'8px'}}>Ends: {format(new Date(q.endTime), 'h:mm a')}</p>}
                </div>
                <button className="btn btn-primary" onClick={() => startQuiz(q._id)}>
                  <Play size={16} /> Start Quiz
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'upcoming' && (
        upcoming.length === 0 ? <div className="empty-state"><Clock size={48} /><h3>No upcoming quizzes</h3></div> :
        <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
          {upcoming.map(q => (
            <div key={q._id} className="card" style={{padding:'24px', opacity:0.8}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <h3 style={{fontFamily:'Sora', fontWeight:'700', marginBottom:'6px'}}>{q.title}</h3>
                  <div style={{display:'flex', gap:'8px'}}>
                    <span style={styles.chip}><Clock size={12} /> {q.duration} min</span>
                    {q.startTime && <span style={styles.chip}>📅 Starts: {format(new Date(q.startTime), 'MMM d, h:mm a')}</span>}
                  </div>
                </div>
                <Lock size={20} color="#A0AEC0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'completed' && (
        completed.length === 0 ? <div className="empty-state"><Trophy size={48} /><h3>No completed quizzes yet</h3></div> :
        <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
          {completed.map(q => (
            <div key={q._id} className="card" style={{padding:'24px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <h3 style={{fontFamily:'Sora', fontWeight:'700', marginBottom:'6px'}}>{q.title}</h3>
                  <div style={{display:'flex', gap:'8px'}}>
                    <span style={styles.chip}>{q.course?.title}</span>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'28px', fontWeight:'800', color: (q.myAttempt?.percentage || 0) >= 50 ? '#48BB78' : '#FC8181'}}>
                    {q.myAttempt?.percentage || 0}%
                  </div>
                  <div style={{fontSize:'12px', color:'#A0AEC0'}}>{q.myAttempt?.score}/{q.myAttempt?.totalMarks} marks</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  quizHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'16px' },
  timer: { display:'flex', alignItems:'center', gap:'8px', padding:'12px 20px', background:'white', borderRadius:'16px', boxShadow:'0 4px 16px rgba(0,0,0,0.08)' },
  progressBar: { width:'100%', height:'6px', background:'#EDF2F7', borderRadius:'10px', overflow:'hidden', marginBottom:'6px' },
  progressFill: { height:'100%', background:'linear-gradient(90deg, #667eea, #764ba2)', borderRadius:'10px', transition:'width 0.3s' },
  questionNum: { fontSize:'12px', fontWeight:'700', color:'#667eea', textTransform:'uppercase', marginBottom:'8px' },
  questionText: { fontSize:'16px', fontWeight:'600', marginBottom:'16px', lineHeight:'1.6' },
  options: { display:'flex', flexDirection:'column', gap:'10px' },
  option: { display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px', borderRadius:'12px', border:'2px solid #EDF2F7', background:'#F8FAFF', cursor:'pointer', textAlign:'left', fontSize:'14px', fontFamily:'Plus Jakarta Sans, sans-serif', transition:'all 0.2s' },
  optionSelected: { border:'2px solid #667eea', background:'rgba(102,126,234,0.08)', color:'#667eea' },
  optionLetter: { width:'28px', height:'28px', borderRadius:'50%', background:'#EDF2F7', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'12px', flexShrink:0 },
  chip: { display:'inline-flex', alignItems:'center', gap:'4px', background:'#F8FAFF', padding:'4px 10px', borderRadius:'8px', fontSize:'12px', color:'#718096', border:'1px solid #EDF2F7' },
};
