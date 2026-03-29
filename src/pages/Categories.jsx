import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plus, X, Tag } from 'lucide-react';
import '../css/Categories.css';

const EMOJI_LIST = [
  '🍕', '🥗', '🍔', '🍟', '🍣', '🍝', '🍛', '🍲', '🍜', '🍢', '🍦', '🍩', '🍰', '🍪', '🍫', '🍬', '🍮', '🍯', '🍷', '🍸', '🍹', '🍺', '🍻', '🥃', '🥤', '🍞', '🥩', '🥓', '🍳', '🌮', '🌯', '🥖', '🥨', '🧀', '🍗', '🍖', '🥟'
];

const Categories = () => {
  const { restaurant } = useAuth();
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', emoji: '🍴' });

  useEffect(() => {
    if (!restaurant?.id) return;
    const q = query(collection(db, 'restaurants', restaurant.id, 'categories'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [restaurant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'restaurants', restaurant.id, 'categories'), {
        name: formData.name,
        emoji: formData.emoji,
        isActive: true,
        order: categories.length + 1,
        createdAt: new Date().toISOString()
      });
      setShowModal(false);
      setFormData({ name: '', emoji: '🍴' });
    } catch (error) {
      console.error("Error adding category", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="categories-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Organize your menu into collections</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add New Category
        </button>
      </div>

      <div className="grid-items">
        {categories.map(cat => (
          <div key={cat.id} className="stat-card flex items-center justify-between" style={{ padding: '24px' }}>
            <div className="flex items-center gap-4">
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', border: '1px solid var(--border)' }}>
                {cat.emoji || '🍴'}
              </div>
              <div>
                <p style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-main)' }}>{cat.name}</p>
                <span className="badge-status status-delivered" style={{ fontSize: '10px', marginTop: '6px' }}>ACTIVE</span>
              </div>
            </div>
            <div style={{ color: 'var(--text-muted)', opacity: 0.3 }}>
              <Tag size={20} />
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>New Category</h2>
              <X size={24} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowModal(false)} />
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>CATEGORY NAME</label>
                <input 
                  className="search-input"
                  placeholder="e.g. Starters, Desserts" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ marginBottom: 0 }}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px' }}>SELECT ICON</label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: '10px', 
                  background: 'var(--bg-app)', 
                  padding: '16px', 
                  borderRadius: '12px',
                  maxHeight: '240px',
                  overflowY: 'auto',
                  border: '1px solid var(--border)'
                }}>
                  {EMOJI_LIST.map(em => (
                    <div 
                      key={em} 
                      onClick={() => setFormData({ ...formData, emoji: em })}
                      style={{ 
                        fontSize: '24px', 
                        cursor: 'pointer', 
                        textAlign: 'center', 
                        padding: '10px',
                        borderRadius: '10px',
                        background: formData.emoji === em ? 'white' : 'transparent',
                        boxShadow: formData.emoji === em ? 'var(--shadow)' : 'none',
                        transform: formData.emoji === em ? 'scale(1.1)' : 'scale(1)',
                        border: formData.emoji === em ? '1px solid var(--primary)' : '1px solid transparent',
                        transition: 'all 0.1s'
                      }}
                    >
                      {em}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', height: '56px', fontSize: '16px' }}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
