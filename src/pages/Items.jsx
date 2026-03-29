import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadImageToImageKit } from '../utils/imagekit';
import { Plus, X, Search, Camera, Trash2, Check, Tag, Package } from 'lucide-react';
import '../css/Items.css';

const Items = () => {
  const { restaurant } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    shortcode: '',
    price: '',
    isVeg: true,
    categoryId: '',
    image: null
  });

  useEffect(() => {
    if (!restaurant?.id) return;
    
    // Fetch Items
    const unsubItems = onSnapshot(query(collection(db, 'restaurants', restaurant.id, 'items'), orderBy('createdAt', 'desc')), (s) => 
      setItems(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // Fetch Categories for Dropdown
    const unsubCats = onSnapshot(query(collection(db, 'restaurants', restaurant.id, 'categories'), orderBy('order', 'asc')), (s) => 
      setCategories(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { unsubItems(); unsubCats(); };
  }, [restaurant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryId) return alert("Select a Category");
    
    setLoading(true);
    try {
      let imageUrl = '';
      if (formData.image instanceof File) {
        // Prepare file name
        const cleanFileName = formData.name.trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const fileName = `${cleanFileName}_${Date.now()}`;
        
        // Manual upload with client-side signature
        const uploadResult = await uploadImageToImageKit(formData.image, fileName, 'RestaurantItems');
        imageUrl = uploadResult.url;
      }

      await addDoc(collection(db, 'restaurants', restaurant.id, 'items'), {
        name: formData.name,
        price: parseFloat(formData.price),
        shortcode: formData.shortcode || '',
        isVeg: formData.isVeg,
        categoryId: formData.categoryId,
        image: imageUrl || '',
        isAvailable: true,
        createdAt: new Date().toISOString()
      });

      setShowModal(false);
      setFormData({ name: '', shortcode: '', price: '', isVeg: true, categoryId: '', image: null });
    } catch (err) {
      console.error(err);
      alert("Error saving item. Please ensure ImageKit credentials are correct in utils/imagekit.js");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm("Permanent delete this item?")) {
      await deleteDoc(doc(db, 'restaurants', restaurant.id, 'items', id));
    }
  };

  return (
    <div className="items-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Items Inventory</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Manage your food and beverage menu</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add New Item
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Shortcode</th>
              <th>Price</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>
                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--bg-app)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    {item.image ? <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E0' }}><Camera size={18}/></div>}
                  </div>
                </td>
                <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>{item.name}</td>
                <td>
                  <div className="flex items-center gap-2" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    <Tag size={13} />
                    {categories.find(c => c.id === item.categoryId)?.name || 'General'}
                  </div>
                </td>
                <td><code style={{ background: 'var(--bg-app)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{item.shortcode || '-'}</code></td>
                <td style={{ fontWeight: '800', color: 'var(--primary)' }}>₹{item.price.toFixed(2)}</td>
                <td>
                  <span className={`badge-status ${item.isVeg ? 'status-delivered' : 'status-pending'}`} style={{ fontSize: '10px' }}>
                    {item.isVeg ? 'VEGETARIAN' : 'NON-VEGETARIAN'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => deleteItem(item.id)} className="btn btn-outline" style={{ padding: '8px', border: 'none', background: 'transparent', boxShadow: 'none', color: 'var(--text-muted)' }}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.1 }} />
            <p style={{ color: 'var(--text-muted)' }}>No items found in inventory.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Add New Item</h2>
              <X size={24} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowModal(false)} />
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Display Image</label>
                <div 
                  onClick={() => document.getElementById('item-image').click()}
                  style={{ 
                    width: '100%', 
                    height: '160px', 
                    borderRadius: '12px', 
                    border: '2px dashed var(--border)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    background: 'var(--bg-app)', 
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {formData.image ? (
                    <img src={URL.createObjectURL(formData.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <Camera size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px', opacity: 0.5 }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Click to upload image</span>
                    </>
                  )}
                </div>
                <input id="item-image" type="file" style={{ display: 'none' }} onChange={e => setFormData({ ...formData, image: e.target.files[0] })} />
              </div>

              <div className="flex gap-4 mb-4">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>ITEM NAME</label>
                  <input className="search-input" required placeholder="e.g. Butter Chicken" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ marginBottom: 0 }} />
                </div>
                <div style={{ width: '140px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>PRICE (₹)</label>
                  <input className="search-input" type="number" step="0.01" required placeholder="0.00" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ marginBottom: 0 }} />
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>CATEGORY</label>
                  <select 
                    className="search-input"
                    required 
                    value={formData.categoryId} 
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    style={{ marginBottom: 0 }}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ width: '140px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>SHORT CODE</label>
                  <input className="search-input" placeholder="e.g. BC-01" value={formData.shortcode} onChange={e => setFormData({ ...formData, shortcode: e.target.value })} style={{ marginBottom: 0 }} />
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px' }}>DIETARY REQUIREMENT</label>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    className="btn"
                    onClick={() => setFormData({ ...formData, isVeg: true })}
                    style={{ 
                      flex: 1, 
                      height: '48px',
                      borderRadius: '10px',
                      background: formData.isVeg ? '#E6F9EC' : 'white',
                      color: formData.isVeg ? '#00C853' : 'var(--text-muted)',
                      border: formData.isVeg ? '1px solid #00C853' : '1px solid var(--border)',
                      fontWeight: '700',
                      boxShadow: 'none'
                    }}
                  >
                    {formData.isVeg && <Check size={16} style={{ marginRight: '6px' }} />} VEGETARIAN
                  </button>
                  <button 
                    type="button" 
                    className="btn"
                    onClick={() => setFormData({ ...formData, isVeg: false })}
                    style={{ 
                      flex: 1, 
                      height: '48px',
                      borderRadius: '10px',
                      background: !formData.isVeg ? '#FFE6E6' : 'white',
                      color: !formData.isVeg ? '#FF5252' : 'var(--text-muted)',
                      border: !formData.isVeg ? '1px solid #FF5252' : '1px solid var(--border)',
                      fontWeight: '700',
                      boxShadow: 'none'
                    }}
                  >
                    {!formData.isVeg && <Check size={16} style={{ marginRight: '6px' }} />} NON-VEG
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '56px', fontSize: '16px' }} disabled={loading}>
                {loading ? 'Adding Item...' : 'Add to Inventory'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
