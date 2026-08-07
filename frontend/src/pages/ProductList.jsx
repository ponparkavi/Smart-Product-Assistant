import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts } from '../services/productApi';
import { Plus, Search, ShieldCheck, ShieldAlert, ShieldX, Box, ArrowRight, Tag, Calendar, DollarSign } from 'lucide-react';

const CATEGORIES = [
  { label: 'All Categories', value: '' },
  { label: 'Refrigerator', value: 'refrigerator' },
  { label: 'Washing Machine', value: 'washing_machine' },
  { label: 'Air Conditioner', value: 'ac' },
  { label: 'Microwave', value: 'microwave' },
  { label: 'Television', value: 'tv' },
  { label: 'Water Purifier', value: 'water_purifier' },
  { label: 'Mixer / Grinder', value: 'mixer_grinder' },
  { label: 'Laptop', value: 'laptop' },
  { label: 'Other Electronics', value: 'other' }
];

const WARRANTY_STATUSES = [
  { label: 'All Statuses', value: '' },
  { label: 'Active Coverage', value: 'active' },
  { label: 'Expiring Soon (30d)', value: 'expiring_soon' },
  { label: 'Expired', value: 'expired' }
];

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(selectedCategory || null, selectedStatus || null);
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedStatus]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    (p.model_number && p.model_number.toLowerCase().includes(search.toLowerCase()))
  );

  const getWarrantyBadge = (status, days) => {
    if (status === 'active') {
      return (
        <span className="status-chip" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', color: 'var(--success)' }}>
          <ShieldCheck size={14} /> Active ({days}d remaining)
        </span>
      );
    } else if (status === 'expiring_soon') {
      return (
        <span className="status-chip" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--warning)' }}>
          <ShieldAlert size={14} /> Expiring Soon ({days}d remaining)
        </span>
      );
    } else {
      return (
        <span className="status-chip" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)' }}>
          <ShieldX size={14} /> Expired
        </span>
      );
    }
  };

  return (
    <div className="dashboard-page">
      <div className="welcome-banner">
        <div>
          <h1>My Appliance Vault 📦</h1>
          <p>Track, manage, and register household appliances across all brands.</p>
        </div>
        <Link to="/products/new" className="btn-primary">
          <Plus size={18} /> Register New Product
        </Link>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, brand, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ flex: '0 1 200px' }}>
          <select
            className="form-control"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ background: 'var(--bg-secondary)', cursor: 'pointer' }}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 1 200px' }}>
          <select
            className="form-control"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ background: 'var(--bg-secondary)', cursor: 'pointer' }}
          >
            {WARRANTY_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product List Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Box size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No Appliances Found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            {search || selectedCategory || selectedStatus ? 'No products match your search filters.' : 'You haven\'t added any household appliances yet.'}
          </p>
          <Link to="/products/new" className="btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>
            <Plus size={18} /> Add Your First Appliance
          </Link>
        </div>
      ) : (
        <div className="action-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="glass-card"
              onClick={() => navigate(`/products/${product.id}`)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span className="status-chip" style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)', color: 'var(--primary)', textTransform: 'capitalize' }}>
                    <Tag size={12} /> {product.category.replace('_', ' ')}
                  </span>
                  {getWarrantyBadge(product.warranty_status, product.remaining_days)}
                </div>

                {product.image_path ? (
                  <img
                    src={`http://localhost:8000${product.image_path}`}
                    alt={product.name}
                    style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '120px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--text-dim)' }}>
                    <Box size={36} />
                  </div>
                )}

                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.4rem' }}>{product.name}</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  <strong>{product.brand}</strong> {product.model_number && `• Model: ${product.model_number}`}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={14} /> Purchased: {product.purchase_date}
                </span>
                <span className="arrow" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '600' }}>
                  Manage <ArrowRight size={16} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
