import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkHealth } from '../services/authApi';
import { getProductSummary, getProducts } from '../services/productApi';
import { Box, ShieldCheck, Wrench, FileText, Camera, ArrowRight, Activity, Plus, Tag, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState({
    total_products: 0,
    active_warranties: 0,
    expiring_warranties: 0,
    expired_warranties: 0,
    maintenance_due: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [healthData, summaryData, productList] = await Promise.all([
          checkHealth(),
          getProductSummary(),
          getProducts()
        ]);
        setHealth(healthData);
        setStats(summaryData);
        setRecentProducts(productList.slice(0, 3));
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="welcome-banner">
        <div className="welcome-text">
          <h1>Hello, {user?.full_name} 👋</h1>
          <p>Manage your household appliances, invoices, AI fault diagnostics & warranty vault.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="status-chip">
            <span className="status-dot"></span>
            <span>Database: {health ? health.database : 'Connecting...'}</span>
          </div>
          <Link to="/products/new" className="btn-primary">
            <Plus size={18} /> Register Product
          </Link>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="stats-grid">
        <div className="glass-card stat-card" onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span className="stat-label">Total Products</span>
            <div className="stat-icon"><Box size={20} /></div>
          </div>
          <div className="stat-value">{stats.total_products}</div>
          <div className="stat-label" style={{ marginTop: '0.4rem' }}>Registered appliances in vault</div>
        </div>

        <div className="glass-card stat-card" onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span className="stat-label">Active Warranties</span>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.active_warranties}</div>
          <div className="stat-label" style={{ marginTop: '0.4rem' }}>Protected under coverage</div>
        </div>

        <div className="glass-card stat-card" onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span className="stat-label">Expiring Soon (30d)</span>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
              <Wrench size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.expiring_warranties}</div>
          <div className="stat-label" style={{ marginTop: '0.4rem' }}>Warranty expiry alerts</div>
        </div>

        <div className="glass-card stat-card" onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span className="stat-label">Maintenance Due</span>
            <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent)' }}>
              <Activity size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.maintenance_due}</div>
          <div className="stat-label" style={{ marginTop: '0.4rem' }}>Service reminders pending</div>
        </div>
      </div>

      {/* Recent Products Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.4rem' }}>Recent Appliances</h2>
          <Link to="/products" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            View All ({stats.total_products}) <ArrowRight size={16} />
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <Box size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.8rem' }} />
            <h3>No Products Registered Yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.5rem 0 1.25rem 0' }}>
              Add your first appliance to unlock warranty tracking, RAG manuals, and fault diagnosis.
            </p>
            <Link to="/products/new" className="btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>
              <Plus size={18} /> Register First Appliance
            </Link>
          </div>
        ) : (
          <div className="action-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {recentProducts.map(p => (
              <div key={p.id} className="glass-card" onClick={() => navigate(`/products/${p.id}`)} style={{ cursor: 'pointer', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="status-chip" style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)', color: 'var(--primary)', textTransform: 'capitalize' }}>
                    <Tag size={12} /> {p.category.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: p.remaining_days > 30 ? 'var(--success)' : 'var(--warning)', fontWeight: '600' }}>
                    {p.remaining_days > 0 ? `${p.remaining_days}d warranty left` : 'Expired'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.3rem' }}>{p.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.brand} {p.model_number && `• ${p.model_number}`}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Core System Modules */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>Core AI Modules</h2>
      <div className="action-grid">
        <div className="glass-card action-card">
          <div>
            <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}><FileText size={28} /></div>
            <h3>Invoice OCR Upload</h3>
            <p>Scan invoices to extract serial numbers, purchase dates, and register products automatically.</p>
          </div>
          <div className="arrow"><ArrowRight size={20} /></div>
        </div>

        <div className="glass-card action-card">
          <div>
            <div style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}><Camera size={28} /></div>
            <h3>CNN Fault Diagnosis</h3>
            <p>Upload an appliance photo to detect visible rust, cracks, surface wear, and physical damage.</p>
          </div>
          <div className="arrow"><ArrowRight size={20} /></div>
        </div>

        <div className="glass-card action-card">
          <div>
            <div style={{ color: 'var(--success)', marginBottom: '0.75rem' }}><ShieldCheck size={28} /></div>
            <h3>Manual RAG Assistant</h3>
            <p>Upload product manuals and query the AI assistant for error codes, cleaning tips & page sources.</p>
          </div>
          <div className="arrow"><ArrowRight size={20} /></div>
        </div>

        <div className="glass-card action-card">
          <div>
            <div style={{ color: 'var(--warning)', marginBottom: '0.75rem' }}><Wrench size={28} /></div>
            <h3>Predictive Maintenance</h3>
            <p>View automated service interval recommendations based on usage, age, and fault signals.</p>
          </div>
          <div className="arrow"><ArrowRight size={20} /></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
