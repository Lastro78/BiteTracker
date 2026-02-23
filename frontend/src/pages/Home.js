// src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, List, Plus, Brain, MapPin, Settings, Zap, Trophy } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to BiteTracker</h1>
        <p>Track, analyze, and improve your fishing success</p>
      </div>

      <div className="features">
        <div className="feature-card quick-capture-card">
          <div className="feature-icon">
            <Zap size={48} />
          </div>
          <h3>Quick Capture</h3>
          <p>Fast and simple catch logging</p>
          <Link to="/quick-capture" className="feature-link">
            Quick Log →
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Plus size={48} />
          </div>
          <h3>Log Catches</h3>
          <p>Record every detail of your fishing trips</p>
          <Link to="/log-catch" className="feature-link">
            Start Logging →
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <List size={48} />
          </div>
          <h3>View History</h3>
          <p>Review your past catches and patterns</p>
          <Link to="/view-catches" className="feature-link">
            View Catches →
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <BarChart3 size={48} />
          </div>
          <h3>Basic Analytics</h3>
          <p>Discover what works best for your fishing</p>
          <Link to="/analytics" className="feature-link">
            Analyze Data →
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Brain size={48} />
          </div>
          <h3>Enhanced Analytics</h3>
          <p>AI-powered insights and predictions</p>
          <Link to="/enhanced-analytics" className="feature-link">
            Smart Analysis →
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <MapPin size={48} />
          </div>
          <h3>Heat Map</h3>
          <p>Visualize your fishing hotspots and patterns</p>
          <Link to="/heatmap" className="feature-link">
            View Heat Map →
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Trophy size={48} />
          </div>
          <h3>Achievements</h3>
          <p>Unlock badges and track your fishing milestones</p>
          <Link to="/achievements" className="feature-link">
            View Achievements →
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Settings size={48} />
          </div>
          <h3>Manage Options</h3>
          <p>Customize your fishing options and preferences</p>
          <Link to="/manage-options" className="feature-link">
            Manage Settings →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;