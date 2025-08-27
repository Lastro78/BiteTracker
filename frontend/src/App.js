import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FishingProvider } from './contexts/FishingContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import LogCatch from './pages/LogCatch';
import BulkUpload from './pages/BulkUpload';
import ViewCatches from './pages/ViewCatches';
import Analytics from './pages/Analytics';
import HeatMapPage from './pages/HeatMapPage';
import ManageOptions from './pages/ManageOptions';
import EnhancedAnalytics from './pages/EnhancedAnalytics';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirects to home if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return isAuthenticated ? <Navigate to="/" /> : children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FishingProvider>
          <Router>
            <div className="App">
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                  <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/log-catch" element={<ProtectedRoute><LogCatch /></ProtectedRoute>} />
                  <Route path="/bulk-upload" element={<ProtectedRoute><BulkUpload /></ProtectedRoute>} />
                  <Route path="/view-catches" element={<ProtectedRoute><ViewCatches /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                  <Route path="/heatmap" element={<ProtectedRoute><HeatMapPage /></ProtectedRoute>} />
                  <Route path="/manage-options" element={<ProtectedRoute><ManageOptions /></ProtectedRoute>} />
                  <Route path="/enhanced-analytics" element={<ProtectedRoute><EnhancedAnalytics /></ProtectedRoute>} />
                  <Route path="/advanced-analytics" element={<ProtectedRoute><AdvancedAnalytics /></ProtectedRoute>} />
                </Routes>
              </main>
            </div>
          </Router>
        </FishingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;