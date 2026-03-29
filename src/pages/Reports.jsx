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
    <div className="flex-col gap-10" style={{ paddingBottom: '60px' }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 color="var(--primary-color)" /> Sales Analysis
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Item-wise performance report for your restaurant</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label style={{ margin: 0, fontSize: '12px', color: '#999' }}>TIME PERIOD:</label>
          <div style={{ position: 'relative', width: '200px' }}>
            <select 
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)}
              style={{ paddingLeft: '40px', marginBottom: '0', background: 'white', borderRadius: '8px', cursor: 'pointer' }}
            >
              {filterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#666' }} />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '8px' }}>
        <div className="card" style={{ padding: '24px', border: 'none', background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', color: 'white' }}>
          <div className="flex justify-between items-start">
            <div>
              <p style={{ fontSize: '14px', fontWeight: '500', opacity: '0.9', marginBottom: '8px' }}>TOTAL REVENUE</p>
              <h2 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-0.5px' }}>₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
            </div>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
              <TrendingUp size={24} />
            </div>
          </div>
          <p style={{ marginTop: '16px', fontSize: '12px', opacity: '0.8' }}>Generated from {totalSales} confirmed bills</p>
        </div>

        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', background: '#f0eefc', borderRadius: '50%', color: 'var(--primary-color)' }}>
            <Package size={28} />
          </div>
          <div>
            <p style={{ fontSize: '14px', color: '#999', fontWeight: '500' }}>MENU ITEMS SOLD</p>
            <h2 style={{ fontSize: '28px', fontWeight: '800' }}>{itemWiseData.length} <span style={{ fontSize: '14px', color: '#ccc', fontWeight: '400' }}>Unique Items</span></h2>
          </div>
        </div>
      </div>

      {/* Item Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="card-header" style={{ margin: 0, padding: '16px 20px', display: 'flex', justifyBetween: 'true', alignItems: 'center' }}>
          <h2 style={{ fontSize: '15px' }}>ITEMIZED PERFORMANCE</h2>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#999', background: '#f6f6f7', padding: '4px 8px', borderRadius: '100px' }}>
            {itemWiseData.length} ITEMS FOUND
          </div>
        </div>
        
        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table className="table">
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ width: '40%', paddingLeft: '24px' }}>Item Name</th>
                <th style={{ textAlign: 'center' }}>Qty Sold</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              {itemWiseData.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
                    No sales data found for the selected time period.
                  </td>
                </tr>
              ) : (
                itemWiseData.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ paddingLeft: '24px' }}>
                      <div className="flex items-center gap-3">
                        <span style={{ fontSize: '12px', color: '#ccc', fontWeight: '600', width: '20px' }}>{idx + 1}</span>
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ padding: '4px 10px', background: '#eef2ff', color: '#4f46e5', borderRadius: '100px', fontSize: '13px', fontWeight: '700' }}>
                        {item.quantity}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '24px', fontWeight: '800', color: 'var(--text-primary)', fontSize: '15px' }}>
                      ₹{item.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
