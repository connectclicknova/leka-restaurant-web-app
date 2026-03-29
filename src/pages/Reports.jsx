import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Calendar, 
  ChevronDown, 
  ArrowUpRight, 
  Filter 
} from 'lucide-react';
import '../css/Reports.css';

const Reports = () => {
  const { restaurant } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today'); // today, yesterday, this_month, last_month, this_year, last_year

  useEffect(() => {
    if (!restaurant?.id) return;

    // Fetch all paid bills for the restaurant
    const q = query(
      collection(db, 'restaurants', restaurant.id, 'bills'),
      where('status', '==', 'paid'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (s) => {
      setBills(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [restaurant]);

  // Filtering Logic
  const filteredBills = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    // Previous day calculation
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    // Previous month calculation
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(now.getMonth() - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    return bills.filter(bill => {
      const billDate = new Date(bill.createdAt);
      
      switch (dateFilter) {
        case 'today':
          return billDate.toDateString() === todayStr;
        case 'yesterday':
          return billDate.toDateString() === yesterdayStr;
        case 'this_month':
          return billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear();
        case 'last_month':
          return billDate.getMonth() === lastMonth && billDate.getFullYear() === lastMonthYear;
        case 'this_year':
          return billDate.getFullYear() === now.getFullYear();
        case 'last_year':
          return billDate.getFullYear() === now.getFullYear() - 1;
        default:
          return true;
      }
    });
  }, [bills, dateFilter]);

  // Aggregation Logic
  const { itemWiseData, totalSales, totalRevenue } = useMemo(() => {
    const aggregate = {};
    let salesCount = filteredBills.length;
    let revenueSum = 0;

    filteredBills.forEach(bill => {
      revenueSum += bill.grandTotal || 0;
      
      bill.items?.forEach(item => {
        if (!aggregate[item.itemId]) {
          aggregate[item.itemId] = {
            id: item.itemId,
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        aggregate[item.itemId].quantity += item.quantity || 0;
        aggregate[item.itemId].revenue += (item.price * item.quantity) || 0;
      });
    });

    return {
      itemWiseData: Object.values(aggregate).sort((a, b) => b.revenue - a.revenue),
      totalSales: filteredBills.length,
      totalRevenue: revenueSum
    };
  }, [filteredBills]);

  const filterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
  ];

  if (loading) return <div className="p-6">Generating report...</div>;

  return (
    <div className="reports-page">
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Sales Analysis</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Item-wise performance report for your restaurant</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div style={{ position: 'relative' }}>
            <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <select 
              className="search-input"
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)}
              style={{ paddingLeft: '40px', marginBottom: '0', background: 'white', width: '200px' }}
            >
              {filterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid mb-8">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #0066FF, #0047B3)', color: 'white', border: 'none' }}>
          <div className="stat-header">
            <div className="stat-icon-box" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              <DollarSign size={20} />
            </div>
            <div className="stat-trend trend-up" style={{ color: 'rgba(255,255,255,0.9)' }}>
              <TrendingUp size={14} /> +15.5%
            </div>
          </div>
          <p className="stat-value" style={{ color: 'white' }}>₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="stat-label" style={{ color: 'rgba(255,255,255,0.7)' }}>TOTAL REVENUE ({totalSales} Bills)</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-box">
              <Package size={20} />
            </div>
            <div className="stat-trend trend-up">
              <TrendingUp size={14} /> Good performance
            </div>
          </div>
          <p className="stat-value">{itemWiseData.length}</p>
          <p className="stat-label">UNIQUE ITEMS SOLD</p>
        </div>
      </div>

      {/* Item Table */}
      <div className="table-container">
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FCFCFD' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Itemized Performance</h3>
          <span className="badge-status status-delivered">{itemWiseData.length} items sold</span>
        </div>
        
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
              <th>Item Name</th>
              <th style={{ textAlign: 'center' }}>Quantity Sold</th>
              <th style={{ textAlign: 'right' }}>Net Revenue</th>
            </tr>
          </thead>
          <tbody>
            {itemWiseData.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
                  No sales data found for the selected period.
                </td>
              </tr>
            ) : (
              itemWiseData.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: '800', color: idx < 3 ? 'var(--primary)' : 'var(--text-muted)', fontSize: '14px' }}>#{idx + 1}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '15px' }}>{item.name}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ padding: '6px 12px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '10px', fontSize: '13px', fontWeight: '800' }}>
                      {item.quantity}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--text-main)', fontSize: '16px' }}>
                    ₹{item.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
