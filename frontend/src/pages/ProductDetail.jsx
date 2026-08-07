import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById, deleteProduct, uploadProductImage } from '../services/productApi';
import { ArrowLeft, ShieldCheck, ShieldAlert, ShieldX, Calendar, Tag, DollarSign, FileText, Camera, Wrench, Trash2, Edit, Upload, Cpu, FileCheck } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const data = await getProductById(id);
      setProduct(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${product.name}? This will remove all associated files and warranty logs.`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteProduct(id);
      navigate('/products');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete product.');
      setDeleting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImg(true);
    try {
      const updated = await uploadProductImage(id, file);
      setProduct(updated);
    } catch (err) {
      alert('Failed to upload image.');
    } finally {
      setUploadingImg(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Loading product details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="dashboard-page">
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>Product Not Found</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>{error || 'The requested appliance does not exist.'}</p>
          <Link to="/products" className="btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>
            <ArrowLeft size={18} /> Back to Vault
          </Link>
        </div>
      </div>
    );
  }

  // Warranty progress calculation
  const totalWarrantyDays = product.warranty_period_months * 30.4375;
  const elapsedDays = Math.max(0, totalWarrantyDays - Math.max(0, product.remaining_days));
  const warrantyPercent = Math.min(100, Math.max(0, (elapsedDays / totalWarrantyDays) * 100));

  return (
    <div className="dashboard-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Products
        </Link>
        <button onClick={handleDelete} className="btn-secondary" disabled={deleting} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete Appliance'}
        </button>
      </div>

      {/* Main Grid: Details + Warranty Widget */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Card 1: Product Specifications & Image */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span className="status-chip" style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)', color: 'var(--primary)', textTransform: 'capitalize' }}>
              <Tag size={14} /> {product.category.replace('_', ' ')}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Brand: {product.brand}</span>
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1rem' }}>{product.name}</h1>

          <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {product.image_path ? (
              <img src={`http://localhost:8000${product.image_path}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                <Cpu size={48} style={{ opacity: 0.5 }} />
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>No photo uploaded</p>
              </div>
            )}
            
            <label style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(10, 14, 26, 0.85)', backdropFilter: 'blur(8px)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Upload size={14} />
              {uploadingImg ? 'Uploading...' : 'Change Photo'}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Model Number</span>
              <strong>{product.model_number || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Serial Number</span>
              <strong>{product.serial_number || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Purchase Date</span>
              <strong>{product.purchase_date}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Purchase Price</span>
              <strong>{product.purchase_price ? `$${product.purchase_price.toFixed(2)}` : 'N/A'}</strong>
            </div>
          </div>

          {product.usage_info && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Usage Notes</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{product.usage_info}</p>
            </div>
          )}
        </div>

        {/* Card 2: Warranty Status & Visual Meter */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Warranty Lifecycle</h3>
              {product.warranty_status === 'active' && (
                <span className="status-chip" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', color: 'var(--success)' }}>
                  <ShieldCheck size={16} /> Active Coverage
                </span>
              )}
              {product.warranty_status === 'expiring_soon' && (
                <span className="status-chip" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--warning)' }}>
                  <ShieldAlert size={16} /> Expiring Soon
                </span>
              )}
              {product.warranty_status === 'expired' && (
                <span className="status-chip" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)' }}>
                  <ShieldX size={16} /> Coverage Expired
                </span>
              )}
            </div>

            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '3rem', fontWeight: '800', color: product.remaining_days > 30 ? 'var(--success)' : product.remaining_days > 0 ? 'var(--warning)' : 'var(--danger)' }}>
                {Math.max(0, product.remaining_days)}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                {product.remaining_days > 0 ? 'Days Remaining in Warranty' : 'Days Since Expiration'}
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', marginTop: '1.5rem', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${100 - warrantyPercent}%`,
                    background: product.remaining_days > 30 ? 'linear-gradient(90deg, var(--accent), var(--success))' : 'var(--warning)',
                    borderRadius: '999px',
                    transition: 'width 0.5s ease'
                  }}
                ></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Warranty Start</span>
                <strong>{product.warranty_start_date}</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Warranty End</span>
                <strong>{product.warranty_end_date}</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Coverage Duration: <strong>{product.warranty_period_months} Months</strong></span>
          </div>
        </div>
      </div>

      {/* AI Assistance & Lifecycle Action Hub */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>Appliance AI Actions</h2>
      <div className="action-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div className="glass-card action-card">
          <div>
            <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}><FileText size={28} /></div>
            <h3>Upload Invoice OCR</h3>
            <p>Scan purchase receipt to extract serial numbers & warranty details.</p>
          </div>
          <button className="btn-secondary" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Scan Receipt</button>
        </div>

        <div className="glass-card action-card">
          <div>
            <div style={{ color: 'var(--success)', marginBottom: '0.75rem' }}><FileCheck size={28} /></div>
            <h3>Manual RAG Assistant</h3>
            <p>Upload PDF manual & ask AI about error codes, maintenance & cleaning.</p>
          </div>
          <button className="btn-secondary" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Ask Assistant</button>
        </div>

        <div className="glass-card action-card">
          <div>
            <div style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}><Camera size={28} /></div>
            <h3>CNN Fault Diagnosis</h3>
            <p>Analyze appliance photo for rust, cracks, and physical wear.</p>
          </div>
          <button className="btn-secondary" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Run Diagnosis</button>
        </div>

        <div className="glass-card action-card">
          <div>
            <div style={{ color: 'var(--warning)', marginBottom: '0.75rem' }}><Wrench size={28} /></div>
            <h3>Predictive Service</h3>
            <p>Check rule-based maintenance intervals and book local service.</p>
          </div>
          <button className="btn-secondary" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>View Schedule</button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
