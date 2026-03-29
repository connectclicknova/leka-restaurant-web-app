import React from 'react';

const Dashboard = () => {
  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>
      <div className="grid-items">
        <div className="card">
          <label>Sales Overview</label>
          <p style={{ fontSize: '32px', fontWeight: '700' }}>$1,240.00</p>
          <p style={{ fontSize: '11px', color: 'green' }}>+12% vs yesterday</p>
        </div>
        <div className="card">
          <label>Total Bills</label>
          <p style={{ fontSize: '32px', fontWeight: '700' }}>42</p>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Today's count</p>
        </div>
        <div className="card">
          <label>Active Tables</label>
          <p style={{ fontSize: '32px', fontWeight: '700' }}>8 / 12</p>
          <p style={{ fontSize: '11px', color: 'red' }}>High demand</p>
        </div>
      </div>
      
      <div className="card mt-4" style={{ marginTop: '24px' }}>
        <label>Recent Transactions</label>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Table</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#1042</td>
              <td>T-04</td>
              <td>$45.50</td>
              <td>Paid</td>
              <td>14:32</td>
            </tr>
            <tr>
              <td>#1041</td>
              <td>T-02</td>
              <td>$78.00</td>
              <td>Paid</td>
              <td>14:15</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
