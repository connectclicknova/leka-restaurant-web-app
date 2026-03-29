import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, Plus, Minus, CreditCard, ChevronDown, Trash2, Printer, Save, FileText, CheckCircle } from 'lucide-react';
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
          <div className="grid-items" style={{ gap: '20px' }}>
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
                  <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                  <div className="flex justify-between items-center">
                     <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.shortcode || '-'}</p>
                     <p style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '16px' }}>₹{item.price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Terminal */}
        <div className="stat-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: '#FCFCFD' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Terminal</h3>
          </div>
          
          <div style={{ padding: '16px', background: '#F8F9FD', borderBottom: '1px solid var(--border)' }} className="no-print">
            <div className="flex gap-2">
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>TABLE</label>
                <select 
                  className="search-input"
                  style={{ marginBottom: '0', height: '42px', fontSize: '13px' }}
                  value={selectedTable} 
                  onChange={e => { setSelectedTable(e.target.value); setSelectedBillId(''); }}
                >
                  <option value="">Table</option>
                  {tables.map(t => <option key={t.id} value={t.shortcode}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1.5 }}>
                <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>ACTIVE BILL</label>
                <select 
                  className="search-input"
                  style={{ marginBottom: '0', height: '42px', fontSize: '13px' }}
                  disabled={!selectedTable}
                  value={selectedBillId} 
                  onChange={e => setSelectedBillId(e.target.value)}
                >
                  <option value="">+ New Bill</option>
                  {activeBills.map(b => (
                     <option key={b.id} value={b.id}>{b.billNumber} (₹{b.grandTotal.toFixed(2)})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-muted)' }}>
                <FileText size={48} strokeWidth={1} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <p style={{ fontSize: '14px' }}>Bill is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center mb-6">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600' }}>{item.name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>₹{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center no-print" style={{ background: '#F8F9FD', borderRadius: '8px', padding: '4px' }}>
                      <button className="btn" onClick={() => updateQuantity(item.id, -1)} style={{ padding: '2px', border: 'none', background: 'transparent', boxShadow: 'none' }}><Minus size={14}/></button>
                      <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }}>{item.quantity}</span>
                      <button className="btn" onClick={() => updateQuantity(item.id, 1)} style={{ padding: '2px', border: 'none', background: 'transparent', boxShadow: 'none' }}><Plus size={14}/></button>
                    </div>
                    <p style={{ width: '60px', textAlign: 'right', fontSize: '14px', fontWeight: '700' }}>₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '24px', background: '#FCFCFD', borderTop: '1px solid var(--border)' }}>
            <div className="flex justify-between mb-4">
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Subtotal</span>
              <span style={{ fontSize: '15px', fontWeight: '600' }}>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span style={{ fontSize: '16px', fontWeight: '800' }}>TOTAL</span>
              <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)' }}>₹{total.toFixed(2)}</span>
            </div>
            
            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => saveBill()} disabled={loading || !selectedTable} style={{ padding: '14px' }}>
                <Save size={18} /> SAVE
              </button>
              <button className="btn btn-outline" onClick={() => saveBill('kot')} disabled={loading || !selectedTable} style={{ padding: '14px' }}>
                <Printer size={18} /> KOT
              </button>
              <button className="btn btn-primary" onClick={handlePayment} style={{ gridColumn: 'span 2', padding: '14px' }} disabled={loading || !selectedTable}>
                <CheckCircle size={18} /> PROCEED TO PAYMENT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
