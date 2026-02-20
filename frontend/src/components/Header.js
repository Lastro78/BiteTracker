// src/components/Header.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Fish, BarChart3, List, Home, MapPin, Settings, Upload, User, LogOut, Menu, X, Brain, ChevronDown, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAnalyticsDropdownOpen, setIsAnalyticsDropdownOpen] = useState(false);
  const [isCatchesDropdownOpen, setIsCatchesDropdownOpen] = useState(false);
  const [catchesTimeout, setCatchesTimeout] = useState(null);
  const [analyticsTimeout, setAnalyticsTimeout] = useState(null);

  const navItems = [
    { path: '/', label: 'Home', icon: Home }
  ];

  const catchesItems = [
    { path: '/quick-capture', label: 'Quick Capture', icon: Fish },
    { path: '/log-catch', label: 'Log Catch', icon: Fish },
    { path: '/view-catches', label: 'View Catches', icon: List },
    { path: '/bulk-upload', label: 'Bulk Upload', icon: Upload }
  ];

  const analyticsItems = [
    { path: '/analytics', label: 'Basic Analytics', icon: BarChart3 },
    { path: '/enhanced-analytics', label: 'Enhanced Analytics (AI)', icon: Brain },
    { path: '/advanced-analytics', label: 'Advanced Analytics', icon: BarChart3 }
  ];

  const otherItems = [
    { path: '/heatmap', label: 'Heat Map', icon: MapPin },
    { path: '/achievements', label: 'Achievements', icon: Trophy },
    { path: '/manage-options', label: 'Manage Options', icon: Settings }
  ];

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const toggleAnalyticsDropdown = () => {
    setIsAnalyticsDropdownOpen(!isAnalyticsDropdownOpen);
  };

  const toggleCatchesDropdown = () => {
    setIsCatchesDropdownOpen(!isCatchesDropdownOpen);
  };

  const handleCatchesMouseEnter = () => {
    if (catchesTimeout) {
      clearTimeout(catchesTimeout);
      setCatchesTimeout(null);
    }
    setIsCatchesDropdownOpen(true);
  };

  const handleCatchesMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsCatchesDropdownOpen(false);
    }, 150);
    setCatchesTimeout(timeout);
  };

  const handleAnalyticsMouseEnter = () => {
    if (analyticsTimeout) {
      clearTimeout(analyticsTimeout);
      setAnalyticsTimeout(null);
    }
    setIsAnalyticsDropdownOpen(true);
  };

  const handleAnalyticsMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsAnalyticsDropdownOpen(false);
    }, 150);
    setAnalyticsTimeout(timeout);
  };

  const isAnalyticsActive = () => {
    return analyticsItems.some(item => location.pathname === item.path);
  };

  const isCatchesActive = () => {
    return catchesItems.some(item => location.pathname === item.path);
  };

  if (!isAuthenticated) {
    return (
      <header className="header">
        <div className="header-content">
          <h1 className="logo">
            <Fish size={32} />
            BiteTracker
          </h1>
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-secondary">Sign In</Link>
            <Link to="/register" className="btn btn-primary">Sign Up</Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">
          <Fish size={32} />
          BiteTracker
        </h1>
        
        <nav className={`navigation ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {/* Home */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Catches Dropdown */}
          <div className="nav-dropdown">
            <button 
              className={`nav-link dropdown-toggle ${isCatchesActive() ? 'active' : ''}`}
              onClick={toggleCatchesDropdown}
              onMouseEnter={handleCatchesMouseEnter}
              onMouseLeave={handleCatchesMouseLeave}
              aria-label="Catches menu"
              aria-expanded={isCatchesDropdownOpen}
            >
              <Fish size={20} />
              <span>Catches</span>
              <ChevronDown size={16} className={`dropdown-arrow ${isCatchesDropdownOpen ? 'rotated' : ''}`} />
            </button>
            
            {isCatchesDropdownOpen && (
              <div 
                className="dropdown-menu"
                onMouseEnter={handleCatchesMouseEnter}
                onMouseLeave={handleCatchesMouseLeave}
              >
                {catchesItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`dropdown-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setIsCatchesDropdownOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Analytics Dropdown */}
          <div className="nav-dropdown">
            <button 
              className={`nav-link dropdown-toggle ${isAnalyticsActive() ? 'active' : ''}`}
              onClick={toggleAnalyticsDropdown}
              onMouseEnter={handleAnalyticsMouseEnter}
              onMouseLeave={handleAnalyticsMouseLeave}
              aria-label="Analytics menu"
              aria-expanded={isAnalyticsDropdownOpen}
            >
              <BarChart3 size={20} />
              <span>Analytics</span>
              <ChevronDown size={16} className={`dropdown-arrow ${isAnalyticsDropdownOpen ? 'rotated' : ''}`} />
            </button>
            
            {isAnalyticsDropdownOpen && (
              <div 
                className="dropdown-menu"
                onMouseEnter={handleAnalyticsMouseEnter}
                onMouseLeave={handleAnalyticsMouseLeave}
              >
                {analyticsItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`dropdown-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setIsAnalyticsDropdownOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Other Navigation Items */}
          {otherItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          <div className="user-menu-container">
            <button 
              className="user-menu-button" 
              onClick={toggleUserMenu}
              aria-label="User menu"
              aria-expanded={isUserMenuOpen}
            >
              <User size={20} />
              <span className="username">{user?.username}</span>
            </button>
            
            {isUserMenuOpen && (
              <div className="user-menu">
                <Link to="/profile" className="user-menu-item" onClick={() => setIsUserMenuOpen(false)}>
                  <User size={16} />
                  Profile
                </Link>
                <button className="user-menu-item" onClick={handleLogout}>
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          <button 
            className="mobile-menu-button" 
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;