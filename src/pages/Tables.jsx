import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plus, X, Layout } from 'lucide-react';

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
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1>Tables</h1>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Manage floor layout and table assignments
          </p>
        </div>
        <button className="primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Table
        </button>
      </div>

      <div className="grid-items">
        {tables.map(table => (
          <div key={table.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <label style={{ color: 'var(--text-primary)', marginBottom: '0' }}>{table.shortcode}</label>
              <span style={{ fontSize: '10px', color: table.status === 'available' ? 'green' : 'red' }}>
                {table.status.toUpperCase()}
              </span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{table.name}</h3>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2>Add New Table</h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{ border: 'none', padding: '0', height: 'auto', background: 'transparent' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <label>Table Name</label>
              <input 
                placeholder="e.g. Table 1, Balcony 4" 
                required 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />

              <label>Shortcode</label>
              <input 
                placeholder="e.g. T-1, B-4" 
                required 
                value={formData.shortcode}
                onChange={e => setFormData({ ...formData, shortcode: e.target.value })}
              />

              <button 
                type="submit" 
                className="primary" 
                style={{ width: '100%', height: '40px' }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Table'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables;
