import React, { useState } from 'react';
import { FileText, Send, X, Copy, Check, Info, ShieldCheck, FileEdit } from 'lucide-react';
import api from '../services/api';

const ClaimAssistant = ({ product, onClose }) => {
  const [issue, setIssue] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [verifiedFacts, setVerifiedFacts] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  
  const isExpired = product.warranty_status === 'expired';

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!issue.trim()) {
      setError('Please describe the issue.');
      return;
    }
    
    setLoading(true);
    setError('');
    setDraft('');
    setVerifiedFacts(null);

    try {
      const response = await api.post('/claims/generate-draft', {
        product_id: product.id,
        issue_description: issue
      });
      setDraft(response.data.draft_text);
      setVerifiedFacts(response.data.verified_facts);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate draft.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        width: '95%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
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
            <FileText size={20} />
            Warranty Claim Assistant: {product.name}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', flex: 1 }}>
          {isExpired && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
              <strong>Notice:</strong> This product's warranty has expired. You may still generate a claim draft, but repair costs will likely apply unless you have an extended service plan.
            </div>
          )}

          {!draft && !loading && (
            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label>Describe the issue you are experiencing with your {product.name}:</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="E.g., The compressor makes a loud grinding noise and the cooling has dropped significantly..."
                  required
                ></textarea>
              </div>
              
              {error && <div className="alert alert-danger" style={{ marginTop: '1rem' }}>{error}</div>}
              
              <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }} disabled={loading || !issue.trim()}>
                Generate Claim Draft
              </button>
            </form>
          )}

          {loading && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Synthesizing your issue with verified product data...
            </div>
          )}

          {draft && !loading && (
            <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'row', flexWrap: 'wrap' }}>
              {/* Verified Facts Sidebar */}
              <div style={{ flex: '1 1 250px', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', alignSelf: 'flex-start' }}>
                <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)' }}>
                  <ShieldCheck size={16} /> Verified Facts Included
                </h4>
                {verifiedFacts && Object.entries(verifiedFacts).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>{key}</span>
                    <strong style={{ color: 'var(--text-main)' }}>{value}</strong>
                  </div>
                ))}
              </div>

              {/* Editable Draft Area */}
              <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileEdit size={16} /> Generated Draft
                  </h4>
                  <button onClick={copyToClipboard} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                
                <textarea
                  className="form-control"
                  style={{ flex: 1, minHeight: '300px', fontFamily: 'inherit', lineHeight: '1.5', resize: 'vertical' }}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                ></textarea>

                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '4px', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    Review and edit the draft above. <strong>We do not automatically submit claims on your behalf.</strong> You should copy this draft and email it directly to the manufacturer's support address.
                  </span>
                </div>
                
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                   <button className="btn-secondary" onClick={() => { setDraft(''); setIssue(''); }}>Start Over</button>
                   <button className="btn-primary" onClick={onClose}>Done</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimAssistant;
