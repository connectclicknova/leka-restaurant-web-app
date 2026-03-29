import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, Eye, Trash2, Calendar, Clock, DollarSign, Filter, CreditCard } from 'lucide-react';

const AllBills = () => {
  const { restaurant } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!restaurant?.id) return;

    const q = query(
      collection(db, 'restaurants', restaurant.id, 'bills'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (s) => {
      setBills(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [restaurant]);

  const deleteBill = async (id) => {
    if (window.confirm("Confirm delete this bill records?")) {
      await deleteDoc(doc(db, 'restaurants', restaurant.id, 'bills', id));
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid': return <span className="badge badge-success">PAID</span>;
      case 'pending':
      case 'open': return <span className="badge badge-neutral">OPEN</span>;
      case 'kot': return <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>KOT SENT</span>;
      default: return <span className="badge badge-neutral">{status.toUpperCase()}</span>;
    }
  };

  if (loading) return <div className="p-6">Loading records...</div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center no-print">
        <div>
          <h1>Bill History</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>View and manage all your restaurant sales records</p>
        </div>
      </div>

      <div className="card no-print" style={{ padding: '16px' }}>
        <div className="flex gap-4">
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#999' }} />
            <input 
              placeholder="Search by Bill No or Table..." 
              style={{ paddingLeft: '40px', marginBottom: '0', height: '38px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            style={{ width: '180px', marginBottom: '0', height: '38px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="open">Open Bills</option>
            <option value="kot">Active KOTs</option>
            <option value="paid">Paid Records</option>
          </select>
        </div>
      </div>

      <div className="table-container shadow-sm">
        <table className="table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Bill Number</th>
              <th>Table</th>
              <th>Items (Qty)</th>
              <th>Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map(bill => (
              <tr key={bill.id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '500' }}>{new Date(bill.createdAt).toLocaleDateString()}</span>
                    <span style={{ fontSize: '11px', color: '#999' }}>{new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </td>
                <td style={{ fontWeight: '600' }}>{bill.billNumber}</td>
                <td>
                   <div className="flex items-center gap-2">
                     <span style={{ padding: '4px 8px', background: '#f6f6f7', borderRadius: '4px', fontSize: '12px', fontWeight: '800' }}>
                       T-{bill.tableNumber}
                     </span>
                   </div>
                </td>
                <td>{bill.items?.length || 0} items ({bill.items?.reduce((a,c) => a+c.quantity, 0) || 0} qty)</td>
                <td style={{ fontWeight: '700' }}>₹{bill.grandTotal.toFixed(2)}</td>
                <td>{getStatusBadge(bill.status)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => deleteBill(bill.id)} style={{ padding: '6px', color: '#ff4d4f', border: 'none', background: 'transparent' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredBills.length === 0 && (
          <div className="p-8 text-center" style={{ color: '#999' }}>
            No bill records found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default AllBills;
