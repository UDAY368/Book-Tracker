import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Distribution from './pages/Distribution';
import BookUpdate from './pages/BookUpdate';
import BookRegister from './pages/BookRegister';
import Leaderboard from './components/Leaderboard';
import { User } from './types';
import { api } from './services/api';

// Placeholder Components for routes not yet fully implemented
const Collection = () => (
  <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200">
    <h2 className="text-2xl font-bold mb-4">Book Collection & Return</h2>
    <p className="text-slate-600">Module for Receiver and Incharges to mark books as returned and log collected amounts.</p>
  </div>
);

const DonorSubmit = () => (
  <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200">
    <h2 className="text-2xl font-bold mb-4">Donor Submission</h2>
    <p className="text-slate-600">Submit donor details and payment information here.</p>
  </div>
);

const UserManagement = () => (
  <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200">
    <h2 className="text-2xl font-bold mb-4">User Management</h2>
    <p className="text-slate-600">Super Admin console to approve pending users (Distributors, Receivers, Incharges).</p>
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
       <strong>3 Pending Approvals</strong> waiting for review.
    </div>
  </div>
);

const Analytics = () => (
  <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200">
    <h2 className="text-2xl font-bold mb-4">Advanced Analytics</h2>
    <p className="text-slate-600">Detailed reports on distribution spread, collection efficiency, and zone-wise performance.</p>
  </div>
);

const Settings = () => (
  <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200">
    <h2 className="text-2xl font-bold mb-4">System Settings</h2>
    <p className="text-slate-600">Configure batch numbers, printing vendors, and application defaults.</p>
  </div>
);

const Help = () => (
  <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200">
    <h2 className="text-2xl font-bold mb-4">Help & Support</h2>
    <p className="text-slate-600">User guides, FAQs, and contact support for PSSM Connect.</p>
  </div>
);

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedUser = api.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    api.saveUserSession(userData);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading PSSM Connect...</p>
        </div>
      </div>
    );
  }

  // Signup Flow
  if (isSigningUp) {
    return <Signup onBack={() => setIsSigningUp(false)} />;
  }

  // Login Flow
  if (!user) {
    return <Login onLogin={handleLogin} onGoToSignup={() => setIsSigningUp(true)} />;
  }

  return (
    <Router>
      <Layout userRole={user.role} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard role={user.role} />} />
          <Route path="/distribution" element={<Distribution role={user.role} />} />
          <Route path="/book-update" element={<BookUpdate />} />
          <Route path="/donor-submit" element={<DonorSubmit />} />
          <Route path="/book-register" element={<BookRegister />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          {/* Catch-all for 404s */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;