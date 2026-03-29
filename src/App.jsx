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
import AllBills from './pages/AllBills'; // Add this line
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
  ChevronRight,
  FileText,
  Search,
  Bell,
  Info,
  ChevronDown
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

  const mainLinks = [
    { to: '/', name: 'Dashboard', icon: LayoutDashboard },
    { to: '/billing', name: 'Billing', icon: Receipt },
    { to: '/all-bills', name: 'All Bills', icon: FileText },
    { to: '/items', name: 'Items', icon: Package },
    { to: '/categories', name: 'Categories', icon: Tag },
    { to: '/tables', name: 'Tables', icon: Layout },
  ];

  const managementLinks = [
    { to: '/reports', name: 'Reports', icon: BarChart3 },
    { to: '/investments', name: 'Investments', icon: Wallet },
    { to: '/staff', name: 'Staff', icon: Users },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-box">L</div>
        <span className="logo-text">Deliro</span>
      </div>
      
      <div className="sidebar-nav">
        <div className="sidebar-group">
          <p className="sidebar-group-label">Main</p>
          {mainLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              <link.icon size={18} />
              {link.name}
            </Link>
          ))}
        </div>

        <div className="sidebar-group">
          <p className="sidebar-group-label">Management</p>
          {managementLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              <link.icon size={18} />
              {link.name}
            </Link>
          ))}
        </div>

        <div className="sidebar-pro-card">
          <p className="pro-card-title">Pro Plans</p>
          <p className="pro-card-desc">Upgrade to get more features and better analytics.</p>
          <button className="btn btn-pro">Try Pro</button>
        </div>
      </div>
    </aside>
  );
};

const TopBar = () => {
  const { restaurant, logout, user } = useAuth();
  
  return (
    <div className="top-bar">
      <div className="search-container">
        <div className="search-icon"><Search size={18} /></div>
        <input type="text" className="search-input" placeholder="Search orders, bills..." />
      </div>

      <div className="top-bar-actions">
        <div className="action-icon"><Bell size={20} /></div>
        <div className="action-icon"><Info size={20} /></div>
        
        <div className="user-profile">
          <img 
            src={user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} 
            className="user-avatar" 
            alt="Profile" 
          />
          <div className="user-info">
            <p className="name">Welcome, {user?.displayName?.split(' ')[0] || 'User'}!</p>
          </div>
          <ChevronDown size={16} />
        </div>
        
        <button onClick={logout} className="action-icon" title="Sign Out">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
};

const DashboardLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <div className="page-container">
          {children}
        </div>
      </div>
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
          <Route path="/all-bills" element={<ProtectedRoute><DashboardLayout><AllBills /></DashboardLayout></ProtectedRoute>} />
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
