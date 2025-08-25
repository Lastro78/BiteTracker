// src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, List, Plus, Brain } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to BiteTracker</h1>
        <p>Track, analyze, and improve your fishing success</p>
      </div>

      <div className="features">
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
      </div>
    </div>
  );
};

export default Home;