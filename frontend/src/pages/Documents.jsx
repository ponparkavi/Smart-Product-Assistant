import React, { useState, useEffect } from 'react';
import { getDocuments, uploadDocument, deleteDocument } from '../services/documentApi';
import { getProducts } from '../services/productApi';
import { FileText, Upload, Trash2, Download, AlertCircle, File, FileImage, Plus, MessageSquare } from 'lucide-react';
import DocumentChat from '../components/DocumentChat';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    document_type: 'manual',
    product_id: ''
  });
  const [file, setFile] = useState(null);

  // Chat state
  const [chatDoc, setChatDoc] = useState(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [docsData, prodsData] = await Promise.all([
        getDocuments(),
        getProducts()
      ]);
      setDocuments(docsData);
      setProducts(prodsData);
    } catch (err) {
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setUploadError('File exceeds 10MB limit.');
        return;
      }
      setFile(selected);
      setUploadError('');
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: selected.name.split('.')[0] }));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !formData.title) {
      setUploadError('Title and file are required.');
      return;
    }
    
    setUploading(true);
    setUploadError('');
    try {
      await uploadDocument(formData.title, formData.document_type, formData.product_id, file);
      setShowUpload(false);
      setFile(null);
      setFormData({ title: '', document_type: 'manual', product_id: '' });
      fetchInitialData(); // refresh list
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocument(docId);
      setDocuments(docs => docs.filter(d => d.id !== docId));
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  const getFileIcon = (contentType) => {
    if (contentType.includes('pdf')) return <FileText size={32} style={{ color: '#ef4444' }} />;
    if (contentType.includes('image')) return <FileImage size={32} style={{ color: '#3b82f6' }} />;
    return <File size={32} style={{ color: '#8b5cf6' }} />;
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className="dashboard-page">
      <div className="welcome-banner">
        <div>
          <h1>Document Vault 📄</h1>
          <p>Securely store and manage your appliance manuals, warranty cards, and receipts.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowUpload(!showUpload)}>
          <Plus size={18} /> Upload Document
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {showUpload && (
        <div className="glass-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <h3>Upload New Document</h3>
          {uploadError && <div className="alert alert-danger" style={{ marginTop: '1rem' }}><AlertCircle size={16}/> {uploadError}</div>}
          
          <form onSubmit={handleUpload} style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Document Title *</label>
              <input type="text" className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Samsung AC Manual" required />
            </div>
            
            <div className="form-group">
              <label>Document Type</label>
              <select className="form-control" value={formData.document_type} onChange={e => setFormData({...formData, document_type: e.target.value})} style={{ background: 'var(--bg-secondary)' }}>
                <option value="manual">User Manual</option>
                <option value="warranty_card">Warranty Card</option>
                <option value="invoice">Invoice / Receipt</option>
                <option value="other">Other Document</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Link to Product (Optional)</label>
              <select className="form-control" value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})} style={{ background: 'var(--bg-secondary)' }}>
                <option value="">-- No Product Associated --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Select File (PDF, JPG, PNG, WEBP)</label>
              <div style={{ border: '2px dashed var(--border-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={handleFileChange} id="doc-upload" style={{ display: 'none' }} />
                <label htmlFor="doc-upload" style={{ cursor: 'pointer', margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={32} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: '600' }}>{file ? file.name : 'Click to select file'}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Max size 10MB</span>
                </label>
              </div>
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Save Document'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => {setShowUpload(false); setFile(null);}} disabled={uploading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No Documents Found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Your vault is empty. Upload your first manual or receipt above.</p>
        </div>
      ) : (
        <div className="action-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {documents.map(doc => (
            <div key={doc.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  {getFileIcon(doc.content_type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 0.3rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</h4>
                  <span className="status-chip" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                    {doc.document_type.replace('_', ' ').toUpperCase()}
                  </span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                    {formatBytes(doc.size_bytes)} • {new Date(doc.uploaded_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {doc.product_id && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  Linked: <strong>{products.find(p => p.id === doc.product_id)?.name || 'Unknown Product'}</strong>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                <a href={`http://localhost:8000${doc.file_path}`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  <Download size={16} />
                </a>
                {doc.content_type === 'application/pdf' && (
                  <button className="btn-primary" onClick={() => setChatDoc(doc)} style={{ flex: 2, display: 'flex', justifyContent: 'center', background: 'var(--primary)', color: 'white', border: 'none' }}>
                    <MessageSquare size={16} /> Chat
                  </button>
                )}
                <button className="btn-secondary" onClick={() => handleDelete(doc.id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {chatDoc && (
        <DocumentChat document={chatDoc} onClose={() => setChatDoc(null)} />
      )}
    </div>
  );
};

export default Documents;
