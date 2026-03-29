import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search, Printer, Calendar, Clock, DollarSign, Filter, CreditCard } from 'lucide-react';
import '../css/AllBills.css';

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

  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePrintReceipt = (bill) => {
    // For now, basic print functionality
    // In a real scenario, you'd show a hidden receipt template first
    window.print();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid': return <span className="badge-status status-delivered">PAID</span>;
      case 'pending':
      case 'open': return <span className="badge-status status-on-progress">OPEN</span>;
      case 'kot': return <span className="badge-status" style={{ background: '#E0F2FE', color: '#0369A1' }}>KOT SENT</span>;
      default: return <span className="badge-status" style={{ background: 'var(--bg-app)', color: 'var(--text-muted)' }}>{status.toUpperCase()}</span>;
    }
  };

  if (loading) return <div className="p-8"><p style={{ color: 'var(--text-muted)' }}>Loading records...</p></div>;

  return (
    <div className="all-bills-page">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Bill History</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>View and manage all your restaurant sales records</p>
        </div>
      </div>

      <div className="stat-card no-print" style={{ padding: '20px', marginBottom: '24px' }}>
        <div className="flex gap-4">
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              className="search-input"
              placeholder="Search by Bill No or Table..." 
              style={{ paddingLeft: '40px', marginBottom: '0' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="search-input"
            style={{ width: '200px', marginBottom: '0' }}
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
              <th>Items</th>
              <th>Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }} className="no-print">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map(bill => (
              <tr key={bill.id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{new Date(bill.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </td>
                <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{bill.billNumber}</td>
                <td>
                   <div className="flex items-center">
                     <span style={{ padding: '4px 10px', background: 'var(--bg-app)', borderRadius: '6px', fontSize: '13px', fontWeight: '800', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                       {bill.tableNumber}
                     </span>
                   </div>
                </td>
                <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {bill.items?.length || 0} items ({bill.items?.reduce((a,c) => a+c.quantity, 0) || 0} qty)
                </td>
                <td style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '15px' }}>₹{bill.grandTotal.toFixed(2)}</td>
                <td>{getStatusBadge(bill.status)}</td>
                <td style={{ textAlign: 'right' }} className="no-print">
                  <button onClick={() => handlePrintReceipt(bill)} className="btn btn-outline" style={{ padding: '8px', color: 'var(--primary)', border: 'none', background: 'transparent', boxShadow: 'none' }}>
                    <Printer size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredBills.length === 0 && (
          <div className="p-12 text-center no-print">
            <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.1 }} />
            <p style={{ color: 'var(--text-muted)' }}>No bill records found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllBills;
