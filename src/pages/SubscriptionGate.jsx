import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Phone, Mail, LogOut, ArrowRight } from 'lucide-react';

const SubscriptionGate = () => {
  const { logout, restaurant, user } = useAuth();
  
  const contactEmail = "support@leka.com";
  const contactPhone = "+91 6760654356";

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-app)',
      padding: '24px'
    }}>
      <div className="stat-card" style={{ 
        maxWidth: '480px', 
        width: '100%', 
        padding: '48px 40px',
        textAlign: 'center',
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0, 102, 255, 0.05)'
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '24px', 
          background: 'var(--primary-light)', 
          color: 'var(--primary)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 24px',
          border: '1px solid rgba(0, 102, 255, 0.1)'
        }}>
          <CreditCard size={36} />
        </div>
        
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '900', 
          color: 'var(--text-main)', 
          marginBottom: '12px',
          letterSpacing: '-0.5px'
        }}>Activate Your Terminal</h1>
        
        <p style={{ 
          fontSize: '15px', 
          color: 'var(--text-muted)', 
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          Welcome, <strong>{user?.displayName?.split(' ')[0] || 'Partner'}</strong>! 
          To unlock the LEKA Restaurant POS terminal and start managing your orders, please activate your subscription plan.
        </p>

        <div style={{ 
          background: 'var(--bg-app)', 
          padding: '24px', 
          borderRadius: '16px', 
          marginBottom: '32px',
          border: '1px solid var(--border)',
          textAlign: 'left'
        }}>
          <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Support Assistant</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href={`tel:${contactPhone}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>
              <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}><Phone size={18} /></div>
              {contactPhone}
            </a>
            <a href={`mailto:${contactEmail}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>
              <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}><Mail size={18} /></div>
              {contactEmail}
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => window.open('https://leka.com/pricing', '_blank')}
            style={{ flex: 1.5, height: '56px', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Upgrade <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>
          
          <button 
            onClick={logout} 
            className="btn btn-outline"
            style={{ flex: 1, height: '56px', fontSize: '14px', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <LogOut size={18} style={{ marginRight: '8px' }} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionGate;
