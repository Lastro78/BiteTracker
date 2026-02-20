import React, { useState, useEffect } from 'react';
import { useFishing } from '../contexts/FishingContext';
import { useFishingOptions } from '../hooks/useFishingOptions';
import { Fish, Scale, MapPin, Save, Settings, ArrowRight, TreePine } from 'lucide-react';
import './QuickCapture.css';

const QuickCapture = () => {
  const { createCatch, loading, error } = useFishing();
  const {
    species = [],
    lakes = [],
    structures = [],
    baitTypes = []
  } = useFishingOptions();
  
  // Debug: Log the species list to check for duplicates
  useEffect(() => {
    console.log('Species loaded:', species);
    console.log('Unique species:', [...new Set(species)]);
    
    // Clean up any duplicate species in localStorage if they exist
    if ((species || []).length > 0) {
      const uniqueSpecies = [...new Set(species)];
      if (uniqueSpecies.length !== (species || []).length) {
        console.warn('Duplicate species detected, cleaning up...');
        // You could update localStorage here if needed
      }
    }
  }, [species]);
  
  const [quickData, setQuickData] = useState({
    species: '',
    fish_weight: '',
    location: '',
    structure: '',
    lake: '',
    bait_type: '',
    bait: '',
    comments: ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userPreferences, setUserPreferences] = useState({});

  // Load user preferences on component mount
  useEffect(() => {
    loadUserPreferences();
  }, []);

  // Set initial values from user preferences
  useEffect(() => {
    if (userPreferences.structure) {
      setQuickData(prev => ({
        ...prev,
        structure: userPreferences.structure
      }));
    }
    if (userPreferences.lake) {
      setQuickData(prev => ({
        ...prev,
        lake: userPreferences.lake
      }));
    }
    if (userPreferences.bait) {
      setQuickData(prev => ({
        ...prev,
        bait: userPreferences.bait
      }));
    }
    if (userPreferences.bait_type) {
      setQuickData(prev => ({
        ...prev,
        bait_type: userPreferences.bait_type
      }));
    }
  }, [userPreferences]);

  const loadUserPreferences = () => {
    try {
      const savedPrefs = localStorage.getItem('userFishingPreferences');
      if (savedPrefs) {
        setUserPreferences(JSON.parse(savedPrefs));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const saveUserPreferences = (newPrefs) => {
    try {
      localStorage.setItem('userFishingPreferences', JSON.stringify(newPrefs));
      setUserPreferences(newPrefs);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    
    if (!quickData.species || !quickData.fish_weight) {
      alert('Please enter species and weight');
      return;
    }

    if (!quickData.structure) {
      alert('Please select a structure');
      return;
    }

    // Save user preferences for next time
    saveUserPreferences({
      lake: quickData.lake,
      bait: quickData.bait,
      bait_type: quickData.bait_type,
      structure: quickData.structure
    });

    // Prepare full catch data with defaults
    const fullCatchData = {
      // Essential fields from quick capture
      species: quickData.species,
      fish_weight: parseFloat(quickData.fish_weight),
      location: quickData.location || 'GPS Location',
      structure: quickData.structure || 'Unknown',
      lake: quickData.lake || 'Unknown Lake',
      bait_type: quickData.bait_type || 'Unknown',
      bait: quickData.bait || 'Unknown Bait',
      comments: quickData.comments || 'Quick capture',
      
      // Auto-filled defaults
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5) + ':00',
      water_temp: 0.0, // Required field, can't be null
      water_quality: 'Unknown',
      line_type: 'Unknown',
      boat_depth: 0.0, // Required field, can't be null
      bait_depth: 0.0, // Required field, can't be null
      bait_colour: 'Unknown',
      scented: false,
      line_weight: null,
      weight_pegged: false,
      hook_size: null
    };

    console.log('Sending catch data:', fullCatchData);
    const result = await createCatch(fullCatchData);
    
    if (!result.success) {
      console.error('Catch creation failed:', result.error);
    }

    if (result.success) {
      setSubmitted(true);
      // Reset form but keep user preferences
      setQuickData({
        species: '',
        fish_weight: '',
        location: '',
        structure: userPreferences.structure || '',
        lake: userPreferences.lake || '',
        bait_type: userPreferences.bait_type || '',
        bait: userPreferences.bait || '',
        comments: ''
      });
      
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  const handleInputChange = (field, value) => {
    setQuickData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          handleInputChange('location', location);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get current location. Please enter manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const quickWeightOptions = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];

  return (
    <div className="quick-capture">
      <div className="quick-capture-header">
        <Fish size={24} />
        <h2>Quick Catch Log</h2>
        <button 
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Settings size={16} />
          {showAdvanced ? 'Simple' : 'Advanced'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {submitted && (
        <div className="success">
          ✅ Catch logged successfully!
        </div>
      )}

      <form onSubmit={handleQuickSubmit} className="quick-form">
        {/* Essential Fields */}
        <div className="essential-fields">
          {/* Species Selection */}
          <div className="field-group">
            <label className="field-label">
              <Fish size={16} />
              Species *
            </label>
            <div className="species-buttons">
              {[...new Set(species || [])].map(speciesItem => (
                <button
                  key={speciesItem}
                  type="button"
                  className={`species-btn ${quickData.species === speciesItem ? 'selected' : ''}`}
                  onClick={() => handleInputChange('species', speciesItem)}
                >
                  {speciesItem}
                </button>
              ))}
            </div>
          </div>

          {/* Weight Input */}
          <div className="field-group">
            <label className="field-label">
              <Scale size={16} />
              Weight (kg) *
            </label>
            <div className="weight-input-container">
              <input
                type="number"
                step="0.1"
                min="0"
                value={quickData.fish_weight}
                onChange={(e) => handleInputChange('fish_weight', e.target.value)}
                placeholder="Enter weight"
                className="weight-input"
                required
              />
              <div className="quick-weights">
                {quickWeightOptions.map(weight => (
                  <button
                    key={weight}
                    type="button"
                    className={`weight-btn ${quickData.fish_weight === weight ? 'selected' : ''}`}
                    onClick={() => handleInputChange('fish_weight', weight.toString())}
                  >
                    {weight}kg
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="field-group">
            <label className="field-label">
              <MapPin size={16} />
              Location
            </label>
            <div className="location-input-container">
              <input
                type="text"
                value={quickData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="GPS coordinates or description"
                className="location-input"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="location-btn"
              >
                📍 GPS
              </button>
            </div>
          </div>

          {/* Structure */}
          <div className="field-group">
            <label className="field-label">
              <TreePine size={16} />
              Structure
            </label>
            <select
              value={quickData.structure}
              onChange={(e) => handleInputChange('structure', e.target.value)}
              className="form-select"
            >
              <option value="">Select Structure</option>
              {(structures || []).map(structure => (
                <option key={structure} value={structure}>{structure}</option>
              ))}
              <option value="other">Other</option>
            </select>
          </div>

          {/* Bait Type */}
          <div className="field-group">
            <label className="field-label">Bait Type</label>
            <select
              value={quickData.bait_type}
              onChange={(e) => handleInputChange('bait_type', e.target.value)}
              className="form-select"
            >
              <option value="">Select Bait Type</option>
              {[...new Set(baitTypes || [])].map(bt => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Optional Fields (shown in advanced mode) */}
        {showAdvanced && (
          <div className="optional-fields">
            {/* Lake Selection */}
            <div className="field-group">
              <label className="field-label">Lake</label>
              <select
                value={quickData.lake}
                onChange={(e) => handleInputChange('lake', e.target.value)}
                className="form-select"
              >
                <option value="">Select Lake</option>
                {(lakes || []).map(lake => (
                  <option key={lake} value={lake}>{lake}</option>
                ))}
                <option value="other">Other</option>
              </select>
            </div>

            {/* Bait */}
            <div className="field-group">
              <label className="field-label">Bait Used</label>
              <input
                type="text"
                value={quickData.bait}
                onChange={(e) => handleInputChange('bait', e.target.value)}
                placeholder="What bait did you use?"
                className="form-input"
              />
            </div>

            {/* Comments */}
            <div className="field-group">
              <label className="field-label">Comments</label>
              <textarea
                value={quickData.comments}
                onChange={(e) => handleInputChange('comments', e.target.value)}
                placeholder="Any notes about the catch..."
                className="form-textarea"
                rows="2"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="submit-section">
          <button 
            type="submit" 
            className="quick-submit-btn"
            disabled={loading || !quickData.species || !quickData.fish_weight}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Logging...
              </>
            ) : (
              <>
                <Save size={20} />
                Log Catch
              </>
            )}
          </button>
          
          {showAdvanced && (
            <button
              type="button"
              className="full-form-btn"
              onClick={() => window.location.href = '/log-catch'}
            >
              <ArrowRight size={16} />
              Full Form
            </button>
          )}
        </div>
      </form>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <span className="stat-label">Today's Catches:</span>
          <span className="stat-value">0</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">This Week:</span>
          <span className="stat-value">0</span>
        </div>
      </div>
    </div>
  );
};

export default QuickCapture;
