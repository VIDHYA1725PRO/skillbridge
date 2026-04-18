import React, { useState, useEffect } from 'react';
import { getTeacherAssignments, createAssignment, gradeAssignment, deleteAssignment, getTeacherCourses } from '../../utils/api';
import { format } from 'date-fns';
import { Plus, Trash2, FileText, Star, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [gradeForm, setGradeForm] = useState({});
  const [form, setForm] = useState({ title: '', description: '', course: '', deadline: '', maxMarks: 100 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [assignmentsRes, coursesRes] = await Promise.all([
        getTeacherAssignments(),
        getTeacherCourses(),
      ]);
      setAssignments(assignmentsRes.data);
      setCourses(coursesRes.data);
      const expandedState = assignmentsRes.data.reduce((acc, assignment) => {
        if ((assignment.submissions?.length || 0) > 0) acc[assignment._id] = true;
        return acc;
      }, {});
      setExpanded(expandedState);
    };
    load().finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createAssignment(form);
      setAssignments([res.data, ...assignments]);
      setShowModal(false);
      setForm({ title: '', description: '', course: '', deadline: '', maxMarks: 100 });
      toast.success('Assignment created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleGrade = async (assignmentId, studentId) => {
    const key = `${assignmentId}-${studentId}`;
    const g = gradeForm[key];
    if (!g?.grade) { toast.error('Enter a grade'); return; }
    try {
      await gradeAssignment(assignmentId, studentId, { grade: g.grade, feedback: g.feedback || '' });
      toast.success('Graded!');
      const r = await getTeacherAssignments();
      setAssignments(r.data);
    } catch (err) {
      toast.error('Grading failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    await deleteAssignment(id);
    setAssignments(assignments.filter(a => a._id !== id));
    toast.success('Deleted');
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Assignments</h1>
          <p className="page-subtitle">{assignments.length} assignments created</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Assignment</button>
      </div>

      {assignments.length === 0
        ? <div className="empty-state"><FileText size={48} /><h3>No assignments yet</h3><p>Create your first assignment</p></div>
        : assignments.map(a => {
          const ungraded = a.submissions?.filter(s => s.status === 'submitted').length || 0;
          return (
            <div key={a._id} className="card" style={{ marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                onClick={() => setExpanded(prev => ({ ...prev, [a._id]: !prev[a._id] }))}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '16px', fontWeight: '700' }}>{a.title}</h3>
                    {ungraded > 0 && <span className="badge badge-yellow">⏳ {ungraded} to grade</span>}
                    <span className="badge badge-blue">{a.submissions?.length || 0} submitted</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#718096' }}>
                    <span>📚 {a.course?.title}</span>
                    <span>📅 Due: {format(new Date(a.deadline), 'MMM d, yyyy')}</span>
                    <span>⭐ Max: {a.maxMarks}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDelete(a._id); }}>
                    <Trash2 size={13} />
                  </button>
                  {expanded[a._id] ? <ChevronUp size={18} color="#A0AEC0" /> : <ChevronDown size={18} color="#A0AEC0" />}
                </div>
              </div>

              {expanded[a._id] && (
                <div style={{ borderTop: '1px solid #EDF2F7' }}>
                  <p style={{ padding: '16px 24px', fontSize: '14px', color: '#718096', background: '#F8FAFF' }}>{a.description}</p>
                  {a.submissions?.length === 0
                    ? <p style={{ padding: '16px 24px', color: '#A0AEC0', fontSize: '14px' }}>No submissions yet</p>
                    : (
                      <div style={{ padding: '16px 24px' }}>
                        <h4 style={{ fontWeight: '700', marginBottom: '12px', fontSize: '14px' }}>Submissions ({a.submissions.length})</h4>
                        <div className="table-container">
                          <table>
                            <thead><tr><th>Student</th><th>File</th><th>Submitted</th><th>Status</th><th>Grade/Feedback</th><th>Action</th></tr></thead>
                            <tbody>
                              {a.submissions.map(sub => {
                                const key = `${a._id}-${sub.student?._id}`;
                                return (
                                  <tr key={sub.student?._id}>
                                    <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#B5EAD7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>
                                          {sub.student?.name?.[0]}
                                        </div>
                                        <div>
                                          <div style={{ fontWeight: '600', fontSize: '13px' }}>{sub.student?.name}</div>
                                          <div style={{ fontSize: '11px', color: '#A0AEC0' }}>{sub.student?.studentId}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      {sub.fileUrl ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <a href={sub.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#667eea', fontSize: '13px' }}>
                                            <ExternalLink size={13} /> {sub.fileName || 'View PDF'}
                                          </a>
                                          <a href={sub.fileUrl} download style={{ fontSize: '12px', color: '#4A5568' }}>
                                            Download
                                          </a>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: '13px', color: '#A0AEC0' }}>No file attached</span>
                                      )}
                                    </td>
                                    <td style={{ fontSize: '13px', color: '#718096' }}>{format(new Date(sub.submittedAt), 'MMM d, h:mm a')}</td>
                                    <td><span className={`badge ${sub.status === 'graded' ? 'badge-green' : sub.status === 'late' ? 'badge-red' : 'badge-yellow'}`}>{sub.status}</span></td>
                                    <td>
                                      {sub.status === 'graded'
                                        ? <div style={{ fontSize: '13px' }}><Star size={12} color="#ED8936" /> {sub.grade}/{a.maxMarks}<br /><span style={{ color: '#A0AEC0' }}>{sub.feedback}</span></div>
                                        : (
                                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <input type="number" placeholder="Grade" max={a.maxMarks} style={{ width: '70px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #EDF2F7', fontSize: '13px' }}
                                              value={gradeForm[key]?.grade || ''} onChange={e => setGradeForm(prev => ({ ...prev, [key]: { ...prev[key], grade: e.target.value } }))} />
                                            <input placeholder="Feedback" style={{ width: '120px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #EDF2F7', fontSize: '13px' }}
                                              value={gradeForm[key]?.feedback || ''} onChange={e => setGradeForm(prev => ({ ...prev, [key]: { ...prev[key], feedback: e.target.value } }))} />
                                          </div>
                                        )
                                      }
                                    </td>
                                    <td>
                                      {sub.status !== 'graded' && (
                                        <button className="btn btn-success btn-sm" onClick={() => handleGrade(a._id, sub.student?._id)}>
                                          <Star size={12} /> Grade
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Assignment</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#A0AEC0' }} onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Assignment title" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="Instructions for students" style={{ resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <select className="form-input" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} required>
                    <option value="">Select course...</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Deadline *</label>
                    <input className="form-input" type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Marks</label>
                    <input className="form-input" type="number" value={form.maxMarks} onChange={e => setForm({ ...form, maxMarks: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
