// src/components/Header.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Fish, BarChart3, List, Home, MapPin, Settings, Upload } from 'lucide-react';
import './Header.css';

const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/log-catch', label: 'Log Catch', icon: Fish },
    { path: '/bulk-upload', label: 'Bulk Upload', icon: Upload }, // Added Bulk Upload
    { path: '/view-catches', label: 'View Catches', icon: List },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/heatmap', label: 'Heat Map', icon: MapPin },
    { path: '/manage-options', label: 'Manage Options', icon: Settings }
  ];

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">
          <Fish size={32} />
          BiteTracker
        </h1>
        
        <nav className="navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;