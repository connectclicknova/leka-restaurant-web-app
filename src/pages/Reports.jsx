import React from 'react';

const Reports = () => {
  return (
    <div>
      <h1 className="mb-4">Reports</h1>
      <div className="grid-items">
        <div className="card">
          <label>Daily Revenue</label>
          <p style={{ fontSize: '24px', fontWeight: '800' }}>$12,450.00</p>
          <div style={{ height: '100px', background: '#f4f4f4', border: '1px solid #ddd', marginTop: '8px' }}>
            {/* Chart Placeholder */}
          </div>
        </div>
        <div className="card">
          <label>Top Selling Items</label>
          <ul style={{ listStyle: 'none', padding: '8px 0', fontSize: '13px' }}>
            <li className="flex justify-between mb-2"><span>1. Margherita Pizza</span> <span>42</span></li>
            <li className="flex justify-between mb-2"><span>2. Veg Burger</span> <span>35</span></li>
            <li className="flex justify-between mb-2"><span>3. Pasta Carbonara</span> <span>28</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Reports;
