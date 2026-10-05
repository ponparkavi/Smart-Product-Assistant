import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/productApi';
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Clock, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import ClaimAssistant from '../components/ClaimAssistant';

const Warranty = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimProduct, setClaimProduct] = useState(null);

  useEffect(() => {
    const fetchWarranties = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        setError('Failed to load warranty data.');
      } finally {
        setLoading(false);
      }
    };
    fetchWarranties();
  }, []);

  const getStatusChip = (status) => {
    if (status === 'active') return <span className="status-chip" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.4)' }}><ShieldCheck size={14} /> Active</span>;
    if (status === 'expiring_soon') return <span className="status-chip" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.4)' }}><ShieldAlert size={14} /> Expiring Soon</span>;
    return <span className="status-chip" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}><ShieldX size={14} /> Expired</span>;
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading warranty data...</div>;

  return (
    <div className="dashboard-page">
      <div className="welcome-banner">
        <div>
          <h1>Warranty Hub 🛡️</h1>
          <p>Track coverage, manage expirations, and generate claim drafts effortlessly.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {products.map(p => (
          <div key={p.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 0.3rem 0' }}>{p.name}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.brand} • {p.category.replace('_', ' ').toUpperCase()}</span>
              </div>
              {getStatusChip(p.warranty_status)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Purchased</span>
                <strong style={{ fontSize: '0.9rem' }}>{new Date(p.purchase_date).toLocaleDateString()}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Coverage Ends</span>
                <strong style={{ fontSize: '0.9rem' }}>{new Date(p.warranty_end_date).toLocaleDateString()}</strong>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.5rem', color: p.remaining_days > 30 ? 'var(--success)' : p.remaining_days > 0 ? 'var(--warning)' : 'var(--danger)' }}>
                <Clock size={16} />
                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                  {Math.max(0, p.remaining_days)} Days Remaining
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Link to={`/products/${p.id}`} className="btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>
                View Details
              </Link>
              <button className="btn-primary" onClick={() => setClaimProduct(p)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem', background: p.warranty_status === 'expired' ? 'var(--text-muted)' : 'var(--primary)', borderColor: p.warranty_status === 'expired' ? 'var(--text-muted)' : 'var(--primary)' }}>
                <FileText size={16} /> Draft Claim
              </button>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
            No products found. Add products to track their warranties.
          </div>
        )}
      </div>

      {claimProduct && (
        <ClaimAssistant product={claimProduct} onClose={() => setClaimProduct(null)} />
      )}
    </div>
  );
};

export default Warranty;
