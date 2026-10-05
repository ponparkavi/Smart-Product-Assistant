import React, { useState, useEffect, useRef } from 'react';
import { getDocuments } from '../services/documentApi';
import { indexDocument, chatWithDocument } from '../services/ragApi';
import { MessageSquare, Send, Cpu, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const Assistant = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(true);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  
  const [indexing, setIndexing] = useState(false);
  const [indexSuccess, setIndexSuccess] = useState('');
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await getDocuments();
        // Only allow PDFs for RAG
        setDocuments(docs.filter(d => d.content_type === 'application/pdf'));
      } catch (err) {
        setError('Failed to load documents.');
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchDocs();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleIndex = async () => {
    if (!selectedDoc) return;
    setIndexing(true);
    setError('');
    setIndexSuccess('');
    try {
      await indexDocument(selectedDoc);
      setIndexSuccess('Document successfully indexed for AI search!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to index document.');
    } finally {
      setIndexing(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedDoc) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAsking(true);
    setError('');
    
    try {
      const data = await chatWithDocument(selectedDoc, userMsg.content);
      const aiMsg = { 
        role: 'ai', 
        content: data.answer,
        sources: data.sources 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. The document might not be indexed or the API failed.', isError: true }]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="dashboard-page" style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      <div className="welcome-banner" style={{ flexShrink: 0, marginBottom: '1rem' }}>
        <div>
          <h1>AI Manual Assistant 🤖</h1>
          <p>Chat directly with your product manuals to troubleshoot faults or learn features.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        {/* Left Sidebar: Document Selection */}
        <div className="glass-card" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> Select Manual
          </h3>
          
          {loadingDocs ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading manuals...</p>
          ) : documents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No PDF manuals found in your Document Vault.</p>
          ) : (
            <>
              <select 
                className="form-control" 
                value={selectedDoc} 
                onChange={(e) => { setSelectedDoc(e.target.value); setMessages([]); setIndexSuccess(''); }}
                style={{ background: 'var(--bg-secondary)', marginBottom: '1rem' }}
              >
                <option value="">-- Choose a PDF Manual --</option>
                {documents.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.title}</option>
                ))}
              </select>

              {selectedDoc && (
                <button 
                  className="btn-secondary" 
                  onClick={handleIndex} 
                  disabled={indexing}
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Cpu size={16} /> {indexing ? 'Indexing...' : 'Prepare / Index Manual'}
                </button>
              )}
              
              {indexSuccess && (
                <div style={{ marginTop: '1rem', color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                  <CheckCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{indexSuccess}</span>
                </div>
              )}
              {error && (
                <div style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Area: Chat Interface */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
              Chat
            </h3>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Cpu size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Select a manual and start asking questions.</p>
                <p style={{ fontSize: '0.85rem' }}>e.g. "How do I clean the filter?" or "What does error code E4 mean?"</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} style={{ 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: msg.role === 'user' ? '#fff' : (msg.isError ? 'var(--danger)' : 'var(--text-color)'),
                  padding: '1rem',
                  borderRadius: '1rem',
                  borderBottomRightRadius: msg.role === 'user' ? '0' : '1rem',
                  borderBottomLeftRadius: msg.role === 'ai' ? '0' : '1rem',
                }}>
                  <div style={{ lineHeight: '1.5' }}>{msg.content}</div>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem' }}>
                      <strong style={{ opacity: 0.8 }}>Sources:</strong>
                      <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', opacity: 0.7 }}>
                        {msg.sources.map((src, i) => (
                          <li key={i}>Page {src.metadata?.page !== undefined ? src.metadata.page + 1 : 'N/A'}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
            {asking && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '1rem', borderBottomLeftRadius: 0 }}>
                <span className="dot-flashing"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder={selectedDoc ? "Ask a question about the manual..." : "Select a manual first to ask questions."} 
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={!selectedDoc || asking}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-primary" disabled={!selectedDoc || !input.trim() || asking}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
