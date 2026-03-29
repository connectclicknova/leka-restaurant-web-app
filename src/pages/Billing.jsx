import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, Plus, Minus, CreditCard, ChevronDown, Trash2 } from 'lucide-react';

const Billing = () => {
  const { restaurant, user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (!restaurant?.id) return;
    
    const unsubItems = onSnapshot(collection(db, 'restaurants', restaurant.id, 'items'), (s) => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCats = onSnapshot(collection(db, 'restaurants', restaurant.id, 'categories'), (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTabs = onSnapshot(collection(db, 'restaurants', restaurant.id, 'tables'), (s) => setTables(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubItems(); unsubCats(); unsubTabs(); };
  }, [restaurant]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const tax = subtotal * 0.05; 
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Select products first");
    if (!selectedTable) return alert("Select a table number");

    try {
      await addDoc(collection(db, 'restaurants', restaurant.id, 'bills'), {
        billNumber: `POS-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        tableNumber: selectedTable,
        status: 'paid',
        items: cart.map(i => ({ itemId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        subtotal, taxAmount: tax, grandTotal: total,
        paymentMethod: 'UPI/Other', paymentStatus: 'paid'
      });

      alert("🎉 Order stored successfully!");
      setCart([]);
      setSelectedTable('');
    } catch (err) {
      console.error(err);
      alert("Checkout error");
    }
  };

  const filteredItems = items.filter(item => 
    (activeCategory === 'all' || item.categoryId === activeCategory) &&
    (item.name.toLowerCase().includes(search.toLowerCase()) || (item.shortcode && item.shortcode.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="billing-grid">
      {/* Search and Product Selection */}
      <div className="flex-col" style={{ overflowY: 'auto', paddingRight: '8px' }}>
        <div className="mb-6 flex gap-4">
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#999' }} />
            <input 
              placeholder="Search items..." 
              style={{ paddingLeft: '40px', marginBottom: '0', height: '42px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select 
            style={{ width: '180px', marginBottom: '0', height: '42px', appearance: 'none', background: 'white url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E") no-repeat right 12px top 50%', backgroundSize: '12px' }}
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="grid-items">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className="card" 
              style={{ padding: '0', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.1s' }}
              onClick={() => addToCart(item)}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ height: '140px', background: '#f6f6f7', position: 'relative' }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                    <Plus size={32} strokeWidth={1} />
                  </div>
                )}
                {item.isVeg && <div style={{ position: 'absolute', top: '8px', right: '8px', width: '12px', height: '12px', border: '1px solid green', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'green' }}/></div>}
              </div>
              <div className="p-4">
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{item.shortcode}</p>
                <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px' }}>{item.name}</p>
                <p style={{ color: 'var(--primary-color)', fontWeight: '700', fontSize: '15px' }}>${item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart/Summary Section */}
      <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="card-header" style={{ margin: '0', borderTopLeftRadius: 'var(--radius)', borderTopRightRadius: 'var(--radius)', background: 'white' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.5px' }}>CART SUMMARY</h2>
        </div>
        
        <div className="p-4" style={{ background: '#fafafa', borderBottom: '1px solid var(--border-color)' }}>
          <label style={{ fontSize: '11px', color: '#999' }}>SELECT TABLE</label>
          <div style={{ position: 'relative' }}>
            <select 
              value={selectedTable} 
              onChange={e => setSelectedTable(e.target.value)}
              style={{ paddingLeft: '40px', marginBottom: '0' }}
            >
              <option value="">Choose a table...</option>
              {tables.map(t => <option key={t.id} value={t.shortcode}>{t.name} ({t.shortcode})</option>)}
            </select>
            <CreditCard size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#666' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '60px', color: '#ccc' }}>
              <Trash2 size={48} strokeWidth={1} style={{ marginBottom: '16px' }} />
              <p style={{ fontSize: '13px' }}>Your cart is empty.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center mb-6">
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>{item.name}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>${item.price.toFixed(2)} / unit</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center" style={{ border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '4px', height: '30px', border: 'none', background: 'transparent', boxShadow: 'none' }}><Minus size={14}/></button>
                    <span style={{ padding: '0 8px', fontSize: '13px', fontWeight: '700' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '4px', height: '30px', border: 'none', background: 'transparent', boxShadow: 'none' }}><Plus size={14}/></button>
                  </div>
                  <p style={{ width: '60px', textAlign: 'right', fontSize: '14px', fontWeight: '700' }}>${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6" style={{ background: '#f6f6f7', borderTop: '1px solid var(--border-color)', borderBottomLeftRadius: 'var(--radius)', borderBottomRightRadius: 'var(--radius)' }}>
          <div className="flex justify-between mb-3">
            <span style={{ fontSize: '13px', color: '#666' }}>Subtotal</span>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span style={{ fontSize: '13px', color: '#666' }}>Estimation Tax (5%)</span>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-6" style={{ borderTop: '1px dashed #ccc', paddingTop: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: '800' }}>TOTAL AMOUNT</span>
            <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary-color)' }}>${total.toFixed(2)}</span>
          </div>
          
          <button 
            className="primary" 
            style={{ width: '100%', height: '52px', fontSize: '16px', fontWeight: '700', letterSpacing: '0.5px' }}
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            FINALIZE PAYMENT
          </button>
        </div>
      </div>
    </div>
  );
};

export default Billing;
