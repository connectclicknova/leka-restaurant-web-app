import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadImageToImageKit } from '../utils/imagekit';
import { Plus, X, Search, Camera, Trash2, Check, Tag } from 'lucide-react';

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
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>Items</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Inventory of your food & drinks</p>
        </div>
        <button className="primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Item
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '48px' }}>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Shortcode</th>
              <th>Price</th>
              <th>Type</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>
                  <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: '#f6f6f7', overflow: 'hidden' }}>
                    {item.image ? <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}><Camera size={18}/></div>}
                  </div>
                </td>
                <td style={{ fontWeight: '600' }}>{item.name}</td>
                <td>
                  <div className="flex items-center gap-1" style={{ fontSize: '12px' }}>
                    <Tag size={12} color="#999" />
                    {categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized'}
                  </div>
                </td>
                <td style={{ fontSize: '12px', color: '#666' }}>{item.shortcode || '-'}</td>
                <td style={{ fontWeight: '700' }}>₹{item.price.toFixed(2)}</td>
                <td>
                  <span className={`badge ${item.isVeg ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                    {item.isVeg ? 'VEG' : 'NON-VEG'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => deleteItem(item.id)} style={{ padding: '6px', border: 'none', background: 'transparent', boxShadow: 'none', color: '#999' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="p-6 text-center" style={{ color: '#999', fontSize: '14px' }}>No items added yet.</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2>New Item Entry</h2>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Better Image Picker */}
              <div className="mb-6">
                <label>DISPRAY PHOTO</label>
                <div 
                  onClick={() => document.getElementById('item-image').click()}
                  style={{ 
                    width: '100%', 
                    height: '140px', 
                    borderRadius: '8px', 
                    border: '2px dashed #ddd', 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    background: '#fafafa', 
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: '0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#ddd'}
                >
                  {formData.image ? (
                    <img src={URL.createObjectURL(formData.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <Camera size={32} color="#999" strokeWidth={1} style={{ marginBottom: '8px' }} />
                      <span style={{ fontSize: '12px', color: '#666' }}>Upload from your computer</span>
                    </>
                  )}
                </div>
                <input id="item-image" type="file" style={{ display: 'none' }} onChange={e => setFormData({ ...formData, image: e.target.files[0] })} />
              </div>

              <div className="flex gap-4 mb-4">
                <div style={{ flex: 1 }}>
                  <label>ITEM NAME</label>
                  <input required placeholder="e.g. Garden Fresh Pizza" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div style={{ width: '120px' }}>
                  <label>PRICE</label>
                  <input type="number" step="0.01" required placeholder="0.00" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <div style={{ flex: 1 }}>
                  <label>CATEGORY</label>
                  <select 
                    required 
                    value={formData.categoryId} 
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    style={{ marginBottom: 0 }}
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ width: '120px' }}>
                  <label>CODE</label>
                  <input placeholder="P-01" value={formData.shortcode} onChange={e => setFormData({ ...formData, shortcode: e.target.value })} style={{ marginBottom: 0 }} />
                </div>
              </div>

              {/* Improved Veg/Non-Veg Selection */}
              <label>DIETARY REQUIREMENT</label>
              <div className="flex gap-2 mb-8">
                <button 
                  type="button" 
                  onClick={() => setFormData({ ...formData, isVeg: true })}
                  style={{ 
                    flex: 1, 
                    height: '42px',
                    borderRadius: '8px',
                    borderColor: formData.isVeg ? '#1e8e3e' : 'var(--border-color)',
                    background: formData.isVeg ? '#e6f4ea' : 'white',
                    color: formData.isVeg ? '#1e8e3e' : '#666',
                    fontWeight: '700',
                    fontSize: '12px',
                    boxShadow: 'none'
                  }}
                >
                  {formData.isVeg && <Check size={14} />} VEGETARIAN
                </button>
                <button 
                  type="button" 
                  onClick={() => setFormData({ ...formData, isVeg: false })}
                  style={{ 
                    flex: 1, 
                    height: '42px',
                    borderRadius: '8px',
                    borderColor: !formData.isVeg ? '#d93025' : 'var(--border-color)',
                    background: !formData.isVeg ? '#fce8e6' : 'white',
                    color: !formData.isVeg ? '#d93025' : '#666',
                    fontWeight: '700',
                    fontSize: '12px',
                    boxShadow: 'none'
                  }}
                >
                  {!formData.isVeg && <Check size={14} />} NON-VEGETARIAN
                </button>
              </div>

              <button type="submit" className="primary" style={{ width: '100%', height: '52px', fontWeight: '800' }} disabled={loading}>
                {loading ? 'PROCESSING...' : 'SAVE ITEM TO INVENTORY'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
