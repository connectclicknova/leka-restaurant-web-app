import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plus, X, Layout, Edit2, Trash2 } from 'lucide-react';
import '../css/Tables.css';

const Tables = () => {
  const { restaurant } = useAuth();
  const [tables, setTables] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
      const tableData = {
        name: formData.name,
        shortcode: formData.shortcode,
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        await updateDoc(doc(db, 'restaurants', restaurant.id, 'tables', editingId), tableData);
      } else {
        await addDoc(collection(db, 'restaurants', restaurant.id, 'tables'), {
          ...tableData,
          status: 'available',
          createdAt: new Date().toISOString()
        });
      }
      closeModal();
    } catch (error) {
      console.error("Error saving table", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTable = async (id) => {
    if (window.confirm("Permanent delete this table?")) {
      await deleteDoc(doc(db, 'restaurants', restaurant.id, 'tables', id));
    }
  };

  const openEdit = (table) => {
    setEditingId(table.id);
    setFormData({ name: table.name, shortcode: table.shortcode });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', shortcode: '' });
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

      <div className="tables-grid">
        {tables.map(table => (
          <div key={table.id} className="stat-card table-card" style={{ padding: '32px 24px', textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
               <div style={{ padding: '4px 10px', background: 'var(--bg-app)', borderRadius: '6px', fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{table.shortcode}</div>
            </div>
            
            <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '4px' }}>
              <button onClick={() => openEdit(table)} className="btn btn-outline" style={{ padding: '6px', border: 'none', background: 'transparent', color: 'var(--text-muted)', width: '30px', height: '30px' }}>
                <Edit2 size={13} />
              </button>
              <button onClick={() => deleteTable(table.id)} className="btn btn-outline" style={{ padding: '6px', border: 'none', background: 'transparent', color: 'var(--danger)', width: '30px', height: '30px' }}>
                <Trash2 size={13} />
              </button>
            </div>

            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '16px', 
              background: 'var(--primary-light)', 
              color: 'var(--primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '12px auto 16px',
              border: '1px solid rgba(0,102,255,0.1)'
            }}>
              <Layout size={28} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>{table.name}</h3>
            <p style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.5px' }}>BILLING STATION</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{editingId ? 'Edit Table' : 'Add New Table'}</h2>
              <X size={24} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={closeModal} />
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
                {loading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Table' : 'Create Table')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables;
