import React, { useState, useEffect } from 'react';
import { useFishing } from '../contexts/FishingContext';
import { useFishingOptions } from '../hooks/useFishingOptions';
import { 
  RotateCw, Filter, Search, Calendar, MapPin, Scale, Clock, 
  Edit, Trash2, Save, X, Check, AlertCircle 
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
                      <span className="location-truncate">{catchItem.location}</span>
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
                      <span>{catchItem.water_temp}°C, {catchItem.water_quality}</span>
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
                      <span>Boat: {catchItem.boat_depth}m, Bait: {catchItem.bait_depth}m</span>
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
                      <span>{catchItem.line_type}, {catchItem.scented ? 'Scented' : 'Unscented'}</span>
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
    </div>
  );
};

export default ViewCatches;