import React, { useState, useEffect } from 'react';
import { getBookings, cancelBooking } from '../services/serviceApi';
import { getProducts } from '../services/productApi';
import { History, Calendar, MapPin, XCircle, Wrench, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ServiceHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [books, prods] = await Promise.all([getBookings(), getProducts()]);
        const pMap = {};
        prods.forEach(p => pMap[p.id] = p);
        setProductsMap(pMap);
        setBookings(books);
      } catch (err) {
        setError('Failed to load service history.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      await cancelBooking(bookingId);
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel booking.');
    }
  };

  const getStatusChip = (status) => {
    if (status === 'scheduled') return <span className="status-chip" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', borderColor: 'rgba(99, 102, 241, 0.4)' }}><Calendar size={14} /> Scheduled</span>;
    if (status === 'completed') return <span className="status-chip" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.4)' }}><CheckCircle size={14} /> Completed</span>;
    if (status === 'cancelled') return <span className="status-chip" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}><XCircle size={14} /> Cancelled</span>;
    return null;
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading service history...</div>;

  return (
    <div className="dashboard-page">
      <div className="welcome-banner">
        <div>
          <h1>Service History 📅</h1>
          <p>Review your past maintenance records and manage upcoming service appointments.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {bookings.map(b => {
          const product = productsMap[b.product_id];
          const scheduledDate = new Date(b.scheduled_date);
          
          return (
            <div key={b.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wrench size={20} /> {b.service_type.toUpperCase()}
                  </h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <strong>Product:</strong> {product ? <Link to={`/products/${product.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{product.name}</Link> : 'Unknown Product'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} /> {b.service_center_name}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  {getStatusChip(b.status)}
                  <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                    {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  {b.cost > 0 && <div style={{ color: 'var(--success)', fontWeight: '500' }}>Cost: ${b.cost.toFixed(2)}</div>}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                <strong>Issue Description:</strong>
                <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-dim)', lineHeight: '1.5' }}>{b.description}</p>
              </div>

              {b.status === 'scheduled' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button className="btn-secondary" onClick={() => handleCancel(b.id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }}>
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {bookings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
            <History size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3>No Service History</h3>
            <p>You haven't booked any services yet.</p>
            <Link to="/service-centers" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1rem' }}>Book a Service</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceHistory;
