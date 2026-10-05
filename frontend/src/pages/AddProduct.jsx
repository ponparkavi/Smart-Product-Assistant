import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProduct, uploadProductImage } from '../services/productApi';
import { extractInvoiceOCR } from '../services/productApi';
import { Plus, ArrowLeft, Upload, AlertCircle, Scan, FileText } from 'lucide-react';

const CATEGORIES = [
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

const AddProduct = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'ac',
    brand: '',
    model_number: '',
    serial_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: '',
    warranty_period_months: 12,
    usage_info: '',
    invoice_id: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleOcrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrError('');
    setOcrSuccessMsg('');

    try {
      const data = await extractInvoiceOCR(file);
      setFormData(prev => ({
        ...prev,
        name: data.product_name || prev.name,
        brand: data.brand || prev.brand,
        model_number: data.model_number || prev.model_number,
        purchase_date: data.purchase_date ? 
          (data.purchase_date.includes('/') ? data.purchase_date.split('/').reverse().join('-') : data.purchase_date) 
          : prev.purchase_date,
        purchase_price: data.purchase_price || prev.purchase_price,
        invoice_id: data.invoice_file_path || prev.invoice_id
      }));
      setOcrSuccessMsg('Invoice scanned successfully! Please review the extracted fields below.');
    } catch (err) {
      setOcrError(err.response?.data?.detail || 'Failed to analyze invoice. Please fill details manually.');
    } finally {
      setOcrLoading(false);
      // Reset input so they can select the same file again if needed
      e.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.brand || !formData.purchase_date) {
      setError('Please fill in all required fields (Product Name, Brand, Purchase Date).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : 0.0,
        warranty_period_months: parseInt(formData.warranty_period_months, 10) || 12
      };

      const created = await createProduct(payload);

      if (imageFile) {
        await uploadProductImage(created.id, imageFile);
      }

      navigate(`/products/${created.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page" style={{ maxWidth: '800px' }}>
      <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        <ArrowLeft size={16} /> Back to Appliance Vault
      </Link>

      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2>Register Household Product</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Add your appliance metadata to start warranty tracking, manual RAG assistance, and AI fault diagnostics.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* AI OCR Scanner Box */}
        <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: 'var(--primary)' }}>
                <Scan size={20} /> AI Invoice Scanner
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.3rem 0 0 0' }}>
                Upload your receipt/invoice and we'll automatically fill the details below.
              </p>
            </div>
            
            <label className="btn-primary" style={{ cursor: 'pointer', margin: 0, padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: ocrLoading ? 0.7 : 1 }}>
              <FileText size={18} />
              {ocrLoading ? 'Scanning...' : 'Scan Invoice'}
              <input type="file" accept="image/*" onChange={handleOcrUpload} style={{ display: 'none' }} disabled={ocrLoading} />
            </label>
          </div>
          
          {ocrError && (
            <div style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertCircle size={14} /> {ocrError}
            </div>
          )}
          
          {ocrSuccessMsg && (
            <div style={{ marginTop: '1rem', color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FileText size={14} /> {ocrSuccessMsg}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="e.g. LG Dual Inverter 1.5 Ton Split AC"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Appliance Category *</label>
              <select
                name="category"
                className="form-control"
                value={formData.category}
                onChange={handleChange}
                style={{ background: 'var(--bg-secondary)', cursor: 'pointer' }}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Manufacturer / Brand *</label>
              <input
                type="text"
                name="brand"
                className="form-control"
                placeholder="e.g. LG, Samsung, Whirlpool"
                value={formData.brand}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Model Number</label>
              <input
                type="text"
                name="model_number"
                className="form-control"
                placeholder="e.g. MS-Q18YNZA"
                value={formData.model_number}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Serial Number</label>
              <input
                type="text"
                name="serial_number"
                className="form-control"
                placeholder="e.g. 904KNYZ00812"
                value={formData.serial_number}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Purchase Date *</label>
              <input
                type="date"
                name="purchase_date"
                className="form-control"
                value={formData.purchase_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Warranty Coverage (Months) *</label>
              <input
                type="number"
                name="warranty_period_months"
                className="form-control"
                min="0"
                placeholder="12"
                value={formData.warranty_period_months}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Purchase Price ($ / Local Currency)</label>
              <input
                type="number"
                name="purchase_price"
                step="0.01"
                className="form-control"
                placeholder="e.g. 599.99"
                value={formData.purchase_price}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Product Photo (Optional)</label>
              <div style={{ border: '2px dashed var(--border-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="product-photo-input"
                />
                <label htmlFor="product-photo-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textTransform: 'none', margin: 0 }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ maxHeight: '140px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <Upload size={32} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontWeight: '600' }}>Click to upload product image</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>JPG, PNG, or WEBP up to 5MB</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Usage Info / Location Notes</label>
              <textarea
                name="usage_info"
                className="form-control"
                rows="3"
                placeholder="e.g. Installed in Master Bedroom, cleaned filter monthly."
                value={formData.usage_info}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: '1.5rem' }}>
            <Plus size={18} />
            {submitting ? 'Registering Product...' : 'Save Product to Vault'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
