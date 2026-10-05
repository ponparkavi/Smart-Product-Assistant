import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProductSummary, getProducts } from '../services/productApi';
import { getBookings } from '../services/serviceApi';
import { getDocuments } from '../services/documentApi';
import { Box, ShieldCheck, Wrench, FileText, Camera, ArrowRight, Activity, Plus, Tag, Calendar, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_products: 0,
    active_warranties: 0,
    expiring_warranties: 0,
    expired_warranties: 0,
    maintenance_due: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [summaryData, productList, bookingList, docList] = await Promise.all([
          getProductSummary(),
          getProducts(),
          getBookings(),
          getDocuments()
        ]);
        
        setStats(summaryData);
        setRecentProducts(productList.slice(0, 3));
        setRecentBookings(bookingList.slice(0, 3));
        setRecentDocs(docList.slice(0, 3));
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading dashboard...
      </div>
    );
  }

  // Derive Alerts
  const alerts = [];
  if (stats.expiring_warranties > 0) {
    alerts.push({ id: 1, type: 'warning', msg: `You have ${stats.expiring_warranties} product(s) with warranties expiring soon.` });
  }
  if (stats.maintenance_due > 0) {
    alerts.push({ id: 2, type: 'danger', msg: `${stats.maintenance_due} product(s) are overdue for scheduled maintenance.` });
  }
  const pendingBookings = recentBookings.filter(b => b.status === 'scheduled');
  if (pendingBookings.length > 0) {
    alerts.push({ id: 3, type: 'primary', msg: `You have ${pendingBookings.length} upcoming service appointment(s).` });
  }

  return (
    <div className="dashboard-page">
      <div className="welcome-banner">
        <div className="welcome-text">
          <h1>Welcome, {user?.full_name} 👋</h1>
          <p>Your unified command center for appliances, warranties, manuals, and predictive service.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/products/new" className="btn-primary">
            <Plus size={18} /> Register Product
          </Link>
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          {alerts.map(alert => (
            <div key={alert.id} style={{ 
              background: `var(--${alert.type}-light, rgba(255,255,255,0.05))`, 
              borderLeft: `4px solid var(--${alert.type})`,
              padding: '1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' 
            }}>
              <AlertCircle size={18} style={{ color: `var(--${alert.type})` }} />
              {alert.msg}
            </div>
          ))}
        </div>
      )}

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

        <div className="glass-card stat-card" onClick={() => navigate('/warranty')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span className="stat-label">Active Warranties</span>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.active_warranties}</div>
          <div className="stat-label" style={{ marginTop: '0.4rem' }}>Protected under coverage</div>
        </div>

        <div className="glass-card stat-card" onClick={() => navigate('/warranty')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span className="stat-label">Expiring Soon (30d)</span>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
              <Wrench size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.expiring_warranties}</div>
          <div className="stat-label" style={{ marginTop: '0.4rem' }}>Warranty expiry alerts</div>
        </div>

        <div className="glass-card stat-card" onClick={() => navigate('/service-history')} style={{ cursor: 'pointer' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Recent Products */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>Recent Appliances</h3>
            <Link to="/products" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem' }}>View All</Link>
          </div>
          {recentProducts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No products registered yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              {recentProducts.map(p => (
                <div key={p.id} onClick={() => navigate(`/products/${p.id}`)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.brand}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: p.remaining_days > 30 ? 'var(--success)' : 'var(--warning)', fontWeight: '600' }}>
                    {p.remaining_days > 0 ? `${p.remaining_days}d left` : 'Expired'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Service History / Bookings */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>Service & Maintenance</h3>
            <Link to="/service-history" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem' }}>View History</Link>
          </div>
          {recentBookings.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No service records found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              {recentBookings.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Wrench size={14} /> {b.service_type.toUpperCase()}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.service_center_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="status-chip" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', marginBottom: '0.2rem', display: 'inline-block' }}>
                      {b.status}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(b.scheduled_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Recent Documents */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>Knowledge Base (RAG)</h3>
            <Link to="/documents" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem' }}>View Vault</Link>
          </div>
          {recentDocs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No manuals or invoices uploaded.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              {recentDocs.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                  <FileText size={20} style={{ color: 'var(--primary)', marginRight: '1rem' }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.doc_type}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions Footer */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
        <Link to="/products/new" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Camera size={18} /> Upload Invoice (OCR)</Link>
        <Link to="/service-centers" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={18} /> Book Repair</Link>
        <Link to="/documents" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={18} /> Chat with Manuals (RAG)</Link>
      </div>

    </div>
  );
};

export default Dashboard;
