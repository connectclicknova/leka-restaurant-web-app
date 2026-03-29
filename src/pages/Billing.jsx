import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, Plus, Minus, CreditCard, ChevronDown, Trash2, Printer, Save, FileText, CheckCircle } from 'lucide-react';

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
    <div className="billing-grid">
      {/* Search and Product Selection */}
      <div className="flex-col" style={{ overflowY: 'auto', paddingRight: '8px' }}>
        <div className="mb-6 flex gap-4 no-print">
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
            style={{ width: '180px', marginBottom: '0', height: '42px' }}
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
            >
              <div style={{ height: '120px', background: '#f6f6f7', position: 'relative' }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                    <Plus size={24} strokeWidth={1} />
                  </div>
                )}
                {item.isVeg && <div style={{ position: 'absolute', top: '8px', right: '8px', width: '10px', height: '10px', border: '1px solid green', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'green' }}/></div>}
              </div>
              <div className="p-3">
                <p style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                <div className="flex justify-between items-center">
                   <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.shortcode || '-'}</p>
                   <p style={{ color: 'var(--primary-color)', fontWeight: '700', fontSize: '14px' }}>${item.price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart/Summary Section */}
      <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="card-header" style={{ margin: '0', background: 'white' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800' }}>BILLING TERMINAL</h2>
        </div>
        
        <div className="p-4 no-print" style={{ background: '#fafafa', borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex gap-2">
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#999' }}>TABLE</label>
              <select 
                value={selectedTable} 
                onChange={e => { setSelectedTable(e.target.value); setSelectedBillId(''); }}
                style={{ marginBottom: '8px', height: '38px' }}
              >
                <option value="">Select Table</option>
                {tables.map(t => <option key={t.id} value={t.shortcode}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1.5 }}>
              <label style={{ fontSize: '11px', color: '#999' }}>ACTIVE BILLS</label>
              <select 
                value={selectedBillId} 
                onChange={e => setSelectedBillId(e.target.value)}
                style={{ marginBottom: '8px', height: '38px' }}
                disabled={!selectedTable}
              >
                <option value="">+ New Bill</option>
                {activeBills.map(b => (
                   <option key={b.id} value={b.id}>{b.billNumber} (${b.grandTotal.toFixed(2)}) - {b.status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '40px', color: '#ccc' }}>
              <FileText size={40} strokeWidth={1} style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '12px' }}>No items in selected bill</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center mb-4">
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>{item.name}</p>
                  <p style={{ fontSize: '11px', color: '#666' }}>${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center no-print" style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '2px', height: '24px', border: 'none', background: 'transparent' }}><Minus size={12}/></button>
                    <span style={{ padding: '0 6px', fontSize: '12px', fontWeight: '700' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '2px', height: '24px', border: 'none', background: 'transparent' }}><Plus size={12}/></button>
                  </div>
                  <p style={{ width: '50px', textAlign: 'right', fontSize: '13px', fontWeight: '700' }}>${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5" style={{ background: '#f6f6f7', borderTop: '1px solid var(--border-color)' }}>
          <div className="flex justify-between mb-2">
            <span style={{ fontSize: '12px', color: '#666' }}>Subtotal</span>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-4" style={{ paddingTop: '8px', borderTop: '1px dashed #ccc' }}>
            <span style={{ fontSize: '14px', fontWeight: '800' }}>TOTAL</span>
            <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--primary-color)' }}>${total.toFixed(2)}</span>
          </div>
          
          <div className="grid no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button onClick={() => saveBill()} disabled={loading || !selectedTable} style={{ padding: '12px' }}>
              <Save size={16} /> SAVE
            </button>
            <button onClick={() => saveBill('kot')} disabled={loading || !selectedTable} style={{ padding: '12px' }}>
              <FileText size={16} /> KOT
            </button>
            <button onClick={handlePayment} className="primary" style={{ padding: '12px', gridColumn: 'span 2' }} disabled={loading || !selectedTable}>
              <CheckCircle size={16} /> PAYMENT
            </button>
            <button onClick={handlePrint} style={{ padding: '12px', gridColumn: 'span 2' }}>
              <Printer size={16} /> PRINT BILL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
