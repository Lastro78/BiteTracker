import { useState, useEffect } from 'react';

export const useFishingOptions = () => {
  const [options, setOptions] = useState({
    structures: [],
    waterQualities: [],
    lineTypes: [],
    baitTypes: [],
    baitColors: [],
    lakes: [],
    species: []
  });

  useEffect(() => {
    const loadOptions = () => {
      try {
        const savedOptions = localStorage.getItem('fishingOptions');
        if (savedOptions) {
          setOptions(JSON.parse(savedOptions));
        } else {
          // Fallback to default config - NOTE: filename is lowercase
          import('../config/fishingoptions').then((module) => {
            setOptions({
              structures: module.structures,
              waterQualities: module.waterQualities,
              lineTypes: module.lineTypes,
              baitTypes: module.baitTypes,
              baitColors: module.baitColors,
              lakes: module.lakes,
              species: [
                'Largemouth Bass',
                'Tiger Fish',
                'Sharptooth Catfish'
              ]
            });
          });
        }
      } catch (error) {
        console.error('Error loading options:', error);
      }
    };

    loadOptions();

    // Listen for storage changes (if managing options in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'fishingOptions') {
        loadOptions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return options;
};