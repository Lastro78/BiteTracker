// src/contexts/FishingContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const FishingContext = createContext();

export const useFishing = () => {
  const context = useContext(FishingContext);
  if (!context) {
    throw new Error('useFishing must be used within a FishingProvider');
  }
  return context;
};

export const FishingProvider = ({ children }) => {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all catches
  const fetchCatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/catches/`);
      setCatches(response.data);
    } catch (err) {
      setError('Failed to fetch catches: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new catch
  const createCatch = async (catchData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/catches/`, catchData);
      setCatches(prev => [...prev, response.data]);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = 'Failed to create catch: ' + (err.response?.data?.detail || err.message);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Update an existing catch - NEW FUNCTION
  const updateCatch = async (catchId, catchData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(`${API_BASE_URL}/catches/${catchId}`, catchData);
      // Update the catch in the local state
      setCatches(prev => prev.map(c => 
        c._id === catchId ? response.data : c
      ));
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = 'Failed to update catch: ' + (err.response?.data?.detail || err.message);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Delete a catch - NEW FUNCTION
  const deleteCatch = async (catchId) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/catches/${catchId}`);
      // Remove the catch from the local state
      setCatches(prev => prev.filter(c => c._id !== catchId));
      return { success: true };
    } catch (err) {
      const errorMsg = 'Failed to delete catch: ' + (err.response?.data?.detail || err.message);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Analyze data
  const analyzeData = async (analysisType, parameter = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze/`, {
        analysis_type: analysisType,
        parameter
      });
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = 'Analysis failed: ' + (err.response?.data?.detail || err.message);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    catches,
    loading,
    error,
    fetchCatches,
    createCatch,
    updateCatch, // ADDED
    deleteCatch, // ADDED
    analyzeData,
    clearError: () => setError(null)
  };

  return (
    <FishingContext.Provider value={value}>
      {children}
    </FishingContext.Provider>
  );
};