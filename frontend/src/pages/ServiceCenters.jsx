import React, { useState, useEffect } from 'react';
import { getServiceCenters, createBooking } from '../services/serviceApi';
import { getProducts } from '../services/productApi';
import { MapPin, Phone, Mail, Calendar, CheckCircle, Search, Clock, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServiceCenters = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [bookingCenter, setBookingCenter] = useState(null);
  const [bookingForm, setBookingForm] = useState({ date: '', time: '', type: 'repair', desc: '' });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      setLoading(true);
      // Pass the product brand to simulate fetching brand-specific service centers
      getServiceCenters(selectedProduct.brand, 'Local City')
        .then(setCenters)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setCenters([]);
    }
  }, [selectedProduct]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !bookingCenter) return;
    
    setBookingLoading(true);
    try {
      const scheduledDate = new Date(`${bookingForm.date}T${bookingForm.time}:00Z`).toISOString();
      await createBooking({
        product_id: selectedProduct.id,
        service_center_id: bookingCenter.id,
        service_center_name: bookingCenter.name,
        service_type: bookingForm.type,
        scheduled_date: scheduledDate,
        description: bookingForm.desc
      });
      
      setSuccessMsg('Booking confirmed successfully!');
      setTimeout(() => {
        navigate('/service-history');
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to create booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="welcome-banner">
        <div>
          <h1>Service Centers & Booking 🏢</h1>
          <p>Find authorized centers and schedule maintenance or repairs instantly.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Left Sidebar: Product Selection */}
        <div className="glass-card" style={{ padding: '1.5rem', alignSelf: 'start' }}>
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Box size={20} /> Select Product
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Choose a product to find relevant authorized service centers.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {products.map(p => (
              <div 
                key={p.id} 
                onClick={() => { setSelectedProduct(p); setBookingCenter(null); setSuccessMsg(''); }}
                style={{ 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)', 
                  cursor: 'pointer',
                  border: `2px solid ${selectedProduct?.id === p.id ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: selectedProduct?.id === p.id ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.2rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.brand}</div>
              </div>
            ))}
            {products.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No products available.</div>}
          </div>
        </div>

        {/* Right Content: Centers & Booking Form */}
        <div>
          {!selectedProduct ? (
            <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Search size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <h3>Select a product first</h3>
              <p>We will fetch the nearest authorized service centers for your brand.</p>
            </div>
          ) : loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Searching service centers...</div>
          ) : !bookingCenter ? (
            <div>
              <h3 style={{ marginBottom: '1.5rem' }}>Authorized Centers for {selectedProduct.brand}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {centers.map(center => (
                  <div key={center.id} className="glass-card" style={{ padding: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>{center.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                      <MapPin size={16} /> {center.location}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                      <Phone size={16} /> {center.contact_number}
                    </div>
                    {center.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                        <Mail size={16} /> {center.email}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                      {center.available_services.map(svc => (
                        <span key={svc} className="status-chip" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {svc}
                        </span>
                      ))}
                    </div>
                    <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setBookingCenter(center)}>
                      <Calendar size={16} style={{ marginRight: '0.5rem' }}/> Book Appointment
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                * Displaying demo service centers as Google Maps API is not configured.
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Book Service</h3>
                <button className="btn-secondary" onClick={() => setBookingCenter(null)}>Back to Centers</button>
              </div>
              
              {successMsg ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '2rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <CheckCircle size={48} style={{ marginBottom: '1rem' }} />
                  <h4>{successMsg}</h4>
                  <p>Redirecting to your service history...</p>
                </div>
              ) : (
                <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Selected Center</div>
                    <div style={{ fontWeight: '600' }}>{bookingCenter.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{bookingCenter.location}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Date</label>
                      <input type="date" className="form-control" required value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Time</label>
                      <input type="time" className="form-control" required value={bookingForm.time} onChange={e => setBookingForm({...bookingForm, time: e.target.value})} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Service Type</label>
                    <select className="form-control" value={bookingForm.type} onChange={e => setBookingForm({...bookingForm, type: e.target.value})}>
                      {bookingCenter.available_services.map(svc => (
                        <option key={svc} value={svc}>{svc.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Issue Description / Notes</label>
                    <textarea className="form-control" rows="3" required value={bookingForm.desc} onChange={e => setBookingForm({...bookingForm, desc: e.target.value})} placeholder="Please describe the issue or maintenance required..."></textarea>
                  </div>

                  <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '0.8rem' }} disabled={bookingLoading}>
                    {bookingLoading ? 'Confirming...' : 'Confirm Booking'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCenters;
