import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import '../css/Login.css';

const Login = () => {
  const { user, loginWithGoogle } = useAuth();

  if (user) return <Navigate to="/" />;

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
          <div className="logo-box" style={{ width: '48px', height: '48px', fontSize: '24px' }}>L</div>
          <span className="logo-text" style={{ fontSize: '28px' }}>Deliro</span>
        </div>
        
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main)' }}>Welcome back!</h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '40px' }}>
          Please sign in to access your dashboard.
        </p>
        
        <button 
          onClick={loginWithGoogle} 
          className="btn btn-primary" 
          style={{ width: '100%', height: '56px', fontSize: '16px', gap: '12px' }}
        >
          <LogIn size={20} />
          Sign in with Google
        </button>
        
        <div style={{ marginTop: '40px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} CONNECT CLICK NOVA
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
