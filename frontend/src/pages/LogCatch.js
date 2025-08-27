import React, { useState } from 'react';
import { useFishing } from '../contexts/FishingContext';
import { useFishingOptions } from '../hooks/useFishingOptions';
import { Save, RotateCw } from 'lucide-react';
import './LogCatch.css';

const LogCatch = () => {
  const { createCatch, loading, error } = useFishing();
  const { 
    structures, 
    waterQualities, 
    lineTypes, 
    baitTypes, 
    baitColors,
    lakes 
  } = useFishingOptions();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    location: '',
    lake: '',
    structure: '',
    water_temp: '',
    water_quality: 'Clear',
    line_type: 'Braid',
    boat_depth: '',
    bait_depth: '',
    bait: '',
    bait_type: '',
    bait_colour: '',
    scented: false,
    fish_weight: '',
    line_weight: '',
    weight_pegged: false,
    hook_size: '',
    comments: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createCatch({
      ...formData,
      time: formData.time + ':00',
      water_temp: parseFloat(formData.water_temp),
      boat_depth: parseFloat(formData.boat_depth),
      bait_depth: parseFloat(formData.bait_depth),
      fish_weight: parseFloat(formData.fish_weight),
      line_weight: formData.line_weight ? parseFloat(formData.line_weight) : null,
      weight_pegged: formData.weight_pegged,
      hook_size: formData.hook_size || null
    });

    if (result.success) {
      setSubmitted(true);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        location: '',
        lake: '',
        structure: '',
        water_temp: '',
        water_quality: 'Clear',
        line_type: 'Braid',
        boat_depth: '',
        bait_depth: '',
        bait: '',
        bait_type: '',
        bait_colour: '',
        scented: false,
        fish_weight: '',
        line_weight: '',
        weight_pegged: false,
        hook_size: '',
        comments: ''
      });
      
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <RotateCw className="spinner" size={32} />
          <p>Logging your catch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Log New Catch</h2>
        
        {error && <div className="error">{error}</div>}
        {submitted && (
          <div className="success">
            ✅ Catch logged successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="catch-form">
          {/* Date and Lake Fields */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lake Name</label>
              <select
                name="lake"
                value={formData.lake}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Lake</option>
                {lakes.map(lake => (
                  <option key={lake} value={lake}>{lake}</option>
                ))}
                <option value="other">Other (specify in comments)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

                         <div className="form-group">
               <label className="form-label">Water Temperature (°F)</label>
               <input
                 type="number"
                 name="water_temp"
                 value={formData.water_temp}
                 onChange={handleChange}
                 className="form-input"
                 step="0.1"
                 min="0"
                 max="90"
                 required
               />
             </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location (GPS Coordinates)</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="form-input"
              placeholder={'e.g., 24°50\'42"S 29°26\'16"E'}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Structure</label>
              <select
                name="structure"
                value={formData.structure}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Structure</option>
                {structures.map(structure => (
                  <option key={structure} value={structure}>{structure}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Water Quality</label>
              <select
                name="water_quality"
                value={formData.water_quality}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Water Quality</option>
                {waterQualities.map(quality => (
                  <option key={quality} value={quality}>{quality}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Boat Depth (Ft)</label>
              <input
                type="number"
                name="boat_depth"
                value={formData.boat_depth}
                onChange={handleChange}
                className="form-input"
                step="0.1"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bait Depth (Ft)</label>
              <input
                type="number"
                name="bait_depth"
                value={formData.bait_depth}
                onChange={handleChange}
                className="form-input"
                step="0.1"
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Line Type</label>
              <select
                name="line_type"
                value={formData.line_type}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Line Type</option>
                {lineTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Bait Type</label>
              <select
                name="bait_type"
                value={formData.bait_type}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Bait Type</option>
                {baitTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bait Name</label>
              <input
                type="text"
                name="bait"
                value={formData.bait}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Senko, DD7, Spinner Bait"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bait Color</label>
              <select
                name="bait_colour"
                value={formData.bait_colour}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Color</option>
                {baitColors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fish Weight (Kg)</label>
              <input
                type="number"
                name="fish_weight"
                value={formData.fish_weight}
                onChange={handleChange}
                className="form-input"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Line Weight (Lb)</label>
              <input
                type="number"
                name="line_weight"
                value={formData.line_weight}
                onChange={handleChange}
                className="form-input"
                step="0.1"
                min="0"
                placeholder="e.g., 12.0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Hook Size</label>
              <input
                type="text"
                name="hook_size"
                value={formData.hook_size}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 2/0, 4, 6"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="weight_pegged"
                  checked={formData.weight_pegged}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                Weight Pegged (Tick)
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="scented"
                  checked={formData.scented}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                Scented Bait
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Comments</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Any additional notes about the catch..."
              rows="3"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={20} />
            {loading ? 'Logging...' : 'Log Catch'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogCatch;