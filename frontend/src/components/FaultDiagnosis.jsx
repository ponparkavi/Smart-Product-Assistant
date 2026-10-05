import React, { useState } from 'react';
import { Camera, AlertTriangle, CheckCircle, Upload, X, ShieldAlert } from 'lucide-react';
import api from '../services/api';

const FaultDiagnosis = ({ product, onClose }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select an image first.');
      return;
    }

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/fault/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data.result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-card" style={{
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={20} />
            CNN Fault Diagnosis
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Upload a clear photo of the appliance defect (e.g., rust, cracks, dents, water damage) for AI analysis.
          </p>

          <div style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: preview ? '0.5rem' : '2rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
            position: 'relative',
            background: 'rgba(255,255,255,0.02)'
          }}>
            {preview ? (
              <div style={{ position: 'relative' }}>
                <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: '4px' }} />
                <label style={{
                  position: 'absolute',
                  top: '10px', right: '10px',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <Upload size={14} /> Change
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              </div>
            ) : (
              <>
                <input type="file" id="fault-upload" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                <label htmlFor="fault-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={32} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: '600' }}>Click to select photo</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>JPG, PNG, WEBP</span>
                </label>
              </>
            )}
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {!result ? (
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.75rem', display: 'flex', justifyContent: 'center' }}
              onClick={handleAnalyze}
              disabled={!file || loading}
            >
              {loading ? 'Analyzing...' : 'Run Diagnosis'}
            </button>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${result.is_uncertain ? 'var(--warning)' : 'var(--primary)'}`
            }}>
              <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {result.is_uncertain ? (
                  <><AlertTriangle size={18} style={{ color: 'var(--warning)' }} /> Analysis Result</>
                ) : (
                  <><CheckCircle size={18} style={{ color: 'var(--primary)' }} /> Analysis Result</>
                )}
              </h4>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Predicted Fault:</span>
                <strong style={{ fontSize: '1.1rem', color: result.is_uncertain ? 'var(--warning)' : 'white' }}>
                  {result.predicted_class}
                </strong>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Confidence:</span>
                <strong>{result.confidence}%</strong>
              </div>

              {result.limitation && (
                <div style={{ 
                  background: 'rgba(245, 158, 11, 0.1)', 
                  padding: '0.75rem', 
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  color: 'var(--warning)',
                  borderLeft: '3px solid var(--warning)',
                  marginBottom: '1rem'
                }}>
                  {result.limitation}
                </div>
              )}

              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                padding: '0.75rem', 
                borderRadius: '4px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <ShieldAlert size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                <span>
                  <strong>IMPORTANT:</strong> AI prediction is an aid and not a professional diagnosis. 
                  Always consult a certified technician for actual repairs.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaultDiagnosis;
