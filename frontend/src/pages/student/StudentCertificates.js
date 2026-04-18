import React, { useState, useEffect, useRef } from 'react';
import { getMyCertificates, uploadCertificate } from '../../utils/api';
import { format } from 'date-fns';
import { Award, Upload, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentCertificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', issuer: '' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    getMyCertificates().then(r => { setCerts(r.data); setLoading(false); });
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileRef.current?.files?.length) { toast.error('Please select a file'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileRef.current.files[0]);
      formData.append('title', form.title);
      formData.append('issuer', form.issuer);
      const res = await uploadCertificate(formData);
      setCerts([res.data, ...certs]);
      setShowForm(false);
      setForm({ title: '', issuer: '' });
      toast.success('Certificate uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">My Certificates</h1>
          <p className="page-subtitle">{certs.length} certificates uploaded</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Upload size={16} /> Upload Certificate
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Upload Certificate</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }} onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpload}>
                <div className="form-group">
                  <label className="form-label">Certificate Title *</label>
                  <input className="form-input" placeholder="e.g. AWS Cloud Practitioner" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Issuing Organization *</label>
                  <input className="form-input" placeholder="e.g. Amazon Web Services" value={form.issuer}
                    onChange={e => setForm({ ...form, issuer: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Certificate File (PDF/Image) *</label>
                  <input type="file" ref={fileRef} accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} id="cert-file" />
                  <label htmlFor="cert-file" style={styles.fileLabel}>
                    <Upload size={18} /> Click to select file
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {certs.length === 0 ? (
        <div className="empty-state">
          <Award size={48} />
          <h3>No certificates yet</h3>
          <p>Upload your certificates to showcase your achievements</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {certs.map(cert => (
            <div key={cert._id} className="card" style={{ padding: '24px' }}>
              <div style={styles.certIcon}>🏆</div>
              <h3 style={styles.certTitle}>{cert.title}</h3>
              <p style={styles.certIssuer}>by {cert.issuer}</p>
              {cert.course && <p style={styles.certCourse}>📚 {cert.course.title}</p>}
              <div style={styles.certFooter}>
                <span style={{ fontSize: '12px', color: '#A0AEC0' }}>
                  {format(new Date(cert.uploadedAt), 'MMM d, yyyy')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {cert.isVerified
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#48BB78', fontSize: '13px', fontWeight: '600' }}><CheckCircle size={14} /> Verified</span>
                    : <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#A0AEC0', fontSize: '13px' }}><Clock size={14} /> Pending</span>
                  }
                  <a href={cert.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#667eea' }}>
                    <ExternalLink size={14} />
                  </a>
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
  fileLabel: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '20px', border: '2px dashed #CBD5E0', borderRadius: '12px', cursor: 'pointer', color: '#718096', fontSize: '14px', fontWeight: '600', background: '#F8FAFF' },
  certIcon: { fontSize: '36px', marginBottom: '12px' },
  certTitle: { fontFamily: 'Sora, sans-serif', fontSize: '16px', fontWeight: '700', marginBottom: '4px' },
  certIssuer: { fontSize: '13px', color: '#718096', marginBottom: '4px' },
  certCourse: { fontSize: '12px', color: '#A0AEC0', marginBottom: '16px' },
  certFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #EDF2F7' },
};
