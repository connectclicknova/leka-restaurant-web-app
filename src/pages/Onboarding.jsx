import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

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
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f6f7' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%' }}>
        <h1 className="mb-2">Setup Restaurant</h1>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '24px' }}>
          Welcome, {user.displayName}. Let's setup your billing terminal details.
        </p>

        <form onSubmit={handleSubmit}>
          <label>RESTAURANT NAME</label>
          <input required placeholder="The Great Bistro" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />

          <label>ADDRESS</label>
          <textarea 
            required 
            placeholder="Full shop address..." 
            style={{ width: '100%', height: '80px', marginBottom: '16px', padding: '10px' }}
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
          />

          <label>GST NUMBER (OPTIONAL)</label>
          <input placeholder="e.g. 29AAAAA0000A1Z5" value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} />

          <button className="primary" style={{ width: '100%', height: '48px' }} disabled={loading}>
            {loading ? 'CREATING...' : 'FINISH SETUP'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
