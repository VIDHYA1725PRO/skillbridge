import React, { useState, useEffect } from 'react';
import { getTeacherQuizzes, createQuiz, toggleQuiz, deleteQuiz, getTeacherCourses } from '../../utils/api';
import { format } from 'date-fns';
import { Plus, Trash2, Brain, Play, Square, ChevronDown, ChevronUp, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyQuestion = { question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 };

export default function TeacherQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({ title: '', description: '', course: '', duration: 30, startTime: '', endTime: '', passingScore: 50, questions: [{ ...emptyQuestion, options: ['', '', '', ''] }] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getTeacherQuizzes().then(r => setQuizzes(r.data)),
      getTeacherCourses().then(r => setCourses(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const addQuestion = () => setForm(f => ({ ...f, questions: [...f.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }] }));
  const removeQuestion = (i) => setForm(f => ({ ...f, questions: f.questions.filter((_, qi) => qi !== i) }));
  const updateQuestion = (i, field, val) => setForm(f => {
    const qs = [...f.questions];
    qs[i] = { ...qs[i], [field]: val };
    return { ...f, questions: qs };
  });
  const updateOption = (qi, oi, val) => setForm(f => {
    const qs = [...f.questions];
    const opts = [...qs[qi].options];
    opts[oi] = val;
    qs[qi] = { ...qs[qi], options: opts };
    return { ...f, questions: qs };
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.questions.some(q => !q.question || q.options.some(o => !o))) {
      toast.error('Fill all questions and options'); return;
    }
    setSaving(true);
    try {
      const res = await createQuiz(form);
      setQuizzes([res.data, ...quizzes]);
      setShowModal(false);
      setForm({ title: '', description: '', course: '', duration: 30, startTime: '', endTime: '', passingScore: 50, questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }] });
      toast.success('Quiz created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    const res = await toggleQuiz(id);
    setQuizzes(quizzes.map(q => q._id === id ? { ...q, isActive: res.data.isActive } : q));
    toast.success(res.data.isActive ? 'Quiz is now LIVE!' : 'Quiz stopped');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete quiz?')) return;
    await deleteQuiz(id);
    setQuizzes(quizzes.filter(q => q._id !== id));
    toast.success('Deleted');
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Quizzes</h1>
          <p className="page-subtitle">{quizzes.length} quizzes created</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Create Quiz</button>
      </div>

      {quizzes.length === 0
        ? <div className="empty-state"><Brain size={48} /><h3>No quizzes yet</h3><p>Create your first quiz</p></div>
        : quizzes.map(q => (
          <div key={q._id} className="card" style={{ marginBottom: '16px', borderLeft: `4px solid ${q.isActive ? '#48BB78' : '#CBD5E0'}` }}>
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              onClick={() => setExpanded(p => ({ ...p, [q._id]: !p[q._id] }))}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '16px', fontWeight: '700' }}>{q.title}</h3>
                  <span className={`badge ${q.isActive ? 'badge-green' : 'badge-purple'}`}>{q.isActive ? '🟢 Live' : 'Inactive'}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#718096' }}>
                  <span>📚 {q.course?.title}</span>
                  <span>⏱ {q.duration} min</span>
                  <span>❓ {q.questions?.length} questions</span>
                  <span><Users size={13} /> {q.attempts?.length || 0} attempts</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className={`btn btn-sm ${q.isActive ? 'btn-danger' : 'btn-success'}`} onClick={e => { e.stopPropagation(); handleToggle(q._id); }}>
                  {q.isActive ? <><Square size={13} /> Stop</> : <><Play size={13} /> Start</>}
                </button>
                <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDelete(q._id); }}><Trash2 size={13} /></button>
                {expanded[q._id] ? <ChevronUp size={18} color="#A0AEC0" /> : <ChevronDown size={18} color="#A0AEC0" />}
              </div>
            </div>

            {expanded[q._id] && q.attempts?.length > 0 && (
              <div style={{ borderTop: '1px solid #EDF2F7', padding: '16px 24px' }}>
                <h4 style={{ fontWeight: '700', marginBottom: '12px', fontSize: '14px' }}>Results ({q.attempts.length} attempts)</h4>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Student</th><th>Score</th><th>Percentage</th><th>Status</th><th>Time Taken</th></tr></thead>
                    <tbody>
                      {q.attempts.map((att, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: '600', fontSize: '13px' }}>{att.student?.name || 'Unknown'}</td>
                          <td>{att.score}/{att.totalMarks}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', background: '#EDF2F7', borderRadius: '10px', maxWidth: '80px' }}>
                                <div style={{ height: '100%', borderRadius: '10px', background: att.percentage >= q.passingScore ? '#48BB78' : '#FC8181', width: `${att.percentage}%` }} />
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: '600' }}>{att.percentage}%</span>
                            </div>
                          </td>
                          <td><span className={`badge ${att.percentage >= q.passingScore ? 'badge-green' : 'badge-red'}`}>{att.percentage >= q.passingScore ? 'Passed' : 'Failed'}</span></td>
                          <td style={{ fontSize: '13px', color: '#718096' }}>{att.timeTaken ? `${Math.floor(att.timeTaken / 60)}m ${att.timeTaken % 60}s` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))
      }

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Quiz</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#A0AEC0' }} onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Quiz Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Chapter 3 Quiz" />
                </div>
                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <select className="form-input" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} required>
                    <option value="">Select course...</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Duration (min) *</label>
                    <input className="form-input" type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} required min={1} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input className="form-input" type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input className="form-input" type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Passing Score (%)</label>
                  <input className="form-input" type="number" value={form.passingScore} onChange={e => setForm({ ...form, passingScore: e.target.value })} min={0} max={100} />
                </div>

                <div style={{ borderTop: '2px solid #EDF2F7', paddingTop: '20px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontWeight: '700' }}>Questions ({form.questions.length})</h4>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addQuestion}><Plus size={13} /> Add Question</button>
                  </div>
                  {form.questions.map((q, qi) => (
                    <div key={qi} style={{ background: '#F8FAFF', borderRadius: '12px', padding: '16px', marginBottom: '12px', border: '1px solid #EDF2F7' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: '#667eea' }}>Q{qi + 1}</span>
                        {form.questions.length > 1 && (
                          <button type="button" style={{ background: 'none', border: 'none', color: '#FC8181', cursor: 'pointer' }} onClick={() => removeQuestion(qi)}>Remove</button>
                        )}
                      </div>
                      <input className="form-input" style={{ marginBottom: '10px' }} placeholder="Question text" value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} required />
                      {q.options.map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi} onChange={() => updateQuestion(qi, 'correctAnswer', oi)} />
                          <input className="form-input" style={{ flex: 1 }} placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt} onChange={e => updateOption(qi, oi, e.target.value)} required />
                          {q.correctAnswer === oi && <span style={{ color: '#48BB78', fontSize: '12px', fontWeight: '700' }}>✓ Correct</span>}
                        </div>
                      ))}
                      <div style={{ marginTop: '8px' }}>
                        <label style={{ fontSize: '12px', color: '#A0AEC0' }}>Marks: </label>
                        <input type="number" style={{ width: '60px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #EDF2F7', fontSize: '13px' }} value={q.marks} onChange={e => updateQuestion(qi, 'marks', parseInt(e.target.value))} min={1} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Quiz'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
