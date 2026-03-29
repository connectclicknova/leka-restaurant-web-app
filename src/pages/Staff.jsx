import React from 'react';
import { Users } from 'lucide-react';
import '../css/Staff.css';

const Staff = () => {
  return (
    <div style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ padding: '24px', background: 'white', borderRadius: '24px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <Users size={40} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-main)' }}>Staff Management</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
          We're building a powerful staff management system to help you track attendance, performance, and more.
        </p>
        <div style={{ padding: '8px 16px', background: 'var(--bg-app)', borderRadius: '100px', fontSize: '12px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '1px' }}>
          COMING SOON
        </div>
      </div>
    </div>
  );
};

export default Staff;
