import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFishing } from '../contexts/FishingContext';
import { useFishingOptions } from '../hooks/useFishingOptions';
import { 
  RotateCw, Filter, Search, Calendar, MapPin, Scale, Clock, 
  Edit, Trash2, Save, X, Check, AlertCircle, ExternalLink, Cloud, CloudRain, Thermometer, Gauge, Moon
} from 'lucide-react';
import './ViewCatches.css';

const ViewCatches = () => {
  const { catches, fetchCatches, updateCatch, deleteCatch, loading, error } = useFishing();
  const { lakes, structures, waterQualities, lineTypes, baitTypes, baitColors } = useFishingOptions();
  const [filteredCatches, setFilteredCatches] = useState([]);
  const [filters, setFilters] = useState({
    baitType: '',
    structure: '',
    lake: '',
    minWeight: '',
    maxWeight: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // Weather state
  const [weatherModal, setWeatherModal] = useState({ show: false, data: null, loading: false, error: null });

  useEffect(() => {
    fetchCatches();
  }, [fetchCatches]);

  useEffect(() => {
    let results = catches;

    // Apply filters
    if (filters.baitType) {
      results = results.filter(catchItem => 
        catchItem.bait_type && catchItem.bait_type.toLowerCase().includes(filters.baitType.toLowerCase())
      );
    }

    if (filters.structure) {
      results = results.filter(catchItem => 
        catchItem.structure && catchItem.structure.toLowerCase().includes(filters.structure.toLowerCase())
      );
    }

    if (filters.lake) {
      if (filters.lake === 'other') {
        // Filter for lakes not in the predefined list
        results = results.filter(catchItem => 
          catchItem.lake && !lakes.includes(catchItem.lake)
        );
      } else {
        results = results.filter(catchItem => 
          catchItem.lake && catchItem.lake.toLowerCase().includes(filters.lake.toLowerCase())
        );
      }
    }

    if (filters.minWeight) {
      results = results.filter(catchItem => 
        catchItem.fish_weight >= parseFloat(filters.minWeight)
      );
    }

    if (filters.maxWeight) {
      results = results.filter(catchItem => 
        catchItem.fish_weight <= parseFloat(filters.maxWeight)
      );
    }

    // Apply search
    if (searchTerm) {
      results = results.filter(catchItem =>
        (catchItem.bait && catchItem.bait.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (catchItem.location && catchItem.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (catchItem.comments && catchItem.comments.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (catchItem.lake && catchItem.lake.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredCatches(results);
  }, [catches, filters, searchTerm, lakes]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      baitType: '',
      structure: '',
      lake: '',
      minWeight: '',
      maxWeight: ''
    });
    setSearchTerm('');
  };

  const getUniqueValues = (key) => {
    const values = [...new Set(catches.map(item => item[key]).filter(Boolean))];
    return values.sort();
  };

  const startEditing = (catchItem) => {
    setEditingId(catchItem._id);
    setEditFormData({ ...catchItem });
    setSaveStatus({});
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
    setSaveStatus({});
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (catchId) => {
    try {
      setSaveStatus({ [catchId]: 'saving' });
      await updateCatch(catchId, editFormData);
      setEditingId(null);
      setEditFormData({});
      setSaveStatus({ [catchId]: 'success' });
      
      // Clear success status after 2 seconds
      setTimeout(() => {
        setSaveStatus({});
      }, 2000);
    } catch (error) {
      setSaveStatus({ [catchId]: 'error', message: error.message });
    }
  };

  const handleDelete = async (catchId) => {
    try {
      setSaveStatus({ [catchId]: 'deleting' });
      await deleteCatch(catchId);
      setDeleteConfirmId(null);
      setSaveStatus({ [catchId]: 'delete_success' });
      
      // Clear success status after 2 seconds
      setTimeout(() => {
        setSaveStatus({});
      }, 2000);
    } catch (error) {
      setSaveStatus({ [catchId]: 'error', message: error.message });
    }
  };

  const confirmDelete = (catchId) => {
    setDeleteConfirmId(catchId);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  // Weather functions
  const parseCoordinates = (location) => {
    if (!location) return null;
    
    // Handle degree-minute-second format: 24°50'42"S 29°26'16"E
    const dmsRegex = /(\d+)°(\d+)'(\d+)"([NS])\s+(\d+)°(\d+)'(\d+)"([EW])/i;
    const dmsMatch = location.match(dmsRegex);
    
    if (dmsMatch) {
      // Convert DMS to decimal degrees
      const latDeg = parseInt(dmsMatch[1]);
      const latMin = parseInt(dmsMatch[2]);
      const latSec = parseInt(dmsMatch[3]);
      const latDir = dmsMatch[4].toUpperCase();
      
      const lngDeg = parseInt(dmsMatch[5]);
      const lngMin = parseInt(dmsMatch[6]);
      const lngSec = parseInt(dmsMatch[7]);
      const lngDir = dmsMatch[8].toUpperCase();
      
      let lat = latDeg + (latMin / 60) + (latSec / 3600);
      let lng = lngDeg + (lngMin / 60) + (lngSec / 3600);
      
      // Apply direction
      if (latDir === 'S') lat = -lat;
      if (lngDir === 'W') lng = -lng;
      
      return { lat, lng };
    }
    
    // Handle decimal degree format: 24.845 -29.437 or 24.845, -29.437
    const decimalRegex = /(-?\d+\.?\d*)[°\s]*([NS]?)[,\s]+(-?\d+\.?\d*)[°\s]*([EW]?)/i;
    const decimalMatch = location.match(decimalRegex);
    
    if (decimalMatch) {
      let lat = parseFloat(decimalMatch[1]);
      let lng = parseFloat(decimalMatch[3]);
      
      // Handle N/S and E/W indicators
      if (decimalMatch[2]?.toUpperCase() === 'S') lat = -lat;
      if (decimalMatch[4]?.toUpperCase() === 'W') lng = -lng;
      
      return { lat, lng };
    }
    
    console.log('Could not parse coordinates from:', location);
    return null;
  };

  const fetchWeatherData = async (catchItem) => {
    console.log('Fetching weather for location:', catchItem.location);
    const coords = parseCoordinates(catchItem.location);
    console.log('Parsed coordinates:', coords);
    
    if (!coords) {
      setWeatherModal({ 
        show: true, 
        data: null, 
        loading: false, 
        error: `Could not parse location coordinates: "${catchItem.location}". Please ensure coordinates are in format: 24°50'42"S 29°26'16"E or 24.845, -29.437` 
      });
      return;
    }

    setWeatherModal({ show: true, data: null, loading: true, error: null });

    try {
      // Format date and time for API
      const dateTime = new Date(`${catchItem.date}T${catchItem.time}`);
      const timestamp = Math.floor(dateTime.getTime() / 1000);
      
      // Using OpenWeatherMap API for historical data
      // Note: This requires a paid API key for historical data
      // For demo purposes, we'll use current weather data
      const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
      
      if (!API_KEY || API_KEY === 'demo_key') {
        // Show demo data when no API key is available
        const moonPhase = getMoonPhase(dateTime);
        const demoWeatherData = {
          location: catchItem.location,
          date: catchItem.date,
          time: catchItem.time,
          temperature: 72.5, // Demo temperature
          pressure: 1013, // Demo pressure
          humidity: 65, // Demo humidity
          description: 'Partly cloudy',
          cloudCover: 45, // Demo cloud cover
          windSpeed: 8.5, // Demo wind speed
          windDirection: 180, // Demo wind direction
          moonPhase: moonPhase
        };
        
        setWeatherModal({ show: true, data: demoWeatherData, loading: false, error: null });
        return;
      }
      
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lng}&appid=${API_KEY}&units=imperial`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.cod === 200) {
        // Get moon phase data
        const moonPhase = getMoonPhase(dateTime);
        
        const weatherData = {
          location: catchItem.location,
          date: catchItem.date,
          time: catchItem.time,
          temperature: data.main.temp,
          pressure: data.main.pressure,
          humidity: data.main.humidity,
          description: data.weather[0].description,
          cloudCover: data.clouds.all,
          windSpeed: data.wind.speed,
          windDirection: data.wind.deg,
          moonPhase: moonPhase
        };
        
        setWeatherModal({ show: true, data: weatherData, loading: false, error: null });
      } else {
        throw new Error(data.message || 'Failed to fetch weather data');
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      setWeatherModal({ 
        show: true, 
        data: null, 
        loading: false, 
        error: 'Failed to fetch weather data. Please try again.' 
      });
    }
  };

  const getMoonPhase = (date) => {
    // Simple moon phase calculation
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Calculate days since new moon (approximate)
    const newMoon = new Date(2000, 0, 6); // Known new moon date
    const currentDate = new Date(year, month - 1, day);
    const daysSinceNewMoon = Math.floor((currentDate - newMoon) / (1000 * 60 * 60 * 24));
    const lunarCycle = 29.53058867; // Days in lunar cycle
    const phase = (daysSinceNewMoon % lunarCycle) / lunarCycle;
    
    if (phase < 0.0625) return 'New Moon';
    if (phase < 0.1875) return 'Waxing Crescent';
    if (phase < 0.3125) return 'First Quarter';
    if (phase < 0.4375) return 'Waxing Gibbous';
    if (phase < 0.5625) return 'Full Moon';
    if (phase < 0.6875) return 'Waning Gibbous';
    if (phase < 0.8125) return 'Last Quarter';
    if (phase < 0.9375) return 'Waning Crescent';
    return 'New Moon';
  };

  const closeWeatherModal = () => {
    setWeatherModal({ show: false, data: null, loading: false, error: null });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <RotateCw className="spinner" size={32} />
          <p>Loading catches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="page-header">
          <h2>View Catches</h2>
          <span className="catch-count">{filteredCatches.length} catches</span>
        </div>

        {error && <div className="error">{error}</div>}

        {/* Filters and Search */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by bait, location, lake, or comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters-grid">
            <div className="filter-group">
              <label>Bait Type</label>
              <select
                value={filters.baitType}
                onChange={(e) => handleFilterChange('baitType', e.target.value)}
              >
                <option value="">All Bait Types</option>
                {getUniqueValues('bait_type').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Structure</label>
              <select
                value={filters.structure}
                onChange={(e) => handleFilterChange('structure', e.target.value)}
              >
                <option value="">All Structures</option>
                {getUniqueValues('structure').map(structure => (
                  <option key={structure} value={structure}>{structure}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Lake</label>
              <select
                value={filters.lake}
                onChange={(e) => handleFilterChange('lake', e.target.value)}
              >
                <option value="">All Lakes</option>
                {lakes.map(lake => (
                  <option key={lake} value={lake}>{lake}</option>
                ))}
                <option value="other">Other Lakes</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Min Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={filters.minWeight}
                onChange={(e) => handleFilterChange('minWeight', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="filter-group">
              <label>Max Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={filters.maxWeight}
                onChange={(e) => handleFilterChange('maxWeight', e.target.value)}
                placeholder="10.00"
              />
            </div>
          </div>

          <button onClick={clearFilters} className="btn btn-secondary">
            <Filter size={16} />
            Clear Filters
          </button>
        </div>

        {/* Catches List */}
        <div className="catches-list">
          {filteredCatches.length === 0 ? (
            <div className="empty-state">
              <p>No catches found{catches.length > 0 ? ' matching your filters' : ''}.</p>
              {catches.length === 0 && (
                <p>Start by logging your first catch!</p>
              )}
            </div>
          ) : (
            filteredCatches.map((catchItem) => (
              <div key={catchItem._id} className="catch-card">
                <div className="catch-header">
                  <div className="catch-weight">
                    <Scale size={16} />
                    {editingId === catchItem._id ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editFormData.fish_weight || ''}
                        onChange={(e) => handleEditChange('fish_weight', parseFloat(e.target.value))}
                        className="edit-input"
                      />
                    ) : (
                      <span className="weight-value">{catchItem.fish_weight} kg</span>
                    )}
                  </div>
                  
                  <div className="catch-bait">
                    {editingId === catchItem._id ? (
                      <>
                        <select
                          value={editFormData.bait_type || ''}
                          onChange={(e) => handleEditChange('bait_type', e.target.value)}
                          className="edit-select"
                        >
                          <option value="">Select Type</option>
                          {baitTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={editFormData.bait || ''}
                          onChange={(e) => handleEditChange('bait', e.target.value)}
                          className="edit-input"
                          placeholder="Bait name"
                        />
                      </>
                    ) : (
                      <>
                        <span className="bait-type">{catchItem.bait_type}</span>
                        <span className="bait-name">{catchItem.bait}</span>
                      </>
                    )}
                    <span className="lake-name">{catchItem.lake || 'Unknown Lake'}</span>
                  </div>

                  <div className="catch-actions">
                    {editingId === catchItem._id ? (
                      <>
                        <button
                          onClick={() => handleSave(catchItem._id)}
                          className="btn-icon success"
                          disabled={saveStatus[catchItem._id] === 'saving'}
                        >
                          {saveStatus[catchItem._id] === 'saving' ? (
                            <RotateCw size={14} className="spinner" />
                          ) : (
                            <Save size={14} />
                          )}
                        </button>
                        <button onClick={cancelEditing} className="btn-icon">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(catchItem)}
                          className="btn-icon"
                          disabled={editingId !== null}
                        >
                          <Edit size={14} />
                        </button>
                        {deleteConfirmId === catchItem._id ? (
                          <>
                            <button
                              onClick={() => handleDelete(catchItem._id)}
                              className="btn-icon danger"
                              disabled={saveStatus[catchItem._id] === 'deleting'}
                            >
                              {saveStatus[catchItem._id] === 'deleting' ? (
                                <RotateCw size={14} className="spinner" />
                              ) : (
                                <Check size={14} />
                              )}
                            </button>
                            <button onClick={cancelDelete} className="btn-icon">
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => confirmDelete(catchItem._id)}
                            className="btn-icon danger"
                            disabled={editingId !== null}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="catch-details">
                  <div className="detail-item">
                    <Calendar size={14} />
                    {editingId === catchItem._id ? (
                      <input
                        type="date"
                        value={editFormData.date || ''}
                        onChange={(e) => handleEditChange('date', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      <span>{catchItem.date || 'No date'}</span>
                    )}
                  </div>
                  
                  <div className="detail-item">
                    <Clock size={14} />
                    {editingId === catchItem._id ? (
                      <input
                        type="time"
                        value={editFormData.time || ''}
                        onChange={(e) => handleEditChange('time', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      <span>{catchItem.time}</span>
                    )}
                  </div>
                  
                  <div className="detail-item">
                    <MapPin size={14} />
                    {editingId === catchItem._id ? (
                      <input
                        type="text"
                        value={editFormData.location || ''}
                        onChange={(e) => handleEditChange('location', e.target.value)}
                        className="edit-input"
                        placeholder="Location coordinates"
                      />
                                          ) : (
                        <div className="location-container">
                          <span className="location-truncate">{catchItem.location}</span>
                          {catchItem.location && (
                            <>
                              <Link 
                                to="/heatmap" 
                                className="location-link"
                                title="View this location on Heat Map"
                              >
                                <ExternalLink size={12} />
                              </Link>
                              <button
                                className="weather-link"
                                onClick={() => fetchWeatherData(catchItem)}
                                title="View weather for this catch"
                              >
                                <Cloud size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                  </div>

                  <div className="detail-item">
                    <span>Structure: </span>
                    {editingId === catchItem._id ? (
                      <select
                        value={editFormData.structure || ''}
                        onChange={(e) => handleEditChange('structure', e.target.value)}
                        className="edit-select"
                      >
                        <option value="">Select Structure</option>
                        {structures.map(structure => (
                          <option key={structure} value={structure}>{structure}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="structure-badge">{catchItem.structure || 'Unknown'}</span>
                    )}
                  </div>

                  <div className="detail-item">
                    <span>Water: </span>
                    {editingId === catchItem._id ? (
                      <>
                        <input
                          type="number"
                          step="0.1"
                          value={editFormData.water_temp || ''}
                          onChange={(e) => handleEditChange('water_temp', parseFloat(e.target.value))}
                          className="edit-input small"
                          placeholder="Temp"
                        />
                        <select
                          value={editFormData.water_quality || ''}
                          onChange={(e) => handleEditChange('water_quality', e.target.value)}
                          className="edit-select small"
                        >
                          <option value="">Quality</option>
                          {waterQualities.map(quality => (
                            <option key={quality} value={quality}>{quality}</option>
                          ))}
                        </select>
                      </>
                                          ) : (
                        <span>{catchItem.water_temp}°F, {catchItem.water_quality}</span>
                      )}
                  </div>

                  <div className="detail-item">
                    <span>Depth: </span>
                    {editingId === catchItem._id ? (
                      <>
                        <input
                          type="number"
                          step="0.1"
                          value={editFormData.boat_depth || ''}
                          onChange={(e) => handleEditChange('boat_depth', parseFloat(e.target.value))}
                          className="edit-input small"
                          placeholder="Boat"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={editFormData.bait_depth || ''}
                          onChange={(e) => handleEditChange('bait_depth', parseFloat(e.target.value))}
                          className="edit-input small"
                          placeholder="Bait"
                        />
                      </>
                                          ) : (
                        <span>Boat: {catchItem.boat_depth}ft, Bait: {catchItem.bait_depth}ft</span>
                      )}
                  </div>

                  <div className="detail-item">
                    <span>Line: </span>
                    {editingId === catchItem._id ? (
                      <>
                        <select
                          value={editFormData.line_type || ''}
                          onChange={(e) => handleEditChange('line_type', e.target.value)}
                          className="edit-select"
                        >
                          <option value="">Select Line</option>
                          {lineTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.1"
                          value={editFormData.line_weight || ''}
                          onChange={(e) => handleEditChange('line_weight', parseFloat(e.target.value))}
                          className="edit-input small"
                          placeholder="Weight (Lb)"
                        />
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={editFormData.scented || false}
                            onChange={(e) => handleEditChange('scented', e.target.checked)}
                          />
                          Scented
                        </label>
                      </>
                                          ) : (
                        <span>
                          {catchItem.line_type}
                          {catchItem.line_weight && ` (${catchItem.line_weight}Lb)`}
                          , {catchItem.scented ? 'Scented' : 'Unscented'}
                        </span>
                      )}
                    </div>

                    <div className="detail-item">
                      <span>Hook: </span>
                      {editingId === catchItem._id ? (
                        <>
                          <input
                            type="text"
                            value={editFormData.hook_size || ''}
                            onChange={(e) => handleEditChange('hook_size', e.target.value)}
                            className="edit-input small"
                            placeholder="Size"
                          />
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={editFormData.weight_pegged || false}
                              onChange={(e) => handleEditChange('weight_pegged', e.target.checked)}
                            />
                            Pegged
                          </label>
                        </>
                      ) : (
                        <span>
                          {catchItem.hook_size || 'Not specified'}
                          {catchItem.weight_pegged && ' (Pegged)'}
                        </span>
                      )}
                  </div>

                  <div className="detail-item">
                    <span>Color: </span>
                    {editingId === catchItem._id ? (
                      <select
                        value={editFormData.bait_colour || ''}
                        onChange={(e) => handleEditChange('bait_colour', e.target.value)}
                        className="edit-select"
                      >
                        <option value="">Select Color</option>
                        {baitColors.map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="color-badge">{catchItem.bait_colour}</span>
                    )}
                  </div>
                </div>

                {editingId === catchItem._id ? (
                  <div className="catch-comments edit-mode">
                    <textarea
                      value={editFormData.comments || ''}
                      onChange={(e) => handleEditChange('comments', e.target.value)}
                      className="edit-textarea"
                      placeholder="Add comments..."
                      rows="3"
                    />
                  </div>
                ) : (
                  catchItem.comments && (
                    <div className="catch-comments">
                      <p>"{catchItem.comments}"</p>
                    </div>
                  )
                )}

                {/* Status Messages */}
                {saveStatus[catchItem._id] === 'success' && (
                  <div className="status-message success">
                    <Check size={14} />
                    <span>Catch updated successfully!</span>
                  </div>
                )}
                
                {saveStatus[catchItem._id] === 'delete_success' && (
                  <div className="status-message success">
                    <Check size={14} />
                    <span>Catch deleted successfully!</span>
                  </div>
                )}
                
                {saveStatus[catchItem._id] === 'error' && (
                  <div className="status-message error">
                    <AlertCircle size={14} />
                    <span>{saveStatus.message || 'An error occurred'}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Weather Modal */}
      {weatherModal.show && (
        <div className="weather-modal-overlay" onClick={closeWeatherModal}>
          <div className="weather-modal" onClick={(e) => e.stopPropagation()}>
            <div className="weather-modal-header">
              <h3>Weather Conditions</h3>
              <button className="weather-modal-close" onClick={closeWeatherModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="weather-modal-content">
              {weatherModal.loading && (
                <div className="weather-loading">
                  <RotateCw className="spinner" size={24} />
                  <p>Loading weather data...</p>
                </div>
              )}
              
              {weatherModal.error && (
                <div className="weather-error">
                  <AlertCircle size={20} />
                  <p>{weatherModal.error}</p>
                  <div className="weather-note">
                    <p><strong>Setup Instructions:</strong></p>
                    <ol>
                      <li>Get a free API key from <a href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer">OpenWeatherMap</a></li>
                      <li>Add to your <code>.env.local</code> file: <code>REACT_APP_OPENWEATHER_API_KEY=your_key_here</code></li>
                      <li>Restart your React app</li>
                    </ol>
                    <p><strong>Note:</strong> Historical weather data requires a paid subscription. This demo shows current weather conditions.</p>
                  </div>
                </div>
              )}
              
              {weatherModal.data && (
                <div className="weather-data">
                  <div className="weather-location">
                    <MapPin size={16} />
                    <span>{weatherModal.data.location}</span>
                  </div>
                  
                  <div className="weather-datetime">
                    <Calendar size={16} />
                    <span>{weatherModal.data.date} at {weatherModal.data.time}</span>
                  </div>
                  
                  <div className="weather-grid">
                    <div className="weather-item">
                      <div className="weather-icon">
                        <Thermometer size={20} />
                      </div>
                      <div className="weather-info">
                        <span className="weather-label">Air Temperature</span>
                        <span className="weather-value">{Math.round(weatherModal.data.temperature)}°F</span>
                      </div>
                    </div>
                    
                    <div className="weather-item">
                      <div className="weather-icon">
                        <Gauge size={20} />
                      </div>
                      <div className="weather-info">
                        <span className="weather-label">Air Pressure</span>
                        <span className="weather-value">{weatherModal.data.pressure} hPa</span>
                      </div>
                    </div>
                    
                    <div className="weather-item">
                      <div className="weather-icon">
                        <Cloud size={20} />
                      </div>
                      <div className="weather-info">
                        <span className="weather-label">Cloud Cover</span>
                        <span className="weather-value">{weatherModal.data.cloudCover}%</span>
                      </div>
                    </div>
                    
                    <div className="weather-item">
                      <div className="weather-icon">
                        <CloudRain size={20} />
                      </div>
                      <div className="weather-info">
                        <span className="weather-label">Conditions</span>
                        <span className="weather-value">{weatherModal.data.description}</span>
                      </div>
                    </div>
                    
                    <div className="weather-item">
                      <div className="weather-icon">
                        <Moon size={20} />
                      </div>
                      <div className="weather-info">
                        <span className="weather-label">Moon Phase</span>
                        <span className="weather-value">{weatherModal.data.moonPhase}</span>
                      </div>
                    </div>
                    
                    <div className="weather-item">
                      <div className="weather-icon">
                        <span className="wind-icon">💨</span>
                      </div>
                      <div className="weather-info">
                        <span className="weather-label">Wind</span>
                        <span className="weather-value">
                          {Math.round(weatherModal.data.windSpeed)} mph
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="weather-note">
                    <p>💡 <strong>Fishing Tip:</strong> Weather conditions can significantly impact fish behavior. 
                    Consider how these conditions might have influenced your catch!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewCatches;