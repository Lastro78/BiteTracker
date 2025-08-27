import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Brain, TrendingUp, Target, Clock, Thermometer, Gauge, Zap, Calendar, MapPin, Filter, Search, BarChart3 } from 'lucide-react';
import axios from 'axios';
import './AdvancedAnalytics.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://web-production-df22.up.railway.app';

const AdvancedAnalytics = () => {
  const [analysisData, setAnalysisData] = useState([]);
  const [stats, setStats] = useState({});
  const [fieldOptions, setFieldOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Advanced analysis state
  const [groupBy, setGroupBy] = useState(['bait_type']);
  const [successMetric, setSuccessMetric] = useState('total_weight');
  const [filters, setFilters] = useState({});
  const [limit, setLimit] = useState(10);
  const [availableFields, setAvailableFields] = useState([]);

  // Available fields for grouping
  const fieldOptionsList = [
    'bait', 'bait_type', 'bait_colour', 'structure', 'lake', 'water_quality', 
    'line_type', 'time_of_day', 'scented'
  ];

  useEffect(() => {
    loadStats();
    loadFieldOptions();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/catches/stats/overview`);
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadFieldOptions = async () => {
    try {
      const options = {};
      for (const field of fieldOptionsList) {
        const response = await axios.get(`${API_BASE_URL}/catches/options/${field}`);
        options[field] = response.data.options;
      }
      setFieldOptions(options);
      setAvailableFields(fieldOptionsList);
    } catch (err) {
      console.error('Error loading field options:', err);
    }
  };

  const runAdvancedAnalysis = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze/advanced/`, {
        success_metric: successMetric,
        group_by: groupBy,
        filters: Object.keys(filters).length > 0 ? filters : null,
        limit
      });
      
      setAnalysisData(response.data.analysis);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed');
      console.error('Error running analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const addFilter = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const removeFilter = (field) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
  };

  const toggleGroupBy = (field) => {
    setGroupBy(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const getChartData = () => {
    if (!analysisData.length) return [];
    
    return analysisData.map(item => {
      const label = groupBy.map(field => item[field]).join(' - ');
      return {
        name: label,
        value: item[successMetric],
        count: item.count,
        average_weight: item.average_weight
      };
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="advanced-analytics-container">
      <div className="advanced-analytics-header">
        <h2><Brain size={24} /> Advanced Analytics</h2>
        <p>Dynamic analysis with custom grouping and filtering</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <h3>📊 Your Fishing Stats</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <Target size={20} />
            <div>
              <h4>{stats.total_catches || 0}</h4>
              <p>Total Catches</p>
            </div>
          </div>
          <div className="stat-card">
            <Gauge size={20} />
            <div>
              <h4>{stats.total_weight || 0}kg</h4>
              <p>Total Weight</p>
            </div>
          </div>
          <div className="stat-card">
            <TrendingUp size={20} />
            <div>
              <h4>{stats.average_weight || 0}kg</h4>
              <p>Average Weight</p>
            </div>
          </div>
          <div className="stat-card">
            <MapPin size={20} />
            <div>
              <h4>{stats.lake_count || 0}</h4>
              <p>Lakes Fished</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Controls */}
      <div className="analysis-controls">
        <h3>🔧 Analysis Configuration</h3>
        
        {/* Group By Selection */}
        <div className="control-section">
          <h4>Group By Fields:</h4>
          <div className="field-options">
            {availableFields.map(field => (
              <button
                key={field}
                className={`field-option ${groupBy.includes(field) ? 'selected' : ''}`}
                onClick={() => toggleGroupBy(field)}
              >
                {field.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Success Metric */}
        <div className="control-section">
          <h4>Success Metric:</h4>
          <select 
            value={successMetric} 
            onChange={(e) => setSuccessMetric(e.target.value)}
            className="metric-select"
          >
            <option value="total_weight">Total Weight</option>
            <option value="count">Count</option>
            <option value="average_weight">Average Weight</option>
          </select>
        </div>

        {/* Filters */}
        <div className="control-section">
          <h4>Filters:</h4>
          <div className="filters-container">
            {Object.entries(filters).map(([field, value]) => (
              <div key={field} className="filter-tag">
                <span>{field}: {Array.isArray(value) ? value.join(', ') : value}</span>
                <button onClick={() => removeFilter(field)}>×</button>
              </div>
            ))}
            <button className="add-filter-btn" onClick={() => setFilters({})}>
              <Filter size={16} /> Add Filter
            </button>
          </div>
        </div>

        {/* Limit */}
        <div className="control-section">
          <h4>Results Limit:</h4>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
            min="1"
            max="50"
            className="limit-input"
          />
        </div>

        <button 
          className="run-analysis-btn"
          onClick={runAdvancedAnalysis}
          disabled={loading || groupBy.length === 0}
        >
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {/* Results */}
      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
        </div>
      )}

      {analysisData.length > 0 && (
        <div className="analysis-results">
          <h3>📈 Analysis Results</h3>
          
          {/* Summary */}
          <div className="results-summary">
            <p>Showing top {analysisData.length} combinations grouped by: {groupBy.join(', ')}</p>
            <p>Success metric: {successMetric.replace('_', ' ')}</p>
          </div>

          {/* Chart */}
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table */}
          <div className="data-table">
            <h4>Detailed Results</h4>
            <table>
              <thead>
                <tr>
                  {groupBy.map(field => (
                    <th key={field}>{field.replace('_', ' ')}</th>
                  ))}
                  <th>Total Weight</th>
                  <th>Average Weight</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {analysisData.map((item, index) => (
                  <tr key={index}>
                    {groupBy.map(field => (
                      <td key={field}>{item[field] || 'N/A'}</td>
                    ))}
                    <td>{item.total_weight}kg</td>
                    <td>{item.average_weight}kg</td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;
