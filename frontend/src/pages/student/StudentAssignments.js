import React, { useState, useEffect, useRef } from 'react';
import { getStudentAssignments, submitAssignment, downloadSubmission } from '../../utils/api';
import { format, isAfter, formatDistanceToNow } from 'date-fns';
import { Upload, CheckCircle, Clock, AlertCircle, FileText, Star, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [tab, setTab] = useState('pending');
  const [selectedFiles, setSelectedFiles] = useState({});
  const fileRefs = useRef({});

  useEffect(() => {
    getStudentAssignments().then(r => { setAssignments(r.data); setLoading(false); });
  }, []);

  const now = new Date();
  const pending = assignments.filter(a => !a.mySubmission && isAfter(new Date(a.deadline), now));
  const overdue = assignments.filter(a => !a.mySubmission && !isAfter(new Date(a.deadline), now));
  const submitted = assignments.filter(a => a.mySubmission);

  const handleFileSelect = (assignmentId, event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [assignmentId]: file.name }));
    }
  };

  const handleSubmit = async (assignmentId) => {
    const fileInput = fileRefs.current[assignmentId];
    if (!fileInput?.files?.length) { toast.error('Please select a file'); return; }
    setSubmitting(assignmentId);
    try {
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      await submitAssignment(assignmentId, formData);
      toast.success('Assignment submitted!');
      const r = await getStudentAssignments();
      setAssignments(r.data);
      setSelectedFiles(prev => ({ ...prev, [assignmentId]: null }));
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Submission failed';
      toast.error(message);
    } finally {
      setSubmitting(null);
    }
  };

  const handleDownloadSubmission = async (assignmentId) => {
    try {
      const user = JSON.parse(localStorage.getItem('sb_user'));
      if (!user?._id) { toast.error('User not found'); return; }
      const response = await downloadSubmission(assignmentId, user._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `submission-${assignmentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download submission');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const tabs = [
    { id: 'pending', label: `Pending (${pending.length})` },
    { id: 'overdue', label: `Overdue (${overdue.length})` },
    { id: 'submitted', label: `Submitted (${submitted.length})` },
  ];

  const currentList = tab === 'pending' ? pending : tab === 'overdue' ? overdue : submitted;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Assignments</h1>
        <p className="page-subtitle">{assignments.length} total assignments</p>
      </div>

      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {currentList.length === 0 ? (
        <div className="empty-state"><FileText size={48} /><h3>No assignments here</h3></div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
          {currentList.map(a => {
            const isOverdue = !isAfter(new Date(a.deadline), now);
            return (
              <div key={a._id} className="card" style={{padding:'24px'}}>
                <div style={s.assignHeader}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px'}}>
                      <h3 style={s.assignTitle}>{a.title}</h3>
                      {a.mySubmission?.status === 'graded' && (
                        <span className="badge badge-green"><Star size={12} /> {a.mySubmission.grade}/{a.maxMarks}</span>
                      )}
                      {a.mySubmission && a.mySubmission.status !== 'graded' && (
                        <span className="badge badge-blue"><CheckCircle size={12} /> Submitted</span>
                      )}
                      {!a.mySubmission && isOverdue && <span className="badge badge-red"><AlertCircle size={12} /> Overdue</span>}
                    </div>
                    <p style={s.assignDesc}>{a.description}</p>
                    <p style={{...s.assignDesc, fontStyle: 'italic', color: '#D69E2E'}}>📄 Submissions must be in PDF format only.</p>
                    <div style={s.assignMeta}>
                      <span style={{...s.metaChip, background: a.course?.color || '#A8D8EA'}}>
                        📚 {a.course?.title}
                      </span>
                      <span style={s.metaChip}>
                        {isOverdue && !a.mySubmission
                          ? <><AlertCircle size={12} color="#FC8181" /> Overdue by {formatDistanceToNow(new Date(a.deadline))}</>
                          : <><Clock size={12} /> Due {format(new Date(a.deadline), 'MMM d, yyyy h:mm a')}</>
                        }
                      </span>
                      <span style={s.metaChip}>Max: {a.maxMarks} marks</span>
                    </div>
                    {a.mySubmission?.feedback && (
                      <div style={s.feedback}>
                        <strong>Feedback:</strong> {a.mySubmission.feedback}
                      </div>
                    )}
                  </div>
                  {!a.mySubmission && (
                    <div style={s.submitArea}>
                      <input type="file" ref={el => fileRefs.current[a._id] = el} style={{display:'none'}}
                        accept=".pdf" id={`file-${a._id}`} onChange={(e) => handleFileSelect(a._id, e)} />
                      <label htmlFor={`file-${a._id}`} style={s.fileLabel}>
                        <Upload size={14} /> {selectedFiles[a._id] ? selectedFiles[a._id] : 'Choose PDF File'}
                      </label>
                      <button className="btn btn-primary btn-sm" onClick={() => handleSubmit(a._id)}
                        disabled={submitting === a._id}>
                        {submitting === a._id ? 'Uploading...' : 'Submit'}
                      </button>
                    </div>
                  )}
                  {a.mySubmission && (
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                      <div style={s.submittedInfo}>
                        <CheckCircle size={20} color="#48BB78" />
                        <div>
                          <div style={{fontWeight:'600', fontSize:'13px', color:'#276749'}}>Submitted</div>
                          <div style={{fontSize:'12px', color:'#A0AEC0'}}>{format(new Date(a.mySubmission.submittedAt), 'MMM d, h:mm a')}</div>
                        </div>
                      </div>
                      <button className="btn btn-outline btn-sm" onClick={() => handleDownloadSubmission(a._id)}
                        title="Download your submission">
                        <Download size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  assignHeader: { display:'flex', gap:'20px', alignItems:'flex-start', flexWrap:'wrap' },
  assignTitle: { fontFamily:'Sora, sans-serif', fontSize:'17px', fontWeight:'700' },
  assignDesc: { fontSize:'14px', color:'#718096', margin:'6px 0 12px' },
  assignMeta: { display:'flex', gap:'8px', flexWrap:'wrap' },
  metaChip: { display:'inline-flex', alignItems:'center', gap:'4px', background:'#F8FAFF', padding:'4px 10px', borderRadius:'8px', fontSize:'12px', color:'#718096', border:'1px solid #EDF2F7' },
  submitArea: { display:'flex', flexDirection:'column', gap:'8px', alignItems:'center', minWidth:'120px' },
  fileLabel: { display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 14px', background:'#F8FAFF', border:'2px dashed #CBD5E0', borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer', color:'#718096', textAlign:'center' },
  submittedInfo: { display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', background:'#F0FFF4', borderRadius:'12px', minWidth:'120px' },
  feedback: { marginTop:'12px', padding:'12px', background:'#FEFCBF', borderRadius:'10px', fontSize:'13px', color:'#975A16' },
};
