import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Analytics.css';
import { API_BASE_URL } from '../contexts/FishingContext';

const Analytics = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisType, setAnalysisType] = useState('bait_success');
  const [parameter, setParameter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Define colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/analyze/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis_type: analysisType,
          parameter: parameter || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [analysisType, parameter]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Format data for different chart types
  const formatBaitAnalysisData = (data) => {
    return Object.entries(data).map(([baitType, stats]) => ({
      name: baitType,
      totalWeight: stats.total_weight || 0,
      averageWeight: stats.average_weight || 0,
      count: stats.count || 0
    }));
  };

  const formatTimeAnalysisData = (data) => {
    return Object.entries(data).map(([hour, stats]) => ({
      name: `${hour}:00`,
      averageWeight: stats.average_weight || 0,
      count: stats.count || 0,
      totalWeight: stats.average_weight * stats.count || 0
    }));
  };

  const formatStructureAnalysisData = (data) => {
    return Object.entries(data).map(([structure, stats]) => ({
      name: structure,
      totalWeight: stats.total_weight || 0,
      averageWeight: stats.average_weight || 0,
      count: stats.count || 0
    }));
  };

  const formatLakeAnalysisData = (data) => {
    return Object.entries(data).map(([lake, stats]) => ({
      name: lake,
      totalWeight: stats.total_weight || 0,
      averageWeight: stats.average_weight || 0,
      count: stats.count || 0
    }));
  };

  const formatDateAnalysisData = (data) => {
    return Object.entries(data).map(([date, stats]) => ({
      name: date,
      totalWeight: stats.total_weight || 0,
      count: stats.count || 0
    }));
  };

  const formatWaterTempAnalysisData = (data) => {
    return Object.entries(data).map(([tempRange, stats]) => ({
      name: tempRange,
      totalWeight: stats.total_weight || 0,
      averageWeight: stats.average_weight || 0,
      count: stats.count || 0
    }));
  };

  const formatBaitDepthAnalysisData = (data) => {
    return Object.entries(data).map(([depth, stats]) => ({
      name: `${depth}Ft`,
      totalWeight: stats.total_weight || 0,
      averageWeight: stats.average_weight || 0,
      count: stats.count || 0
    }));
  };

  // Render appropriate charts based on analysis type
  const renderCharts = () => {
    if (!analysisData || Object.keys(analysisData).length === 0) {
      return <div className="loading-state">No data available for analysis</div>;
    }

    let chartData = [];
    let chartTitle = '';

    switch (analysisType) {
      case 'bait_success':
        chartData = formatBaitAnalysisData(analysisData);
        chartTitle = 'Bait Success Analysis';
        break;
      case 'time_analysis':
        chartData = formatTimeAnalysisData(analysisData);
        chartTitle = 'Time of Day Analysis';
        break;
      case 'structure_analysis':
        chartData = formatStructureAnalysisData(analysisData);
        chartTitle = 'Structure Analysis';
        break;
      case 'lake_analysis':
        chartData = formatLakeAnalysisData(analysisData);
        chartTitle = 'Lake Analysis';
        break;
      case 'date_analysis':
        chartData = formatDateAnalysisData(analysisData);
        chartTitle = 'Date Analysis';
        break;
      case 'water_temp_analysis':
        chartData = formatWaterTempAnalysisData(analysisData);
        chartTitle = 'Water Temperature Analysis';
        break;
      case 'bait_depth_analysis':
        chartData = formatBaitDepthAnalysisData(analysisData);
        chartTitle = 'Bait Depth Analysis';
        break;
      default:
        return <div>Unknown analysis type</div>;
    }

    if (chartData.length === 0) {
      return <div className="loading-state">No data available for this analysis</div>;
    }

    return (
      <div className="analysis-results">
        <h3>{chartTitle}</h3>
        
        <div className="chart-row">
          {/* Bar Chart */}
          <div className="chart-section">
            <h4>Total Weight by Category</h4>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} className={`${analysisType.replace('_', '-')}-bar-chart`}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalWeight" fill={COLORS[0]} name="Total Weight (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="chart-section">
            <h4>Distribution by Count</h4>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart className={`${analysisType.replace('_', '-')}-pie-chart`}>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Additional stats */}
        <div className="result-grid">
          {chartData.slice(0, 4).map((item, index) => (
            <div key={index} className="result-card">
              <h4>{item.name}</h4>
              <div className="result-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Weight:</span>
                  <span className="stat-value">{item.totalWeight?.toFixed(2)} kg</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Weight:</span>
                  <span className="stat-value">{item.averageWeight?.toFixed(2)} kg</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Count:</span>
                  <span className="stat-value">{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Fishing Analytics</h2>
        <div className="analysis-controls">
          <select
            className="analysis-select"
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value)}
          >
            <option value="bait_success">Bait Success</option>
            <option value="time_analysis">Time Analysis</option>
            <option value="structure_analysis">Structure Analysis</option>
            <option value="lake_analysis">Lake Analysis</option>
            <option value="date_analysis">Date Analysis</option>
            <option value="water_temp_analysis">Water Temp Analysis</option>
            <option value="bait_depth_analysis">Bait Depth Analysis</option>
          </select>

          {analysisType === 'bait_depth_analysis' && (
            <div className="parameter-group">
              <label className="parameter-label">Bait Type (optional):</label>
              <input
                className="parameter-input"
                type="text"
                value={parameter}
                onChange={(e) => setParameter(e.target.value)}
                placeholder="Enter bait type"
              />
            </div>
          )}

          <button className="btn btn-primary" onClick={loadAnalytics}>
            Refresh Data
          </button>
        </div>
      </div>

      {loading && <div className="loading-state">Loading analytics data...</div>}
      {error && <div className="error-state">Error: {error}</div>}

      <div className="analytics-content">
        {renderCharts()}
      </div>
    </div>
  );
};

export default Analytics;