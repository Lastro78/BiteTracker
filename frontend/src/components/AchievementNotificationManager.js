import React from 'react';
import { useFishing } from '../contexts/FishingContext';
import AchievementNotification from './AchievementNotification';

const AchievementNotificationManager = () => {
  const { newAchievements, clearAchievement } = useFishing();

  return (
    <>
      {newAchievements.map((achievement, index) => (
        <AchievementNotification
          key={`${achievement.achievement_id}-${index}`}
          achievement={achievement}
          onClose={() => clearAchievement(achievement.achievement_id)}
        />
      ))}
    </>
  );
};

export default AchievementNotificationManager;
