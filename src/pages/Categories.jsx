import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plus, X, Tag } from 'lucide-react';

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
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>Categories</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Organize your menu collections</p>
        </div>
        <button className="primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="grid-items">
        {categories.map(cat => (
          <div key={cat.id} className="card flex items-center justify-between" style={{ padding: '24px' }}>
            <div className="flex items-center gap-4">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f6f6f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                {cat.emoji || '🍴'}
              </div>
              <div>
                <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{cat.name}</p>
                <span className="badge badge-success" style={{ fontSize: '9px', marginTop: '4px', display: 'inline-block' }}>ACTIVE</span>
              </div>
            </div>
            <div style={{ color: '#ccc' }}>
              <Tag size={18} />
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2>New Category</h2>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>
            
            <form onSubmit={handleSubmit}>
              <label>CATEGORY NAME</label>
              <input 
                placeholder="e.g. Starters, Desserts" 
                required 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />

              <label>SELECT ICON (EMOJI)</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                gap: '8px', 
                background: '#f6f6f7', 
                padding: '12px', 
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                marginBottom: '24px',
                border: '1px solid var(--border-color)'
              }}>
                {EMOJI_LIST.map(em => (
                  <div 
                    key={em} 
                    onClick={() => setFormData({ ...formData, emoji: em })}
                    style={{ 
                      fontSize: '24px', 
                      cursor: 'pointer', 
                      textAlign: 'center', 
                      padding: '8px',
                      borderRadius: '6px',
                      background: formData.emoji === em ? 'white' : 'transparent',
                      boxShadow: formData.emoji === em ? 'var(--shadow-sm)' : 'none',
                      transform: formData.emoji === em ? 'scale(1.1)' : 'scale(1)',
                      border: formData.emoji === em ? '1px solid var(--primary-color)' : '1px solid transparent',
                      transition: 'all 0.1s'
                    }}
                  >
                    {em}
                  </div>
                ))}
              </div>

              <button 
                type="submit" 
                className="primary" 
                style={{ width: '100%', height: '48px', fontWeight: '700' }}
                disabled={loading}
              >
                {loading ? 'STORING CATEGORY...' : 'SAVE CATEGORY'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
