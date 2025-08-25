import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FishingProvider } from './contexts/FishingContext';
import Header from './components/Header';
import Home from './pages/Home';
import LogCatch from './pages/LogCatch';
import BulkUpload from './pages/BulkUpload'; // Import the BulkUpload component
import ViewCatches from './pages/ViewCatches';
import Analytics from './pages/Analytics';
import HeatMapPage from './pages/HeatMapPage';
import ManageOptions from './pages/ManageOptions';
import EnhancedAnalytics from './pages/EnhancedAnalytics';
import './App.css';

function App() {
  return (
    <FishingProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/log-catch" element={<LogCatch />} />
              <Route path="/bulk-upload" element={<BulkUpload />} /> {/* Add this route */}
              <Route path="/view-catches" element={<ViewCatches />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/heatmap" element={<HeatMapPage />} />
              <Route path="/manage-options" element={<ManageOptions />} />
              <Route path="/enhanced-analytics" element={<EnhancedAnalytics />} />
            </Routes>
          </main>
        </div>
      </Router>
    </FishingProvider>
  );
}

export default App;