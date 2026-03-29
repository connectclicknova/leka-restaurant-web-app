import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const { user, loginWithGoogle } = useAuth();

  if (user) return <Navigate to="/" />;

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'white'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>LEKA</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          RESTAURANT BILLING SYSTEM / SWISS EDITION
        </p>
        
        <button 
          onClick={loginWithGoogle} 
          className="primary" 
          style={{ width: '100%', height: '48px', fontSize: '16px' }}
        >
          Sign in with Google
        </button>
        
        <div style={{ marginTop: '24px', borderTop: '1px solid #ddd', paddingTop: '16px' }}>
          <p style={{ fontSize: '10px', color: '#999' }}>
            © {new Date().getFullYear()} CONNECT CLICK NOVA
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
