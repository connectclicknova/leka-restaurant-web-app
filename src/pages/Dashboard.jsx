import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Calendar,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import '../css/Dashboard.css';

const Dashboard = () => {
  const stats = [
    { label: 'Total Sales', value: '$12,450', trend: '+12.5%', isUp: true, icon: DollarSign },
    { label: 'Total Orders', value: '1,354', trend: '+16.5%', isUp: true, icon: ShoppingBag },
    { label: 'Total Customers', value: '40,523', trend: '-0.5%', isUp: false, icon: Users },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="flex gap-4">
          <button className="btn btn-outline">
            <Calendar size={18} />
            March 2026
          </button>
          <button className="btn btn-primary" onClick={() => window.location.href = '/billing'}>
            <Plus size={18} />
            New Order
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-box">
                <stat.icon size={20} />
              </div>
              <div className={`stat-trend ${stat.isUp ? 'trend-up' : 'trend-down'}`}>
                {stat.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {stat.trend}
              </div>
            </div>
            <p className="stat-value">{stat.value}</p>
            <p className="stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 style={{ fontSize: '16px', fontWeight: '500' }}>Sales Analytics</h3>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>Monthly</button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', paddingBottom: '10px' }}>
            {[40, 60, 45, 90, 65, 80, 55].map((h, i) => (
              <div key={i} style={{ flex: 1, background: i === 3 ? 'var(--primary)' : '#EDF2F7', height: `${h}%`, borderRadius: '6px' }}></div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        <div className="stat-card" style={{ height: '300px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '20px' }}>Top Items</h3>
          <div className="flex-col gap-4">
            {[
              { name: 'Chicken Biryani', sales: '240 orders' },
              { name: 'Paneer Butter Masala', sales: '180 orders' },
              { name: 'Garlic Naan', sales: '150 orders' }
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3" style={{ background: 'var(--bg-app)', borderRadius: '10px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '500' }}>{item.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.sales}</p>
                </div>
                <MoreHorizontal size={16} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="table-container">
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '500' }}>Recent Orders</h3>
          <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>View All</button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Table</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#12321</td>
              <td>Table 4</td>
              <td>3 Items</td>
              <td>$45.50</td>
              <td><span className="badge-status status-on-progress">On Process</span></td>
              <td><button className="btn" style={{ padding: '4px' }}><MoreHorizontal size={16}/></button></td>
            </tr>
            <tr>
              <td>#12322</td>
              <td>Table 2</td>
              <td>1 Item</td>
              <td>$12.00</td>
              <td><span className="badge-status status-pending">Pending</span></td>
              <td><button className="btn" style={{ padding: '4px' }}><MoreHorizontal size={16}/></button></td>
            </tr>
            <tr>
              <td>#12323</td>
              <td>Takeaway</td>
              <td>5 Items</td>
              <td>$89.00</td>
              <td><span className="badge-status status-delivered">Delivered</span></td>
              <td><button className="btn" style={{ padding: '4px' }}><MoreHorizontal size={16}/></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
