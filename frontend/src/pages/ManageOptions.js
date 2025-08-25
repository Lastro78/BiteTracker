import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit, X, Download, Upload, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import './ManageOptions.css';

const ManageOptions = () => {
  const [options, setOptions] = useState({
    structures: [],
    waterQualities: [],
    lineTypes: [],
    baitTypes: [],
    baitColors: [],
    lakes: []
  });
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [activeTab, setActiveTab] = useState('structures');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');

  // Load options from localStorage or config file
  useEffect(() => {
    const loadOptions = async () => {
      setOptionsLoading(true);
      try {
        const savedOptions = localStorage.getItem('fishingOptions');
        if (savedOptions) {
          setOptions(JSON.parse(savedOptions));
        } else {
          const module = await import('../config/fishingoptions');
          setOptions({
            structures: module.structures || [],
            waterQualities: module.waterQualities || [],
            lineTypes: module.lineTypes || [],
            baitTypes: module.baitTypes || [],
            baitColors: module.baitColors || [],
            lakes: module.lakes || []
          });
        }
      } catch (error) {
        console.error('Error loading options:', error);
        showMessage('Error loading options', 'error');
      } finally {
        setOptionsLoading(false);
      }
    };

    loadOptions();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const saveOptions = (newOptions) => {
    setOptions(newOptions);
    localStorage.setItem('fishingOptions', JSON.stringify(newOptions));
  };

  const startEditing = (category, index = null) => {
    setEditingCategory(category);
    setEditingIndex(index);
    setNewItem(index !== null ? options[category][index] : '');
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditingIndex(null);
    setNewItem('');
  };

  const saveItem = () => {
    if (!newItem.trim()) {
      showMessage('Please enter a value', 'error');
      return;
    }

    const updatedOptions = { ...options };
    const trimmedItem = newItem.trim();

    if (editingIndex !== null) {
      // Edit existing item
      updatedOptions[editingCategory][editingIndex] = trimmedItem;
      showMessage('Item updated successfully');
    } else {
      // Add new item - check for duplicates
      if (updatedOptions[editingCategory].includes(trimmedItem)) {
        showMessage('This item already exists', 'error');
        return;
      }
      updatedOptions[editingCategory] = [...updatedOptions[editingCategory], trimmedItem];
      showMessage('Item added successfully');
    }

    saveOptions(updatedOptions);
    cancelEditing();
  };

  const deleteItem = (category, index) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const updatedOptions = { ...options };
      updatedOptions[category] = updatedOptions[category].filter((_, i) => i !== index);
      saveOptions(updatedOptions);
      showMessage('Item deleted successfully');
    }
  };

  const moveItem = (category, index, direction) => {
    const updatedOptions = { ...options };
    const items = [...updatedOptions[category]];
    
    if (direction === 'up' && index > 0) {
      [items[index], items[index - 1]] = [items[index - 1], items[index]];
    } else if (direction === 'down' && index < items.length - 1) {
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
    }
    
    updatedOptions[category] = items;
    saveOptions(updatedOptions);
  };

  const exportOptions = () => {
    const dataStr = JSON.stringify(options, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'fishing-options-backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showMessage('Options exported successfully');
  };

  const importOptions = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedOptions = JSON.parse(e.target.result);
        
        // Validate the imported structure
        const isValid = [
          'structures', 'waterQualities', 'lineTypes', 
          'baitTypes', 'baitColors', 'lakes'
        ].every(key => Array.isArray(importedOptions[key]));
        
        if (isValid) {
          saveOptions(importedOptions);
          showMessage('Options imported successfully');
        } else {
          showMessage('Invalid file format', 'error');
        }
      } catch (error) {
        showMessage('Error importing file', 'error');
      }
    };
    reader.readAsText(file);
    
    // Reset the file input
    event.target.value = '';
  };

  const resetToDefault = async () => {
    if (window.confirm('Are you sure you want to reset to default options? All customizations will be lost.')) {
      try {
        const module = await import('../config/fishingoptions');
        const defaultOptions = {
          structures: module.structures || [],
          waterQualities: module.waterQualities || [],
          lineTypes: module.lineTypes || [],
          baitTypes: module.baitTypes || [],
          baitColors: module.baitColors || [],
          lakes: module.lakes || []
        };
        saveOptions(defaultOptions);
        showMessage('Reset to default options successfully');
      } catch (error) {
        showMessage('Error resetting options', 'error');
      }
    }
  };

  const getFilteredItems = (category) => {
    const items = options[category] || [];
    if (!searchTerm) return items;
    
    return items.filter(item => 
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const categoryNames = {
    structures: 'Structures',
    waterQualities: 'Water Qualities',
    lineTypes: 'Line Types',
    baitTypes: 'Bait Types',
    baitColors: 'Bait Colors',
    lakes: 'Lakes'
  };

  if (optionsLoading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading options...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="management-header">
          <h2>Fishing Options Management</h2>
          <div className="header-actions">
            <button onClick={exportOptions} className="btn btn-secondary">
              <Download size={16} />
              Export
            </button>
            <label className="btn btn-secondary">
              <Upload size={16} />
              Import
              <input
                type="file"
                accept=".json"
                onChange={importOptions}
                style={{ display: 'none' }}
              />
            </label>
            <button onClick={resetToDefault} className="btn btn-warning">
              Reset to Default
            </button>
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="tabs">
          {Object.keys(categoryNames).map(category => (
            <button
              key={category}
              className={`tab ${activeTab === category ? 'active' : ''}`}
              onClick={() => setActiveTab(category)}
            >
              {categoryNames[category]}
              <span className="tab-count">{options[category]?.length || 0}</span>
            </button>
          ))}
        </div>

        <div className="search-box">
          <Filter size={18} />
          <input
            type="text"
            placeholder={`Search ${categoryNames[activeTab]}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="clear-search"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="management-content">
          <div className="category-section">
            <div className="category-header">
              <h3>{categoryNames[activeTab]}</h3>
              <span className="item-count">
                {getFilteredItems(activeTab).length} of {options[activeTab]?.length} items
              </span>
            </div>

            <div className="items-list">
              {getFilteredItems(activeTab).map((item, index) => {
                const originalIndex = options[activeTab].indexOf(item);
                return (
                  <div key={index} className="item-row">
                    <span className="item-text">{item}</span>
                    <div className="item-actions">
                      <button
                        onClick={() => moveItem(activeTab, originalIndex, 'up')}
                        disabled={originalIndex === 0}
                        className="btn-icon"
                        title="Move up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => moveItem(activeTab, originalIndex, 'down')}
                        disabled={originalIndex === options[activeTab].length - 1}
                        className="btn-icon"
                        title="Move down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        onClick={() => startEditing(activeTab, originalIndex)}
                        className="btn-icon"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => deleteItem(activeTab, originalIndex)}
                        className="btn-icon danger"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {getFilteredItems(activeTab).length === 0 && (
                <div className="empty-state">
                  <p>
                    {searchTerm 
                      ? `No ${categoryNames[activeTab].toLowerCase()} found matching "${searchTerm}"`
                      : `No ${categoryNames[activeTab].toLowerCase()} configured`
                    }
                  </p>
                </div>
              )}
            </div>

            {(editingCategory === activeTab && editingIndex === null) && (
              <div className="add-item-form">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder={`Add new ${categoryNames[activeTab].toLowerCase()}...`}
                  className="item-input"
                  onKeyPress={(e) => e.key === 'Enter' && saveItem()}
                  autoFocus
                />
                <div className="form-actions">
                  <button onClick={saveItem} className="btn btn-primary btn-sm">
                    <Save size={14} />
                    Add
                  </button>
                  <button onClick={cancelEditing} className="btn btn-secondary btn-sm">
                    <X size={14} />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {editingCategory === activeTab && editingIndex !== null && (
              <div className="edit-item-form">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="item-input"
                  onKeyPress={(e) => e.key === 'Enter' && saveItem()}
                  autoFocus
                />
                <div className="form-actions">
                  <button onClick={saveItem} className="btn btn-primary btn-sm">
                    <Save size={14} />
                    Save
                  </button>
                  <button onClick={cancelEditing} className="btn btn-secondary btn-sm">
                    <X size={14} />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!editingCategory && (
              <button
                onClick={() => startEditing(activeTab)}
                className="btn btn-primary add-item-btn"
              >
                <Plus size={16} />
                Add {categoryNames[activeTab].slice(0, -1)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageOptions;