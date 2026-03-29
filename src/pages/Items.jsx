import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { db, storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, X, Search, MoreVertical, Trash2, Camera } from 'lucide-react';

const Items = () => {
  const { restaurant } = useAuth();
  const [items, setItems] = useState([]);
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
    const unsub = onSnapshot(collection(db, 'restaurants', restaurant.id, 'items'), (s) => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [restaurant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = '';
      if (formData.image) {
        const storageRef = ref(storage, `restaurants/${restaurant.id}/items/${Date.now()}_${formData.image.name}`);
        const uploadResult = await uploadBytes(storageRef, formData.image);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      await addDoc(collection(db, 'restaurants', restaurant.id, 'items'), {
        name: formData.name,
        price: parseFloat(formData.price),
        shortcode: formData.shortcode || '',
        isVeg: formData.isVeg,
        categoryId: formData.categoryId || 'default',
        image: imageUrl || '',
        isAvailable: true,
        createdAt: new Date().toISOString()
      });

      setShowModal(false);
      setFormData({ name: '', shortcode: '', price: '', isVeg: true, categoryId: '', image: null });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm("Permanent delete this product?")) {
      await deleteDoc(doc(db, 'restaurants', restaurant.id, 'items', id));
    }
  };

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>Items</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage your inventory and pricing</p>
        </div>
        <button className="primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Item
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '48px' }}>Item</th>
              <th>Name</th>
              <th>Code</th>
              <th>Price</th>
              <th>Type</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
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
                <td style={{ fontSize: '12px', color: '#666' }}>{item.shortcode || '-'}</td>
                <td style={{ fontWeight: '700' }}>${item.price.toFixed(2)}</td>
                <td>
                  <span className={`badge ${item.isVeg ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                    {item.isVeg ? 'VEG' : 'NON-VEG'}
                  </span>
                </td>
                <td>
                  <span className="badge badge-success">ACTIVE</span>
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
        {items.length === 0 && <div className="p-6 text-center" style={{ color: '#999', fontSize: '14px' }}>No products found. Start by adding one.</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2>New Item Entry</h2>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4" style={{ textAlign: 'center' }}>
                <label className="flex-col items-center gap-2" style={{ cursor: 'pointer' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', overflow: 'hidden' }}>
                    {formData.image ? <img src={URL.createObjectURL(formData.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={24} color="#999" />}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--primary-color)' }}>{formData.image ? 'Change photo' : 'Select photo'}</span>
                  <input type="file" className="hidden" style={{ display: 'none' }} onChange={e => setFormData({ ...formData, image: e.target.files[0] })} />
                </label>
              </div>

              <div className="grid-items" style={{ gridTemplateColumns: 'minmax(0, 1fr) 120px', gap: '12px' }}>
                <div>
                  <label>ITEM NAME</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label>PRICE</label>
                  <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                </div>
              </div>

              <label>SHORTCODE (OPTIONAL)</label>
              <input placeholder="e.g. FD-01" value={formData.shortcode} onChange={e => setFormData({ ...formData, shortcode: e.target.value })} />

              <div className="mb-6">
                <label>ITEM TYPE</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2" style={{ fontSize: '14px' }}>
                    <input type="radio" checked={formData.isVeg} onChange={() => setFormData({ ...formData, isVeg: true })} style={{ width: 'auto', marginBottom: 0 }} /> Vegetarian
                  </label>
                  <label className="flex items-center gap-2" style={{ fontSize: '14px' }}>
                    <input type="radio" checked={!formData.isVeg} onChange={() => setFormData({ ...formData, isVeg: false })} style={{ width: 'auto', marginBottom: 0 }} /> Non-Vegetarian
                  </label>
                </div>
              </div>

              <button type="submit" className="primary" style={{ width: '100%', height: '48px' }} disabled={loading}>
                {loading ? 'STORING ITEM...' : 'SAVE ITEM'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
