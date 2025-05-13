import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from '../src/pages/Home';
import Login from '../src/pages/Login';
import Signup from '../src/pages/Signup';
import Dashboard from '../src/pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Alerts from './pages/Alerts';
import AccountSettings from './pages/AccountSettings';
import AdminProfile from './pages/AdminProfile';

const PageTitleHandler = () => {
  const location = useLocation();

  useEffect(() => {
    const pageTitles = {
      '/': 'Home | Fraudulert',
      '/login': 'Login | Fraudulert',
      '/signup': 'Sign Up | Fraudulert',
      '/dashboard':'Dashboard | Fraudulert',
      '/accounts': 'Accounts | Fraudulert',
      '/transactions': 'Transactions | Fraudulert',
      '/alerts':'Alerts | Fraudulert',
      '/accountsettings':'Account Settings | Fraudulert',
      '/adminprofile':'Admin Profile | Fraudulert'
    };

    document.title = pageTitles[location.pathname] || 'Fraudulert';
  }, [location.pathname]);

  return null;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Redirect to login page with the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <PageTitleHandler />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/accounts" element={
            <ProtectedRoute>
              <Accounts />
            </ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          } />
          <Route path="/alerts" element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          } />
          <Route path="/accountsettings" element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          } />
          <Route path="/adminprofile" element={
            <ProtectedRoute>
              <AdminProfile />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;