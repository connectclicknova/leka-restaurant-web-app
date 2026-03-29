import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, Plus, Minus, CreditCard, ChevronDown, Trash2, Printer, Save, FileText, CheckCircle, Package } from 'lucide-react';
import '../css/Billing.css';

const Billing = () => {
  const { restaurant, user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeBills, setActiveBills] = useState([]);
  
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedBillId, setSelectedBillId] = useState(''); // '' means new bill
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (!restaurant?.id) return;
    
    const unsubItems = onSnapshot(collection(db, 'restaurants', restaurant.id, 'items'), (s) => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCats = onSnapshot(collection(db, 'restaurants', restaurant.id, 'categories'), (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTabs = onSnapshot(collection(db, 'restaurants', restaurant.id, 'tables'), (s) => setTables(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubItems(); unsubCats(); unsubTabs(); };
  }, [restaurant]);

  // Load active bills for the selected table
  useEffect(() => {
    if (!restaurant?.id || !selectedTable) {
      setActiveBills([]);
      return;
    }

    const q = query(
      collection(db, 'restaurants', restaurant.id, 'bills'),
      where('tableNumber', '==', selectedTable),
      where('status', '!=', 'paid')
    );

    const unsubBills = onSnapshot(q, (s) => {
      const billsData = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setActiveBills(billsData);
    });

    return () => unsubBills();
  }, [restaurant, selectedTable]);

  // Handle bill selection
  useEffect(() => {
    if (selectedBillId) {
      const bill = activeBills.find(b => b.id === selectedBillId);
      if (bill) {
        setCart(bill.items.map(item => ({
          ...item,
          id: item.itemId // Map itemId back to id for cart logic
        })));
      }
    } else {
      setCart([]);
    }
  }, [selectedBillId, activeBills]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, itemId: item.id }];
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

  const saveBill = async (statusOverride = null) => {
    if (!selectedTable) return alert("Select a table");
    if (cart.length === 0) return alert("Cart is empty");

    setLoading(true);
    try {
      const billData = {
        items: cart.map(i => ({ itemId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        subtotal,
        taxAmount: tax,
        grandTotal: total,
        tableNumber: selectedTable,
        updatedAt: new Date().toISOString(),
        status: statusOverride || (selectedBillId ? activeBills.find(b => b.id === selectedBillId).status : 'open')
      };

      if (selectedBillId) {
        await updateDoc(doc(db, 'restaurants', restaurant.id, 'bills', selectedBillId), billData);
        alert(`Bill updated as ${billData.status.toUpperCase()}`);
      } else {
        const docRef = await addDoc(collection(db, 'restaurants', restaurant.id, 'bills'), {
          ...billData,
          billNumber: `POS-${Date.now().toString().slice(-6)}`,
          createdAt: new Date().toISOString(),
          createdBy: user.uid,
          status: statusOverride || 'open'
        });
        setSelectedBillId(docRef.id);
        alert(`New bill created as ${statusOverride?.toUpperCase() || 'OPEN'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving bill");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedTable || cart.length === 0) return alert("Incomplete order");
    if (!window.confirm("Mark this bill as PAID?")) return;

    setLoading(true);
    try {
      const billData = {
        items: cart.map(i => ({ itemId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        subtotal,
        taxAmount: tax,
        grandTotal: total,
        tableNumber: selectedTable,
        status: 'paid',
        paymentStatus: 'paid',
        paymentMethod: 'Cash/Online',
        paidAt: new Date().toISOString()
      };

      if (selectedBillId) {
        await updateDoc(doc(db, 'restaurants', restaurant.id, 'bills', selectedBillId), billData);
      } else {
        await addDoc(collection(db, 'restaurants', restaurant.id, 'bills'), {
          ...billData,
          billNumber: `POS-${Date.now().toString().slice(-6)}`,
          createdAt: new Date().toISOString(),
          createdBy: user.uid
        });
      }

      alert("🎉 Payment successful! Bill closed.");
      setCart([]);
      setSelectedTable('');
      setSelectedBillId('');
    } catch (err) {
      console.error(err);
      alert("Payment error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print(); // Basic print functionality
  };

  const filteredItems = items.filter(item => 
    (activeCategory === 'all' || item.categoryId === activeCategory) &&
    (item.name.toLowerCase().includes(search.toLowerCase()) || (item.shortcode && item.shortcode.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="billing-page">
      <div className="page-header">
        <h1 className="page-title">Billing Terminal</h1>
        <div className="flex gap-4 no-print">
           <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              className="search-input"
              placeholder="Search items or codes..." 
              style={{ paddingLeft: '40px', marginBottom: '0' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="search-input"
            style={{ width: '180px', marginBottom: '0' }}
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value)}
          >
            <option value="all">Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="billing-grid">
        {/* Product Selection */}
        <div style={{ overflowY: 'auto', paddingRight: '8px' }}>
          <div className="items-grid">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className="stat-card item-card" 
                style={{ padding: '0', overflow: 'hidden' }}
                onClick={() => addToCart(item)}
              >
                <div style={{ height: '140px', background: '#F8F9FD', position: 'relative' }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E0' }}>
                      <Package size={32} strokeWidth={1} />
                    </div>
                  )}
                  {item.isVeg && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', width: '18px', height: '18px', border: '1px solid #00C853', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00C853' }} />
                    </div>
                  )}
                </div>
                <div style={{ padding: '16px' }}>
                  <p style={{ fontWeight: '500', fontSize: '15px', color: 'var(--text-main)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                  <div className="flex justify-between items-center">
                     <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.shortcode || '-'}</p>
                     <p style={{ color: 'var(--primary)', fontWeight: '500', fontSize: '16px' }}>₹{item.price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Cart Terminal */}
        <div className="stat-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', borderLeft: '1px solid var(--border)' }}>
          {/* Terminal Header */}
          <div style={{ padding: '24px', background: 'white', borderBottom: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-main)' }}>Current Bill</h3>
              <div style={{ padding: '6px 12px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '100px', fontSize: '12px', fontWeight: '500' }}>
                {selectedBillId ? 'ACTIVE' : 'NEW ORDER'}
              </div>
            </div>

            <div className="flex gap-3 no-print">
              <div style={{ flex: 1 }}>
                <select 
                  className="search-input"
                  style={{ height: '48px', fontSize: '13px', background: 'var(--bg-app)', border: 'none' }}
                  value={selectedTable} 
                  onChange={e => { setSelectedTable(e.target.value); setSelectedBillId(''); }}
                >
                  <option value="">Select Table</option>
                  {tables.map(t => <option key={t.id} value={t.shortcode}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1.2 }}>
                <select 
                  className="search-input"
                  style={{ height: '48px', fontSize: '13px', background: 'var(--bg-app)', border: 'none' }}
                  disabled={!selectedTable}
                  value={selectedBillId} 
                  onChange={e => setSelectedBillId(e.target.value)}
                >
                  <option value="">+ New Bill</option>
                  {activeBills.map(b => (
                     <option key={b.id} value={b.id}>{b.billNumber} (₹{b.grandTotal.toFixed(0)})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Item List (Ticket Style) */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#FDFDFF' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '80px', color: 'var(--text-muted)' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--bg-app)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <FileText size={28} strokeWidth={1.5} opacity={0.5} />
                </div>
                <p style={{ fontSize: '14px', fontWeight: '500' }}>Your order is empty</p>
                <p style={{ fontSize: '12px', opacity: 0.6 }}>Add items from the menu</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)', marginBottom: '4px' }}>{item.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>₹{item.price.toFixed(2)} × {item.quantity}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)', marginBottom: '2px' }}>₹{(item.price * item.quantity).toFixed(2)}</p>
                       <div className="flex items-center no-print" style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border)', padding: '2px' }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}><Minus size={12}/></button>
                        <span style={{ fontSize: '12px', minWidth: '24px', textAlign: 'center', fontWeight: '500' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--primary)' }}><Plus size={12}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Terminal Footer (Payment Summary) */}
          <div style={{ padding: '24px', background: 'white', borderTop: '1px solid var(--border)', boxShadow: '0 -10px 30px rgba(0,0,0,0.02)' }}>
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="flex justify-between">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Subtotal</span>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>GST (5%)</span>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: '1px dashed var(--border)' }}>
                <span style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-main)' }}>Grand Total</span>
                <span style={{ fontSize: '24px', fontWeight: '500', color: 'var(--primary)' }}>₹{total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => saveBill()} disabled={loading || !selectedTable} style={{ height: '52px', background: 'var(--bg-app)', border: 'none' }}>
                <Save size={18} /> SAVE
              </button>
              <button className="btn btn-outline" onClick={() => saveBill('kot')} disabled={loading || !selectedTable} style={{ height: '52px', background: 'var(--bg-app)', border: 'none' }}>
                <Printer size={18} /> KOT
              </button>
              <button className="btn btn-primary" onClick={handlePayment} disabled={loading || !selectedTable} style={{ height: '52px', boxShadow: '0 8px 20px rgba(124, 58, 237, 0.2)' }}>
                <CreditCard size={18} /> PAYMENT
              </button>
              <button className="btn btn-outline" onClick={handlePrint} disabled={loading || !selectedTable} style={{ height: '52px', background: 'var(--bg-app)', border: 'none' }}>
                <Printer size={18} /> PRINT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
