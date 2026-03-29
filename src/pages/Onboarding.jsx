import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import '../css/Onboarding.css';

const Onboarding = () => {
  const { user, restaurant, completeOnboarding } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    gstNumber: ''
  });
  const [loading, setLoading] = useState(false);

  if (!user) return <Navigate to="/login" />;
  if (restaurant?.onboardingComplete) return <Navigate to="/" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await completeOnboarding(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div className="logo-box" style={{ width: '40px', height: '40px', fontSize: '20px' }}>L</div>
          <span className="logo-text" style={{ fontSize: '24px' }}>Deliro Setup</span>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main)' }}>Setup Restaurant</h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '40px', lineHeight: '1.6' }}>
          Welcome, {user.displayName}. Let's setup your billing terminal details to get started.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>RESTAURANT NAME</label>
            <input 
              className="search-input"
              required 
              placeholder="e.g. The Silver Spoon" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              style={{ marginBottom: 0 }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>ADDRESS</label>
            <textarea 
              className="search-input"
              required 
              placeholder="Full shop address including street and city..." 
              style={{ width: '100%', height: '100px', marginBottom: 0, padding: '12px 16px', borderRadius: '12px', resize: 'none' }}
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>GST NUMBER (OPTIONAL)</label>
            <input 
              className="search-input"
              placeholder="e.g. 29AAAAA0000A1Z5" 
              value={formData.gstNumber} 
              onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} 
              style={{ marginBottom: 0 }}
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', height: '56px', fontSize: '16px' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Finish Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
