import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Phone, Mail, LogOut } from 'lucide-react';

const SubscriptionGate = () => {
  const { logout, restaurant } = useAuth();
  
  const contactEmail = "support@connectclicknova.com";
  const contactPhone = "+91 676065435614";

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#f6f6f7',
      padding: '24px'
    }}>
      <div className="card" style={{ 
        maxWidth: '500px', 
        width: '100%', 
        borderTop: '5px solid #d93025',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <ShieldAlert size={64} style={{ color: '#d93025', filter: 'opacity(0.8)' }} />
        </div>
        
        <h1 style={{ marginBottom: '16px', letterSpacing: '-1px' }}>SUBSCRIPTION REQUIRED</h1>
        
        <div className="p-4" style={{ background: '#fffcfc', border: '1px solid #fce8e6', borderRadius: '8px', marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
            {restaurant?.onboardingComplete 
              ? "Your account access is currently restricted. To begin using LEKA Restaurant POS, please activate your subscription plan."
              : "Welcome! Your onboarding is complete, but your account is pending activation."}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Contact Administrator</p>
          <div className="flex items-center justify-center gap-4">
            <a href={`tel:${contactPhone}`} className="flex items-center gap-2" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
              <Phone size={16} /> {contactPhone}
            </a>
            <div style={{ width: '1px', height: '20px', background: '#ddd' }}></div>
            <a href={`mailto:${contactEmail}`} className="flex items-center gap-2" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
              <Mail size={16} /> {contactEmail}
            </a>
          </div>
        </div>

        <button 
          onClick={logout} 
          style={{ width: '100%', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <LogOut size={16} /> Exit Terminal
        </button>
      </div>
    </div>
  );
};

export default SubscriptionGate;
