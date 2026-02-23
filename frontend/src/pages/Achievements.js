import React, { useState, useEffect } from 'react';
import { Trophy, Star, Target, CheckCircle, Clock, Award } from 'lucide-react';
import axios from 'axios';
import './Achievements.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/achievements/`);
      setAchievements(response.data);
    } catch (err) {
      setError('Failed to load achievements: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const checkNewAchievements = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/achievements/check`);
      if (response.data.new_achievements > 0) {
        alert(`🎉 Congratulations! You earned ${response.data.new_achievements} new achievement(s)!`);
        loadAchievements(); // Reload to show new achievements
      } else {
        alert('No new achievements earned yet. Keep fishing!');
      }
    } catch (err) {
      setError('Failed to check achievements: ' + (err.response?.data?.detail || err.message));
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'milestone': return <Trophy size={20} />;
      case 'species': return <Star size={20} />;
      case 'weight': return <Award size={20} />;
      case 'streak': return <Clock size={20} />;
      case 'time': return <Clock size={20} />;
      case 'daily': return <Target size={20} />;
      case 'location': return <Target size={20} />;
      default: return <Trophy size={20} />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'milestone': return '#10b981';
      case 'species': return '#3b82f6';
      case 'weight': return '#f59e0b';
      case 'streak': return '#8b5cf6';
      case 'time': return '#06b6d4';
      case 'daily': return '#ef4444';
      case 'location': return '#84cc16';
      default: return '#6b7280';
    }
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(achievement => achievement.category === selectedCategory);

  const categories = ['all', ...new Set(achievements.map(a => a.category))];

  if (loading) {
    return (
      <div className="achievements">
        <div className="loading">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="achievements">
      <div className="achievements-header">
        <div className="header-content">
          <Trophy size={32} />
          <h1>Achievements</h1>
          <p>Track your fishing milestones and unlock rewards!</p>
        </div>
        <button 
          className="check-achievements-btn"
          onClick={checkNewAchievements}
        >
          Check New Achievements
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="achievements-grid">
        {filteredAchievements.map(achievement => (
          <div 
            key={achievement.achievement_id} 
            className={`achievement-card ${achievement.earned ? 'earned' : 'locked'}`}
          >
            <div className="achievement-icon">
              <span className="icon-emoji">{achievement.icon}</span>
              {achievement.earned && (
                <div className="earned-badge">
                  <CheckCircle size={16} />
                </div>
              )}
            </div>
            
            <div className="achievement-content">
              <div className="achievement-header">
                <h3>{achievement.name}</h3>
                <div className="achievement-category" style={{ color: getCategoryColor(achievement.category) }}>
                  {getCategoryIcon(achievement.category)}
                  <span>{achievement.category}</span>
                </div>
              </div>
              
              <p className="achievement-description">{achievement.description}</p>
              
              <div className="achievement-progress">
                {achievement.earned ? (
                  <div className="progress-complete">
                    <CheckCircle size={16} />
                    <span>Completed!</span>
                    {achievement.earned_at && (
                      <span className="earned-date">
                        Earned: {new Date(achievement.earned_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${achievement.progress.percentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {achievement.progress.current || 0} / {achievement.progress.target || 1}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="achievement-points">
                <Star size={16} />
                <span>{achievement.points} points</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="achievements-stats">
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-number">
              {achievements.filter(a => a.earned).length}
            </div>
            <div className="stat-label">Earned</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-number">
              {achievements.length - achievements.filter(a => a.earned).length}
            </div>
            <div className="stat-label">Remaining</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-number">
              {achievements.filter(a => a.earned).reduce((sum, a) => sum + a.points, 0)}
            </div>
            <div className="stat-label">Total Points</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
