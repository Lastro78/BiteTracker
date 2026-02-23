import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, X, Check } from 'lucide-react';
import axios from 'axios';
import { useFishingOptions } from '../hooks/useFishingOptions';
import './BulkUpload.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://web-production-df22.up.railway.app';

const BulkUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);
  
  // Remove unused destructuring - keep the hook call if it's needed for other purposes
  useFishingOptions();

  // Sample data structure for templates
  const sampleData = [
    {
      date: '2023-07-15',
      time: '14:30:00',
      location: '24°50\'42"S 29°26\'16"E',
      lake: 'Hartbeespoort',
      structure: 'Rocky Point',
      water_temp: '22.5',
      water_quality: 'Clear',
      line_type: 'Braid',
      boat_depth: '25.5',
      bait_depth: '18.0',
      bait: 'Senko',
      bait_type: 'Soft Plastic',
      bait_colour: 'Green Pumpkin',
      scented: 'true',
      fish_weight: '2.5',
      species: 'Largemouth Bass',
      line_weight: '12.0',
      weight_pegged: 'true',
      hook_size: '2/0',
      comments: 'Caught on a slow retrieve'
    }
  ];

  // Generate CSV template
  const generateCsvTemplate = () => {
    const headers = Object.keys(sampleData[0]).join(',');
    const rows = sampleData.map(obj => 
      Object.values(obj).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    
    // Create blob with UTF-8 BOM for better Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'bite-tracker-template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate JSON template
  const generateJsonTemplate = () => {
    const jsonContent = JSON.stringify(sampleData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'bite-tracker-template.json');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.csv') || fileName.endsWith('.json')) {
        setSelectedFile(file);
        setUploadStatus('');
        setUploadResult(null);
      } else {
        setUploadStatus('error');
        setUploadResult({
          success: false,
          message: 'Please select a CSV or JSON file'
        });
      }
    }
  };

  // Handle drag and drop
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer.files[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.csv') || fileName.endsWith('.json')) {
        setSelectedFile(file);
        setUploadStatus('');
        setUploadResult(null);
      } else {
        setUploadStatus('error');
        setUploadResult({
          success: false,
          message: 'Please select a CSV or JSON file'
        });
      }
    }
    
    // Remove drag style
    event.currentTarget.classList.remove('drag-over');
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');
  };

  // Upload file to server
  const uploadFile = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      // Simulate progress for demo
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      
      // Upload to our API endpoint
      const response = await axios.post(`${API_BASE_URL}/catches/bulk`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      // In a real app, you would use your API endpoint
      const response = await fetch(`${API_BASE_URL}/catches/bulk`, {
        method: 'POST',
        body: formData,
        // headers would normally include authentication tokens
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadStatus('success');
      setUploadResult(response.data);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadResult({
        success: false,
        message: error.response?.data?.detail || error.message || 'Upload failed. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('');
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bulk-upload-container">
      <div className="bulk-upload-header">
        <h2>Bulk Upload Catches</h2>
        <p>Upload multiple fishing records using a CSV or JSON template</p>
      </div>

      <div className="template-section">
        <h3>Download Template</h3>
        <div className="template-buttons">
          <button className="btn btn-primary" onClick={generateCsvTemplate}>
            <Download size={18} />
            CSV Template
          </button>
          <button className="btn btn-primary" onClick={generateJsonTemplate}>
            <Download size={18} />
            JSON Template
          </button>
        </div>
      </div>

      <div className="upload-section">
        <h3>Upload Your Data</h3>
        
        <div 
          className={`upload-area ${uploadStatus === 'uploading' ? 'uploading' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {selectedFile ? (
            <div className="file-selected">
              <FileText size={48} />
              <p>{selectedFile.name}</p>
              <button className="btn btn-text" onClick={resetUpload}>
                <X size={16} />
                Remove
              </button>
            </div>
          ) : (
            <>
              <Upload size={48} />
              <p>Drag & Drop your file here</p>
              <p>or</p>
              <button 
                className="btn btn-outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv,.json"
                style={{ display: 'none' }}
              />
            </>
          )}
        </div>

        {uploadStatus === 'uploading' && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p>Uploading... {uploadProgress}%</p>
          </div>
        )}

        {uploadResult && (
          <div className={`upload-result ${uploadResult.success ? 'success' : 'error'}`}>
            {uploadResult.success ? (
              <Check size={20} />
            ) : (
              <X size={20} />
            )}
            <span>{uploadResult.message}</span>
            {uploadResult.details && (
              <div className="result-details">
                <p>Success: {uploadResult.details.successCount}</p>
                <p>Errors: {uploadResult.details.errorCount}</p>
                {uploadResult.details.errors && (
                  <ul>
                    {uploadResult.details.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        <div className="upload-actions">
          <button 
            className="btn btn-primary" 
            onClick={uploadFile}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Data'}
          </button>
        </div>
      </div>

      <div className="instructions">
        <h3>Data Format Requirements</h3>
        <div className="instructions-content">
          <p>Your file should include the following fields:</p>
          
          <div className="field-table">
            <div className="field-row header">
              <div>Field Name</div>
              <div>Type</div>
              <div>Required</div>
              <div>Example</div>
            </div>
            
            <div className="field-row">
              <div>date</div>
              <div>YYYY-MM-DD</div>
              <div>Yes</div>
              <div>2023-07-15</div>
            </div>
            
            <div className="field-row">
              <div>time</div>
              <div>HH:MM</div>
              <div>Yes</div>
              <div>14:30</div>
            </div>
            
            <div className="field-row">
              <div>location</div>
              <div>Text</div>
              <div>Yes</div>
              <div>24°50'42"S 29°26'16"E</div>
            </div>
            
            <div className="field-row">
              <div>lake</div>
              <div>Text</div>
              <div>Yes</div>
              <div>Hartbeespoort</div>
            </div>
            
            <div className="field-row">
              <div>structure</div>
              <div>Text</div>
              <div>Yes</div>
              <div>Rocky Point</div>
            </div>
            
            <div className="field-row">
              <div>water_temp</div>
              <div>Number (°F)</div>
              <div>Yes</div>
              <div>75.5</div>
            </div>
            
            <div className="field-row">
              <div>water_quality</div>
              <div>Text</div>
              <div>Yes</div>
              <div>Clear</div>
            </div>
            
            <div className="field-row">
              <div>line_type</div>
              <div>Text</div>
              <div>Yes</div>
              <div>Braid</div>
            </div>
            
            <div className="field-row">
              <div>boat_depth</div>
              <div>Number (ft)</div>
              <div>Yes</div>
              <div>25.5</div>
            </div>
            
            <div className="field-row">
              <div>bait_depth</div>
              <div>Number (ft)</div>
              <div>Yes</div>
              <div>18.0</div>
            </div>
            
            <div className="field-row">
              <div>bait</div>
              <div>Text</div>
              <div>Yes</div>
              <div>Senko</div>
            </div>
            
            <div className="field-row">
              <div>bait_type</div>
              <div>Text</div>
              <div>Yes</div>
              <div>Soft Plastic</div>
            </div>
            
            <div className="field-row">
              <div>bait_colour</div>
              <div>Text</div>
              <div>Yes</div>
              <div>Green Pumpkin</div>
            </div>
            
            <div className="field-row">
              <div>scented</div>
              <div>Boolean</div>
              <div>Yes</div>
              <div>true</div>
            </div>
            
            <div className="field-row">
              <div>fish_weight</div>
              <div>Number (kg)</div>
              <div>Yes</div>
              <div>2.5</div>
            </div>
            
            <div className="field-row">
              <div>species</div>
              <div>Text</div>
              <div>Yes</div>
              <div>Largemouth Bass</div>
            </div>
            
            <div className="field-row">
              <div>line_weight</div>
              <div>Number (lb)</div>
              <div>No</div>
              <div>12.0</div>
            </div>
            
            <div className="field-row">
              <div>weight_pegged</div>
              <div>Boolean</div>
              <div>No</div>
              <div>true</div>
            </div>
            
            <div className="field-row">
              <div>hook_size</div>
              <div>Text</div>
              <div>No</div>
              <div>2/0</div>
            </div>
            
            <div className="field-row">
              <div>comments</div>
              <div>Text</div>
              <div>No</div>
              <div>Good catch!</div>
            </div>
          </div>
          
          <div className="notes">
            <h4>Important Notes:</h4>
            <ul>
              <li>For dropdown fields, use only the predefined values from your options</li>
              <li>Boolean values should be "true" or "false"</li>
              <li>Numeric values should not include units (e.g., just "22.5" not "22.5°C")</li>
              <li>Time should be in HH:MM:SS format (e.g., "14:30:00")</li>
              <li>The first row should contain headers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;