import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plus, X, Tag, Edit2, Trash2 } from 'lucide-react';
import '../css/Categories.css';

const EMOJI_LIST = [
  '🍕', '🥗', '🍔', '🍟', '🍣', '🍝', '🍛', '🍲', '🍜', '🍢', '🍦', '🍩', '🍰', '🍪', '🍫', '🍬', '🍮', '🍯', '🍷', '🍸', '🍹', '🍺', '🍻', '🥃', '🥤', '🍞', '🥩', '🥓', '🍳', '🌮', '🌯', '🥖', '🥨', '🧀', '🍗', '🍖', '🥟'
];

const Categories = () => {
  const { restaurant } = useAuth();
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
      const categoryData = {
        name: formData.name,
        emoji: formData.emoji,
        isActive: true,
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        await updateDoc(doc(db, 'restaurants', restaurant.id, 'categories', editingId), categoryData);
      } else {
        await addDoc(collection(db, 'restaurants', restaurant.id, 'categories'), {
          ...categoryData,
          order: categories.length + 1,
          createdAt: new Date().toISOString()
        });
      }
      closeModal();
    } catch (error) {
      console.error("Error saving category", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    if (window.confirm("Permanent delete this category? All items in this category will become uncategorized.")) {
      await deleteDoc(doc(db, 'restaurants', restaurant.id, 'categories', id));
    }
  };

  const openEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, emoji: cat.emoji });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', emoji: '🍴' });
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

      <div className="categories-grid">
        {categories.map(cat => (
          <div key={cat.id} className="stat-card category-card" style={{ padding: '32px 24px', textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '4px' }}>
              <button onClick={() => openEdit(cat)} className="btn btn-outline" style={{ padding: '6px', border: 'none', background: 'transparent', color: 'var(--text-muted)', width: '32px', height: '32px' }}>
                <Edit2 size={14} />
              </button>
              <button onClick={() => deleteCategory(cat.id)} className="btn btn-outline" style={{ padding: '6px', border: 'none', background: 'transparent', color: 'var(--danger)', width: '32px', height: '32px' }}>
                <Trash2 size={14} />
              </button>
            </div>
            
            <div style={{ 
              width: '72px', 
              height: '72px', 
              borderRadius: '20px', 
              background: 'var(--bg-app)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '36px', 
              border: '1px solid var(--border)',
              margin: '0 auto 16px',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}>
              {cat.emoji || '🍴'}
            </div>
            
            <h3 style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text-main)', marginBottom: '4px' }}>{cat.name}</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>MENU CATEGORY</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" style={{ maxWidth: '440px', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{editingId ? 'Edit Category' : 'New Category'}</h2>
              <X size={24} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={closeModal} />
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
                {loading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Category' : 'Create Category')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
