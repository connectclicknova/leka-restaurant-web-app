import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plus, X, Tag } from 'lucide-react';

const Categories = () => {
  const { restaurant } = useAuth();
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', emoji: '' });

  useEffect(() => {
    if (!restaurant?.id) return;
    const q = query(collection(db, 'restaurants', restaurant.id, 'categories'));
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
      setFormData({ name: '', emoji: '' });
    } catch (error) {
      console.error("Error adding category", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1>Categories</h1>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Organize your menu by categories
          </p>
        </div>
        <button className="primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="grid-items">
        {categories.map(cat => (
          <div key={cat.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span style={{ fontSize: '24px' }}>{cat.emoji || '📂'}</span>
              <div>
                <p style={{ fontWeight: '600', textTransform: 'uppercase' }}>{cat.name}</p>
                <p style={{ fontSize: '10px', color: cat.isActive ? 'green' : 'red' }}>
                  {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2>Add New Category</h2>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ border: 'none', padding: '0', height: 'auto', background: 'transparent' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <label>Category Name</label>
              <input 
                placeholder="e.g. Starters, Main Course" 
                required 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />

              <label>Emoji</label>
              <input 
                placeholder="e.g. 🥗, 🍕" 
                maxLength="2" 
                value={formData.emoji}
                onChange={e => setFormData({ ...formData, emoji: e.target.value })}
              />

              <button 
                type="submit" 
                className="primary" 
                style={{ width: '100%', height: '40px' }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
