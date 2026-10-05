import React from 'react';

const PlaceholderPage = ({ title, icon: Icon, description }) => {
  return (
    <div className="dashboard-page glass-card" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>
        <Icon size={64} />
      </div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{title}</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
        {description}
      </p>
      <div style={{ marginTop: '2rem' }}>
        <span className="status-chip" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
          Coming Soon
        </span>
      </div>
    </div>
  );
};

export default PlaceholderPage;
