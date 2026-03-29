import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plus, X, Wallet } from 'lucide-react';

const Investments = () => {
  const { restaurant } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', amount: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!restaurant?.id) return;
    const q = query(collection(db, 'restaurants', restaurant.id, 'investments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInvestments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [restaurant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'restaurants', restaurant.id, 'investments'), {
        name: formData.name,
        amount: parseFloat(formData.amount),
        createdAt: new Date().toISOString()
      });
      setShowModal(false);
      setFormData({ name: '', amount: '' });
    } catch (error) {
      console.error("Error adding investment", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1>Investments</h1>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Track business investments and large expenses
          </p>
        </div>
        <button className="primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Investment
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Investment Name</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {investments.map(inv => (
              <tr key={inv.id}>
                <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td style={{ fontWeight: '600' }}>{inv.name}</td>
                <td>${inv.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {investments.length === 0 && (
          <div className="p-4 text-center">
            <p style={{ fontSize: '12px', color: '#999' }}>No investments recorded yet.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '24px' }}>
        <label>Total Invested</label>
        <p style={{ fontSize: '24px', fontWeight: '800' }}>
          ${investments.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
        </p>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2>Add New Investment</h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{ border: 'none', padding: '0', height: 'auto', background: 'transparent' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <label>Investment Name</label>
              <input 
                placeholder="e.g. New Kitchen Equipment" 
                required 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />

              <label>Amount</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                required 
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
              />

              <button 
                type="submit" 
                className="primary" 
                style={{ width: '100%', height: '40px' }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Investment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investments;
