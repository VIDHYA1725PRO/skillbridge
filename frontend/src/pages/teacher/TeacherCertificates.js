import React, { useState, useEffect } from 'react';
import { getStudentCertificates, verifyCertificate } from '../../utils/api';
import { format } from 'date-fns';
import { Award, CheckCircle, Clock, ExternalLink, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherCertificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getStudentCertificates().then(r => { setCerts(r.data); setLoading(false); });
  }, []);

  const handleVerify = async (id) => {
    const res = await verifyCertificate(id);
    setCerts(certs.map(c => c._id === id ? { ...c, isVerified: true, verifiedAt: res.data.verifiedAt } : c));
    toast.success('Certificate verified!');
  };

  const filtered = certs.filter(c => {
    const matchSearch = !search || c.student?.name?.toLowerCase().includes(search.toLowerCase()) || c.title?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'verified' ? c.isVerified : !c.isVerified);
    return matchSearch && matchFilter;
  });

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Student Certificates</h1>
        <p className="page-subtitle">{certs.length} certificates uploaded by students</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
          <Search size={18} />
          <input placeholder="Search certificates..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tab-bar" style={{ margin: 0 }}>
          {['all', 'pending', 'verified'].map(f => (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><Award size={48} /><h3>No certificates found</h3></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filtered.map(cert => (
            <div key={cert._id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ fontSize: '36px', lineHeight: 1 }}>🏆</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{cert.title}</h3>
                  <p style={{ fontSize: '13px', color: '#718096', marginBottom: '2px' }}>by {cert.issuer}</p>
                  {cert.course && <p style={{ fontSize: '12px', color: '#A0AEC0', marginBottom: '8px' }}>📚 {cert.course.title}</p>}
                </div>
              </div>

              <div style={{ marginTop: '16px', padding: '12px', background: '#F8FAFF', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#A8D8EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', overflow: 'hidden' }}>
                    {cert.student?.avatar ? <img src={cert.student.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : cert.student?.name?.[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{cert.student?.name}</div>
                    <div style={{ fontSize: '11px', color: '#A0AEC0' }}>{cert.student?.studentId || cert.student?.email}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  {cert.isVerified
                    ? <><CheckCircle size={14} color="#48BB78" /><span style={{ color: '#48BB78', fontWeight: '600' }}>Verified</span></>
                    : <><Clock size={14} color="#A0AEC0" /><span style={{ color: '#A0AEC0' }}>Pending verification</span></>
                  }
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    <ExternalLink size={13} /> View
                  </a>
                  {!cert.isVerified && (
                    <button className="btn btn-success btn-sm" onClick={() => handleVerify(cert._id)}>
                      <CheckCircle size={13} /> Verify
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
