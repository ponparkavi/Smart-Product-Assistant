import React, { useState, useEffect } from 'react';
import { Wrench, ShieldAlert, CheckCircle, AlertTriangle, X, Info } from 'lucide-react';
import { getMaintenancePrediction } from '../services/maintenanceApi';

const PredictiveMaintenance = ({ product, onClose }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const data = await getMaintenancePrediction(product.id);
        setPrediction(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to generate maintenance prediction.');
      } finally {
        setLoading(false);
      }
    };
    fetchPrediction();
  }, [product.id]);

  const getRiskColor = (risk) => {
    if (risk === 'Low') return 'var(--success)';
    if (risk === 'Medium') return 'var(--warning)';
    if (risk === 'Critical') return 'var(--danger)';
    return 'var(--text-muted)';
  };

  const getStatusIcon = (status) => {
    if (status.includes('Good')) return <CheckCircle size={24} style={{ color: 'var(--success)' }} />;
    if (status.includes('Due')) return <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />;
    if (status.includes('Overdue')) return <ShieldAlert size={24} style={{ color: 'var(--danger)' }} />;
    return <Wrench size={24} />;
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
        maxWidth: '550px',
        maxHeight: '90vh',
        overflowY: 'auto',
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
            <Wrench size={20} />
            Predictive Maintenance Insights
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Analyzing product history and intervals...
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : prediction ? (
            <>
              {prediction.is_baseline_rule_based && (
                <div style={{ 
                  background: 'rgba(99, 102, 241, 0.1)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '3px solid var(--primary)',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start'
                }}>
                  <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    <strong style={{ color: 'var(--text-main)' }}>Baseline Prediction Mode:</strong> {prediction.baseline_disclaimer}
                  </div>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Current Status</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: '600' }}>
                    {getStatusIcon(prediction.maintenance_status)}
                    {prediction.maintenance_status}
                  </div>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Risk Indicator</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600', color: getRiskColor(prediction.risk_indicator) }}>
                    {prediction.risk_indicator} Risk
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '0.95rem' }}>AI Recommendation</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {prediction.maintenance_recommendation}
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '0.95rem' }}>Suggested Next Action</h4>
                <p style={{ margin: 0, color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '500' }}>
                  → {prediction.suggested_next_action}
                </p>
              </div>
              
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                 <button className="btn-primary" onClick={onClose}>Understood</button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PredictiveMaintenance;
