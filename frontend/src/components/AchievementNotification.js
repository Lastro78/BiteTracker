import React, { useState, useEffect } from 'react';
import { Trophy, X } from 'lucide-react';
import './AchievementNotification.css';

const AchievementNotification = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show notification after a brief delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto-hide after 5 seconds
    const autoHideTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoHideTimer);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!achievement) return null;

  return (
    <div className={`achievement-notification ${isVisible ? 'visible' : ''}`}>
      <div className="notification-content">
        <div className="achievement-icon">
          <span className="icon-emoji">{achievement.icon}</span>
          <div className="sparkle sparkle-1">✨</div>
          <div className="sparkle sparkle-2">✨</div>
          <div className="sparkle sparkle-3">✨</div>
        </div>
        
        <div className="achievement-text">
          <h3>🎉 Achievement Unlocked!</h3>
          <h4>{achievement.name}</h4>
          <p>{achievement.description}</p>
          <div className="points">
            <Trophy size={16} />
            <span>{achievement.points} points</span>
          </div>
        </div>
        
        <button className="close-btn" onClick={handleClose}>
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default AchievementNotification;
