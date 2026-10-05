import React, { useState, useEffect, useRef } from 'react';
import { chatWithDocument, indexDocument } from '../services/ragApi';
import { MessageSquare, Send, X, Loader, Database, FileText } from 'lucide-react';

const DocumentChat = ({ document, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'system', content: `Hello! I am ready to answer questions about "${document.title}".` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleIndex = async () => {
    setIndexing(true);
    setError('');
    try {
      await indexDocument(document.id);
      setMessages(prev => [...prev, { role: 'system', content: 'Document indexing complete! You can now ask questions.' }]);
    } catch (err) {
      setError('Failed to index document. It may already be indexed or not support text extraction.');
    } finally {
      setIndexing(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    setError('');

    try {
      const response = await chatWithDocument(document.id, userMsg);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: response.answer,
          sources: response.sources
        }
      ]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get answer. Please try again or index the document first.');
      if (err.response?.status === 400 || err.response?.status === 404) {
         setMessages(prev => [...prev, { role: 'system', content: 'It seems the document is not indexed. Try clicking "Index Document" first.' }]);
      }
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
        maxWidth: '600px',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
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
            <MessageSquare size={20} />
            Chat: {document.title}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={handleIndex} disabled={indexing || loading} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>
              {indexing ? <Loader size={14} className="spin" /> : <Database size={14} />} 
              {indexing ? ' Indexing...' : ' Index Document'}
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {error && (
            <div className="alert alert-danger" style={{ padding: '0.5rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: msg.role === 'user' ? 'var(--primary)' : msg.role === 'system' ? 'var(--bg-secondary)' : 'rgba(255,255,255,0.05)',
              padding: '1rem',
              borderRadius: '12px',
              borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
              borderBottomLeftRadius: msg.role !== 'user' ? '4px' : '12px',
            }}>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.content}</div>
              
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={12} /> Sources:
                  </div>
                  {msg.sources.map((source, i) => (
                    <div key={i} style={{ 
                      fontSize: '0.8rem', 
                      background: 'rgba(0,0,0,0.2)', 
                      padding: '0.5rem', 
                      borderRadius: '4px',
                      marginBottom: '0.25rem',
                      color: 'var(--text-dim)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                       <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>Page {source.metadata.page || '?'}: </span>
                       {source.page_content}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
              <Loader size={18} className="spin" /> Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0,0,0,0.1)'
        }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question about this document..."
              className="form-control"
              style={{ flex: 1 }}
              disabled={loading}
            />
            <button type="submit" className="btn-primary" disabled={!input.trim() || loading} style={{ padding: '0 1.25rem' }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentChat;
