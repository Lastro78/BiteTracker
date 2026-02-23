import React from 'react';
import { useFishing } from '../contexts/FishingContext';
import { useAuth } from '../contexts/AuthContext';
import HeatMap from '../components/HeatMap';
import { RotateCw, MapPin } from 'lucide-react';
import './HeatMapPage.css';

const HeatMapPage = () => {
  const { catches, fetchCatches, loading, error } = useFishing();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchCatches();
    }
  }, [fetchCatches, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="card">
          <div className="page-header">
            <MapPin size={24} />
            <h2>Fishing Heat Map</h2>
          </div>
          <div className="error">
            <p>You need to be logged in to view the heat map.</p>
            <a href="/login" className="btn btn-primary">
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <RotateCw className="spinner" size={32} />
          <p>Loading catch data...</p>
        </div>
      </div>
    );
  }

  const validCatches = catches.filter(catchItem => 
    catchItem.location && catchItem.location.match(/[NS].*[EW]/)
  );

  return (
    <div className="container">
      <div className="card">
        <div className="page-header">
          <MapPin size={24} />
          <h2>Fishing Heat Map</h2>
          <span className="catch-count">
            {validCatches.length} located catches
          </span>
        </div>

        {error && (
          <div className="error">
            {error}
            {error.includes('Authentication required') && (
              <div style={{ marginTop: '10px' }}>
                <a href="/login" className="btn btn-primary">
                  Go to Login
                </a>
              </div>
            )}
          </div>
        )}

        <div className="map-info">
          <p>
            <strong>Heat intensity</strong> indicates fishing success - 
            warmer colors show areas with larger or more frequent catches.
          </p>
          <div className="legend">
            <div className="legend-item">
              <span className="legend-color" style={{backgroundColor: 'blue'}}></span>
              <span>Low activity</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{backgroundColor: 'lime'}}></span>
              <span>Medium activity</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{backgroundColor: 'red'}}></span>
              <span>High activity</span>
            </div>
          </div>
        </div>

        {validCatches.length === 0 ? (
          <div className="empty-state">
            <p>No geotagged catches found.</p>
            <p>Log catches with GPS coordinates to see them on the map!</p>
          </div>
        ) : (
          <HeatMap catches={validCatches} />
        )}

        <div className="map-stats">
          <h3>Location Statistics</h3>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-value">{validCatches.length}</span>
              <span className="stat-label">Located Catches</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {new Set(validCatches.map(c => c.lake)).size}
              </span>
              <span className="stat-label">Lakes Mapped</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {(validCatches.reduce((sum, c) => sum + (c.fish_weight || 0), 0) / validCatches.length).toFixed(2)}kg
              </span>
              <span className="stat-label">Avg Weight</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatMapPage;