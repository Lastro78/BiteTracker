import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom cluster icon function
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size = 32;
  let backgroundColor = '#3b82f6'; // Blue
  
  if (count > 10) {
    size = 38;
    backgroundColor = '#ef4444'; // Red for large clusters
  } else if (count > 5) {
    size = 35;
    backgroundColor = '#f59e0b'; // Orange for medium clusters
  }

  return L.divIcon({
    html: `<div style="background-color: ${backgroundColor}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">${count}</div>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(size, size),
  });
};

const HeatMap = ({ catches }) => {
  const parseCoordinates = (location) => {
    if (!location) return null;
    
    const match = location.match(/(-?\d+)°(\d+)'(\d+\.?\d*)"([NS])\s*(-?\d+)°(\d+)'(\d+\.?\d*)"([EW])/);
    if (!match) return null;

    const [, latDeg, latMin, latSec, latDir, lonDeg, lonMin, lonSec, lonDir] = match;

    const lat = parseFloat(latDeg) + parseFloat(latMin)/60 + parseFloat(latSec)/3600;
    const lon = parseFloat(lonDeg) + parseFloat(lonMin)/60 + parseFloat(lonSec)/3600;

    return [
      latDir === 'S' ? -lat : lat,
      lonDir === 'W' ? -lon : lon
    ];
  };

  const getHeatmapData = () => {
    return catches
      .map(catchItem => {
        const coords = parseCoordinates(catchItem.location);
        if (!coords) return null;
        
        const intensity = catchItem.fish_weight || 1;
        return [coords[0], coords[1], intensity];
      })
      .filter(Boolean);
  };

  const HeatmapLayer = () => {
    const map = useMap();
    
    useEffect(() => {
      const heatData = getHeatmapData();
      
      if (heatData.length > 0) {
        L.heatLayer(heatData, {
          radius: 30,
          blur: 20,
          maxZoom: 17,
          gradient: {0.3: '#3b82f6', 0.6: '#f59e0b', 1: '#ef4444'},
          minOpacity: 0.6
        }).addTo(map);
      }

      return () => {
        map.eachLayer(layer => {
          if (layer instanceof L.HeatLayer) {
            map.removeLayer(layer);
          }
        });
      };
    }, [map]);

    return null;
  };

  // Custom marker icons based on fish weight
  const getMarkerIcon = (weight) => {
    const size = weight > 2 ? 24 : weight > 1 ? 20 : 16;
    const color = weight > 2 ? '#ef4444' : weight > 1 ? '#f59e0b' : '#10b981'; // Red, Orange, Green
    
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color}; 
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 50%; 
          border: 2px solid white; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: white; 
          font-weight: bold; 
          font-size: ${size > 20 ? '9px' : '7px'};
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        ">
          ${weight.toFixed(1)}
        </div>
      `,
      className: 'custom-fish-marker',
      iconSize: [size, size],
    });
  };

  const center = [-25.0, 28.0];
  const zoom = 6;

  // Filter catches with valid coordinates
  const validCatches = catches.filter(catchItem => {
    const coords = parseCoordinates(catchItem.location);
    return coords !== null;
  });

  return (
    <div className="heatmap-container">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '500px', width: '100%' }}
        zoomControl={true}
      >
        {/* ESRI Satellite Imagery */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        />
        
        <HeatmapLayer />
        
        {/* Marker Clustering */}
        <MarkerClusterGroup
          chunkedLoading
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={true}
          zoomToBoundsOnClick={true}
          maxClusterRadius={50}
          iconCreateFunction={createClusterCustomIcon}
          spiderLegPolylineOptions={{ weight: 1.5, color: '#3b82f6', opacity: 0.5 }}
        >
          {validCatches.map((catchItem, index) => {
            const coords = parseCoordinates(catchItem.location);

            return (
              <Marker 
                key={index} 
                position={coords}
                icon={getMarkerIcon(catchItem.fish_weight)}
              >
                <Popup className="catch-popup">
                  <div className="popup-content">
                    <h4>{catchItem.fish_weight}kg Catch</h4>
                    <div className="popup-details">
                      <p><strong>Bait:</strong> {catchItem.bait} ({catchItem.bait_type})</p>
                      <p><strong>Date:</strong> {catchItem.date} {catchItem.time}</p>
                      <p><strong>Lake:</strong> {catchItem.lake || 'Unknown'}</p>
                      <p><strong>Structure:</strong> {catchItem.structure || 'Unknown'}</p>
                      <p><strong>Depth:</strong> Boat: {catchItem.boat_depth}ft, Bait: {catchItem.bait_depth}ft</p>
                      {catchItem.comments && (
                        <p><strong>Notes:</strong> "{catchItem.comments}"</p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Cluster Legend */}
      <div className="cluster-legend">
        <h4>Cluster Legend</h4>
        <div className="legend-item">
          <div className="cluster-demo" style={{backgroundColor: '#3b82f6', width: '32px', height: '32px'}}></div>
          <span>Small (1-5)</span>
        </div>
        <div className="legend-item">
          <div className="cluster-demo" style={{backgroundColor: '#f59e0b', width: '35px', height: '35px'}}></div>
          <span>Medium (6-10)</span>
        </div>
        <div className="legend-item">
          <div className="cluster-demo" style={{backgroundColor: '#ef4444', width: '38px', height: '38px'}}></div>
          <span>Large (10+)</span>
        </div>
      </div>
    </div>
  );
};

export default HeatMap;