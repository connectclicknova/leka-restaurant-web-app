import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import SubscriptionGate from './pages/SubscriptionGate';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Items from './pages/Items';
import Categories from './pages/Categories';
import Tables from './pages/Tables';
import Reports from './pages/Reports';
import Investments from './pages/Investments';
import Staff from './pages/Staff';
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  Tag, 
  Layout, 
  BarChart3, 
  Wallet, 
  Users, 
  LogOut,
  ChevronRight
} from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading, restaurant, isSubscriptionActive } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  
  // New User Onboarding Check
  if (!restaurant?.onboardingComplete) {
    return <Navigate to="/onboarding" />;
  }

  // Subscription Active Check
  if (!isSubscriptionActive()) {
    return <SubscriptionGate />;
  }

  return children;
};

const Sidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const links = [
    { to: '/', name: 'Dashboard', icon: LayoutDashboard },
    { to: '/billing', name: 'Billing', icon: Receipt },
    { to: '/items', name: 'Items', icon: Package },
    { to: '/categories', name: 'Categories', icon: Tag },
    { to: '/tables', name: 'Tables', icon: Layout },
    { to: '/reports', name: 'Reports', icon: BarChart3 },
    { to: '/investments', name: 'Investments', icon: Wallet },
    { to: '/staff', name: 'Staff', icon: Users },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--primary-color)', borderRadius: '6px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800' }}>
            L
          </div>
          <span style={{ fontWeight: '800', letterSpacing: '-0.5px' }}>LEKA</span>
        </h2>
      </div>
      
      <div className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-link ${location.pathname === link.to ? 'active' : ''}`}
          >
            <link.icon size={20} strokeWidth={location.pathname === link.to ? 2.5 : 2} />
            {link.name}
            {location.pathname === link.to && <div style={{ marginLeft: 'auto' }}><ChevronRight size={14} /></div>}
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 'auto', padding: '12px', borderTop: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-3 p-2 mb-2">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="User" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={16}/></div>
          )}
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName}</p>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Restaurant Admin</p>
          </div>
        </div>
        <button onClick={logout} className="sidebar-link" style={{ width: '100%', border: 'none', background: 'transparent' }}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

const DashboardLayout = ({ children }) => {
  const { restaurant } = useAuth();
  return (
    <div className="app-wrapper">
      <Sidebar />
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto' }}>
        <header style={{ height: '56px', background: 'white', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            Restaurant: <span style={{ color: 'var(--text-primary)' }}>{restaurant?.name || 'Default Restaurant'}</span>
          </p>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute><DashboardLayout><Billing /></DashboardLayout></ProtectedRoute>} />
          <Route path="/items" element={<ProtectedRoute><DashboardLayout><Items /></DashboardLayout></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><DashboardLayout><Categories /></DashboardLayout></ProtectedRoute>} />
          <Route path="/tables" element={<ProtectedRoute><DashboardLayout><Tables /></DashboardLayout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><DashboardLayout><Reports /></DashboardLayout></ProtectedRoute>} />
          <Route path="/investments" element={<ProtectedRoute><DashboardLayout><Investments /></DashboardLayout></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute><DashboardLayout><Staff /></DashboardLayout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
