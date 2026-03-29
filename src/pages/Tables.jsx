import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plus, X, Layout } from 'lucide-react';
import '../css/Tables.css';

const Tables = () => {
  const { restaurant } = useAuth();
  const [tables, setTables] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', shortcode: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!restaurant?.id) return;
    const q = query(collection(db, 'restaurants', restaurant.id, 'tables'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [restaurant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'restaurants', restaurant.id, 'tables'), {
        name: formData.name,
        shortcode: formData.shortcode,
        status: 'available',
        createdAt: new Date().toISOString()
      });
      setShowModal(false);
      setFormData({ name: '', shortcode: '' });
    } catch (error) {
      console.error("Error adding table", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tables-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tables Layout</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Manage floor layout and table assignments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add New Table
        </button>
      </div>

      <div className="grid-items">
        {tables.map(table => (
          <div key={table.id} className="stat-card">
            <div className="flex justify-between items-start mb-4">
              <div style={{ padding: '4px 8px', background: 'var(--bg-app)', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>{table.shortcode}</div>
              <span className={`badge-status ${table.status === 'available' ? 'status-delivered' : 'status-pending'}`} style={{ fontSize: '10px' }}>
                {table.status.toUpperCase()}
              </span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>{table.name}</h3>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
              <Layout size={14} />
              <span>Standard Seating</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Add New Table</h2>
              <X size={24} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowModal(false)} />
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>TABLE NAME</label>
                <input 
                  className="search-input"
                  placeholder="e.g. Table 1, Balcony 4" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ marginBottom: 0 }}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>SHORTCODE</label>
                <input 
                  className="search-input"
                  placeholder="e.g. T-1, B-4" 
                  required 
                  value={formData.shortcode}
                  onChange={e => setFormData({ ...formData, shortcode: e.target.value })}
                  style={{ marginBottom: 0 }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', height: '56px', fontSize: '16px' }}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Table'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables;
