
// src/pages/EnhancedAnalytics.js
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Brain, TrendingUp, Target, Clock, Thermometer, Gauge, Zap, Calendar, MapPin } from 'lucide-react';
import axios from 'axios';
import './EnhancedAnalytics.css';

// Define API_BASE_URL directly or use environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const EnhancedAnalytics = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisType, setAnalysisType] = useState('bait_success');
  const [parameter, setParameter] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [patternSummary, setPatternSummary] = useState(null);
  const [allAnalysisData, setAllAnalysisData] = useState({});

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];

  // Load species list on component mount
  useEffect(() => {
    const loadSpeciesList = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/species/list`);
        setSpeciesList(response.data.species);
      } catch (err) {
        console.error('Error loading species list:', err);
      }
    };
    loadSpeciesList();
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Making request to:', `${API_BASE_URL}/analyze/`);
      
      const response = await axios.post(`${API_BASE_URL}/analyze/`, {
        analysis_type: analysisType,
        parameter: parameter || null,
        species: selectedSpecies || null,
      });

      const data = response.data;
      setAnalysisData(data);
      
      // Store data for pattern analysis
      setAllAnalysisData(prev => ({
        ...prev,
        [analysisType]: data
      }));
      
      // Generate insights and predictions based on the data
      generateInsights(data);
      generatePredictions(data);
      
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch analytics data';
      setError(errorMsg);
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [analysisType, parameter, selectedSpecies]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    // Generate pattern summary when we have multiple analysis types
    if (Object.keys(allAnalysisData).length >= 2) {
      generatePatternSummary();
    }
  }, [allAnalysisData]);

  const generatePatternSummary = () => {
    const summary = {
      optimalConditions: [],
      recommendedStrategy: [],
      successProbability: '75%',
      confidence: 'medium'
    };

    // Extract key insights from each analysis type
    Object.entries(allAnalysisData).forEach(([type, data]) => {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        switch (type) {
          case 'bait_success':
            const topBait = entries.sort((a, b) => (b[1].total_weight || 0) - (a[1].total_weight || 0))[0];
            summary.optimalConditions.push({
              icon: <Target size={16} />,
              text: `Best bait: ${topBait[0]}`
            });
            break;

          case 'time_analysis':
            const bestTime = entries.sort((a, b) => (b[1].average_weight || 0) - (a[1].average_weight || 0))[0];
            summary.optimalConditions.push({
              icon: <Clock size={16} />,
              text: `Optimal time: ${bestTime[0]}:00`
            });
            break;

          case 'structure_analysis':
            const bestStructure = entries.sort((a, b) => (b[1].total_weight || 0) - (a[1].total_weight || 0))[0];
            summary.optimalConditions.push({
              icon: <Gauge size={16} />,
              text: `Best structure: ${bestStructure[0]}`
            });
            break;

          case 'water_temp_analysis':
            const bestTemp = entries.sort((a, b) => (b[1].average_weight || 0) - (a[1].average_weight || 0))[0];
            summary.optimalConditions.push({
              icon: <Thermometer size={16} />,
              text: `Ideal water temp: ${bestTemp[0]}`
            });
            break;

          case 'bait_depth_analysis':
            const bestDepth = entries.sort((a, b) => (b[1].average_weight || 0) - (a[1].average_weight || 0))[0];
            summary.optimalConditions.push({
              icon: <MapPin size={16} />,
              text: `Optimal depth: ${bestDepth[0]}`
            });
            break;
        }
      }
    });

    // Generate recommended strategy based on combined data
    if (summary.optimalConditions.length >= 3) {
      summary.recommendedStrategy = [
        "Start with top-performing bait at optimal depth",
        "Focus on identified structure types",
        "Plan sessions during peak time windows",
        "Monitor water temperature conditions"
      ];
      summary.successProbability = '85%';
      summary.confidence = 'high';
    }

    setPatternSummary(summary);
  };

  const formatChartData = (data) => {
    if (!data) return [];
    
    if (analysisType === 'time_analysis') {
      return Object.entries(data).map(([hour, stats]) => ({
        name: `${hour}:00`,
        totalWeight: stats.total_weight || 0,
        averageWeight: stats.average_weight || 0,
        count: stats.count || 0,
        value: stats.average_weight || stats.total_weight || stats.count || 0
      }));
    }
    
    if (analysisType === 'date_analysis') {
      return Object.entries(data).map(([date, stats]) => ({
        name: date,
        totalWeight: stats.total_weight || 0,
        count: stats.count || 0,
        value: stats.total_weight || stats.count || 0
      }));
    }
    
    if (analysisType === 'water_temp_analysis' || analysisType === 'bait_depth_analysis') {
      return Object.entries(data).map(([range, stats]) => ({
        name: range,
        totalWeight: stats.total_weight || 0,
        averageWeight: stats.average_weight || 0,
        count: stats.count || 0,
        value: stats.total_weight || 0
      }));
    }
    
    return Object.entries(data).map(([key, stats]) => ({
      name: key,
      totalWeight: stats.total_weight || 0,
      averageWeight: stats.average_weight || 0,
      count: stats.count || 0,
      value: stats.total_weight || 0
    }));
  };

  const generateInsights = (data) => {
    const newInsights = [];
    
    if (!data || Object.keys(data).length === 0) {
      setInsights(newInsights);
      return;
    }
    
    if (analysisType === 'bait_success') {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const topBait = entries.sort((a, b) => (b[1].total_weight || 0) - (a[1].total_weight || 0))[0];
        newInsights.push({
          icon: <Target size={20} />,
          title: 'Top Performing Bait',
          description: `${topBait[0]} has the highest total catch weight (${(topBait[1].total_weight || 0).toFixed(2)}kg)`,
          confidence: 'high'
        });
      }
    }
    
    if (analysisType === 'time_analysis') {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const bestHour = entries.sort((a, b) => (b[1].average_weight || 0) - (a[1].average_weight || 0))[0];
        newInsights.push({
          icon: <Clock size={20} />,
          title: 'Optimal Fishing Time',
          description: `Best average catch weight at ${bestHour[0]}:00 (${(bestHour[1].average_weight || 0).toFixed(2)}kg avg)`,
          confidence: 'medium'
        });
      }
    }
    
    if (analysisType === 'structure_analysis') {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const bestStructure = entries.sort((a, b) => (b[1].total_weight || 0) - (a[1].total_weight || 0))[0];
        newInsights.push({
          icon: <Gauge size={20} />,
          title: 'Most Productive Structure',
          description: `${bestStructure[0]} has yielded the most fish (${(bestStructure[1].total_weight || 0).toFixed(2)}kg total)`,
          confidence: 'high'
        });
      }
    }

    if (analysisType === 'lake_analysis') {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const bestLake = entries.sort((a, b) => (b[1].total_weight || 0) - (a[1].total_weight || 0))[0];
        newInsights.push({
          icon: <Thermometer size={20} />,
          title: 'Most Productive Lake',
          description: `${bestLake[0]} has the highest total catch weight (${(bestLake[1].total_weight || 0).toFixed(2)}kg)`,
          confidence: 'high'
        });
      }
    }

    if (analysisType === 'water_temp_analysis') {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const bestTemp = entries.sort((a, b) => (b[1].average_weight || 0) - (a[1].average_weight || 0))[0];
        newInsights.push({
          icon: <Thermometer size={20} />,
          title: 'Optimal Water Temperature',
          description: `Best results in ${bestTemp[0]} water (${(bestTemp[1].average_weight || 0).toFixed(2)}kg avg)`,
          confidence: 'high'
        });
        
        if (entries.length > 1) {
          const tempRanges = entries.map(([range]) => range.replace(/[^\d.-]/g, ''));
          const validTemps = tempRanges.filter(t => t !== '' && !isNaN(Number(t)));
          if (validTemps.length > 0) {
            const minTemp = Math.min(...validTemps.map(Number));
            const maxTemp = Math.max(...validTemps.map(Number));
            newInsights.push({
              icon: <Thermometer size={20} />,
              title: 'Temperature Range',
              description: `Effective fishing between ${minTemp}°C and ${maxTemp}°C`,
              confidence: 'medium'
            });
          }
        }
      }
    }

    if (analysisType === 'bait_depth_analysis') {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const bestDepth = entries.sort((a, b) => (b[1].average_weight || 0) - (a[1].average_weight || 0))[0];
        newInsights.push({
          icon: <Gauge size={20} />,
          title: 'Optimal Bait Depth',
          description: `Best results at ${bestDepth[0]} depth (${(bestDepth[1].average_weight || 0).toFixed(2)}kg avg)`,
          confidence: 'high'
        });
        
        const depthPattern = entries
          .filter(([_, stats]) => stats.count > 1)
          .sort((a, b) => (b[1].average_weight || 0) - (a[1].average_weight || 0));
        
        if (depthPattern.length > 1) {
          newInsights.push({
            icon: <Gauge size={20} />,
            title: 'Depth Strategy',
            description: `Focus on ${depthPattern[0][0]} - ${depthPattern[1][0]} depths for consistent results`,
            confidence: 'medium'
          });
        }
      }
    }

    if (analysisType === 'date_analysis') {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const bestDay = entries.sort((a, b) => (b[1].total_weight || 0) - (a[1].total_weight || 0))[0];
        newInsights.push({
          icon: <Clock size={20} />,
          title: 'Most Productive Day',
          description: `Highest catch weight on ${bestDay[0]} (${(bestDay[1].total_weight || 0).toFixed(2)}kg)`,
          confidence: 'medium'
        });
      }
    }

    setInsights(newInsights);
  };

  const generatePredictions = (data) => {
    const newPredictions = [];
    
    if (!data || Object.keys(data).length === 0) {
      setPredictions(newPredictions);
      return;
    }
    
    if (analysisType === 'bait_success' && Object.keys(data).length >= 2) {
      const entries = Object.entries(data);
      const sorted = entries.sort((a, b) => (b[1].total_weight || 0) - (a[1].total_weight || 0));
      
      if (sorted.length >= 2) {
        newPredictions.push({
          title: 'Recommended Bait Strategy',
          description: `Focus on ${sorted[0][0]} for maximum yield. Consider combining with ${sorted[1][0]} for variety.`,
          successRate: '85%'
        });
      }
    }
    
    if (analysisType === 'time_analysis') {
      const entries = Object.entries(data);
      if (entries.length >= 2) {
        const bestTimes = entries.sort((a, b) => (b[1].average_weight || 0) - (a[1].average_weight || 0)).slice(0, 2);
        newPredictions.push({
          title: 'Optimal Fishing Schedule',
          description: `Plan your trips between ${bestTimes[0][0]}:00 and ${bestTimes[1][0]}:00 for best results`,
          successRate: '78%'
        });
      } else if (entries.length === 1) {
        newPredictions.push({
          title: 'Optimal Fishing Time',
          description: `Best results at ${entries[0][0]}:00`,
          successRate: '75%'
        });
      }
    }

    if (analysisType === 'structure_analysis' && Object.keys(data).length >= 2) {
      const entries = Object.entries(data);
      const sorted = entries.sort((a, b) => (b[1].total_weight || 0) - (a[1].total_weight || 0));
      
      if (sorted.length >= 2) {
        newPredictions.push({
          title: 'Structure Strategy',
          description: `Focus on ${sorted[0][0]} areas. Also explore ${sorted[1][0]} for additional opportunities.`,
          successRate: '82%'
        });
      }
    }

    if (analysisType === 'lake_analysis' && Object.keys(data).length >= 2) {
      const entries = Object.entries(data);
      const sorted = entries.sort((a, b) => (b[1].total_weight || 0) - (a[1].total_weight || 0));
      
      if (sorted.length >= 2) {
        newPredictions.push({
          title: 'Lake Selection Strategy',
          description: `Primary focus: ${sorted[0][0]}. Secondary: ${sorted[1][0]} for varied conditions.`,
          successRate: '80%'
        });
      }
    }

    if (analysisType === 'water_temp_analysis') {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const optimalTemps = entries.sort((a, b) => (b[1].average_weight || 0) - (a[1].average_weight || 0)).slice(0, 2);
        
        if (optimalTemps.length > 0) {
          newPredictions.push({
            title: 'Temperature Strategy',
            description: `Target water temperatures around ${optimalTemps[0][0]} for optimal results`,
            successRate: '75%'
          });
        }

        if (entries.length > 3) {
          const tempTrend = entries
            .filter(([_, stats]) => stats.count > 1)
            .sort((a, b) => {
              const tempA = a[0].replace(/[^\d.-]/g, '');
              const tempB = b[0].replace(/[^\d.-]/g, '');
              return parseFloat(tempA) - parseFloat(tempB);
            });
          
          if (tempTrend.length > 2) {
            newPredictions.push({
              title: 'Temperature Trend',
              description: `Fishing improves as water temperature increases within the ${tempTrend[0][0]} to ${tempTrend[tempTrend.length - 1][0]} range`,
              successRate: '70%'
            });
          }
        }
      }
    }

    if (analysisType === 'bait_depth_analysis') {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const optimalDepths = entries.sort((a, b) => (b[1].average_weight || 0) - (a[1].average_weight || 0)).slice(0, 2);
        
        if (optimalDepths.length > 0) {
          newPredictions.push({
            title: 'Depth Strategy',
            description: `Focus on depths around ${optimalDepths[0][0]} for best average weight`,
            successRate: '83%'
          });
        }

        const depthProgression = entries
          .filter(([_, stats]) => stats.count > 1)
          .sort((a, b) => {
            const depthA = a[0].replace(/[^\d.-]/g, '');
            const depthB = b[0].replace(/[^\d.-]/g, '');
            return parseFloat(depthA) - parseFloat(depthB);
          });
        
        if (depthProgression.length > 2) {
          const shallowest = depthProgression[0][0];
          const deepest = depthProgression[depthProgression.length - 1][0];
          newPredictions.push({
            title: 'Depth Progression',
            description: `Gradually work from ${shallowest} to ${deepest} throughout the day`,
            successRate: '77%'
          });
        }
      }
    }

    if (analysisType === 'date_analysis') {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const recentTrend = entries.slice(-5);
        if (recentTrend.length >= 3) {
          const trend = recentTrend.map(([date, stats]) => stats.total_weight);
          const isImproving = trend[trend.length - 1] > trend[0];
          
          newPredictions.push({
            title: 'Recent Trend',
            description: `Catch weight is ${isImproving ? 'improving' : 'declining'} in recent sessions`,
            successRate: isImproving ? '85%' : '65%'
          });
        }
      }
    }

    setPredictions(newPredictions);
  };

  const renderCharts = () => {
    if (!analysisData || Object.keys(analysisData).length === 0) {
      return <div className="loading-state">No data available for analysis</div>;
    }

    const chartData = formatChartData(analysisData);
    const chartTitle = analysisType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const barDataKey = analysisType === 'time_analysis' ? 'averageWeight' : 'totalWeight';
    const barChartTitle = analysisType === 'time_analysis' ? 'Average Weight by Hour' : 
                         analysisType === 'date_analysis' ? 'Total Weight by Date' :
                         'Total Weight by Category';

    return (
      <div className="analysis-results">
        <h3>{chartTitle}</h3>
        
        <div className="chart-row">
          <div className="chart-section">
            <h4>{barChartTitle}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={analysisType === 'time_analysis' ? -45 : 0}
                  textAnchor={analysisType === 'time_analysis' ? 'end' : 'middle'}
                  height={analysisType === 'time_analysis' ? 80 : undefined}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${Number(value).toFixed(2)} kg`, analysisType === 'time_analysis' ? 'Avg Weight' : 'Total Weight']}
                />
                <Legend />
                <Bar 
                  dataKey={barDataKey} 
                  fill={COLORS[0]} 
                  name={analysisType === 'time_analysis' ? 'Average Weight (kg)' : 'Total Weight (kg)'}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-section">
            <h4>Distribution by Count</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} catches`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="result-grid">
          {chartData.slice(0, 4).map((item, index) => (
            <div key={index} className="result-card">
              <h4>{item.name}</h4>
              <div className="result-stats">
                {item.totalWeight > 0 && (
                  <div className="stat-item">
                    <span className="stat-label">Total Weight:</span>
                    <span className="stat-value">{item.totalWeight.toFixed(2)} kg</span>
                  </div>
                )}
                {item.averageWeight > 0 && (
                  <div className="stat-item">
                    <span className="stat-label">Avg Weight:</span>
                    <span className="stat-value">{item.averageWeight.toFixed(2)} kg</span>
                  </div>
                )}
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
    <div className="enhanced-analytics-container">
      <div className="analytics-header">
        <h2>Enhanced Fishing Analytics</h2>
        <div className="analysis-controls">
          <div className="control-group">
            <label className="control-label">Analysis Type:</label>
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
          </div>

          <div className="control-group">
            <label className="control-label">Species Filter:</label>
            <select
              className="species-select"
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
            >
              <option value="">All Species</option>
              {speciesList.map(species => (
                <option key={species} value={species}>{species}</option>
              ))}
            </select>
          </div>

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
            Analyze
          </button>
        </div>
      </div>

      {loading && <div className="loading-state">Loading enhanced analytics...</div>}
      {error && <div className="error-state">Error: {error}</div>}

      <div className="analytics-content">
        {/* Pattern Summary Section */}
        {patternSummary && patternSummary.optimalConditions.length > 0 && (
          <div className="pattern-summary-section">
            <h3>
              <Zap size={24} style={{ marginRight: '10px' }} />
              Fishing Pattern Summary
            </h3>
            <div className="pattern-summary-content">
              <div className="optimal-conditions">
                <h4>Optimal Conditions</h4>
                <div className="conditions-grid">
                  {patternSummary.optimalConditions.map((condition, index) => (
                    <div key={index} className="condition-item">
                      <span className="condition-icon">{condition.icon}</span>
                      <span className="condition-text">{condition.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {patternSummary.recommendedStrategy.length > 0 && (
                <div className="recommended-strategy">
                  <h4>Recommended Strategy</h4>
                  <ul>
                    {patternSummary.recommendedStrategy.map((strategy, index) => (
                      <li key={index}>{strategy}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="success-probability">
                <h4>Success Probability</h4>
                <div className={`probability-badge ${patternSummary.confidence}`}>
                  {patternSummary.successProbability}
                </div>
                <p className="confidence-level">{patternSummary.confidence} confidence</p>
              </div>
            </div>
          </div>
        )}

        {renderCharts()}

        {insights.length > 0 && (
          <div className="insights-section">
            <h3>
              <Brain size={24} style={{ marginRight: '10px' }} />
              AI Insights
            </h3>
            <div className="insights-grid">
              {insights.map((insight, index) => (
                <div key={index} className="insight-card">
                  <div className="insight-icon">
                    {insight.icon}
                  </div>
                  <div className="insight-content">
                    <h4>{insight.title}</h4>
                    <p>{insight.description}</p>
                    <span className={`confidence-badge ${insight.confidence}`}>
                      {insight.confidence} confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {predictions.length > 0 && (
          <div className="predictions-section">
            <h3>
              <TrendingUp size={24} style={{ marginRight: '10px' }} />
              Predictive Analysis
            </h3>
            <div className="predictions-grid">
              {predictions.map((prediction, index) => (
                <div key={index} className="prediction-card">
                  <h4>{prediction.title}</h4>
                  <div className="prediction-stats">
                    <p>{prediction.description}</p>
                    <p><strong>Predicted Success Rate:</strong> {prediction.successRate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAnalytics;
