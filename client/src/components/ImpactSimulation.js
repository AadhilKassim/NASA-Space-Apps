import React, { useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon.png',
  iconUrl: '/marker-icon.png',
});

function ImpactSimulation({ asteroid }) {
  const [impactPoint, setImpactPoint] = useState([40.7128, -74.0060]); // NYC default
  const [showEffects, setShowEffects] = useState(false);

  if (!asteroid) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Impact Simulation</h2>
        <p>Select an asteroid from the sidebar to simulate impact effects</p>
      </div>
    );
  }

  const calculateBlastRadius = () => {
    const diameter = asteroid.estimated_diameter?.meters?.estimated_diameter_max || 100;
    return Math.sqrt(diameter) * 1000;
  };

  const calculateSeverity = () => {
    const diameter = asteroid.estimated_diameter?.meters?.estimated_diameter_max || 100;
    const energy = Math.pow(diameter/1000, 3) * 15; // Rough energy in MT
    const casualties = diameter > 1000 ? '1M+' : diameter > 100 ? '100K-1M' : '10K-100K';
    const economic = diameter > 1000 ? '$1T+' : diameter > 100 ? '$100B-1T' : '$10B-100B';
    return { energy: energy.toFixed(1), casualties, economic };
  };

  const blastRadius = calculateBlastRadius();

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="impact-overlay">
        <h3>Impact Analysis: {asteroid.name}</h3>
        <button 
          onClick={() => setShowEffects(!showEffects)}
          className="btn-danger"
          style={{ marginTop: '0.5rem' }}
        >
          {showEffects ? 'Hide Effects' : 'Simulate Impact'}
        </button>
        
        <div className="card" style={{ marginTop: '1rem', padding: '1rem' }}>
          <h4>Impact Severity Analysis</h4>
          <p><strong>Diameter:</strong> {asteroid.estimated_diameter?.meters?.estimated_diameter_max?.toFixed(0) || 100}m</p>
          <p><strong>Impact Probability:</strong> {asteroid.impact_probability || 'N/A'}</p>
          <p><strong>Torino Scale:</strong> {asteroid.torino_scale || 0}</p>
          <p><strong>Blast Radius:</strong> {(blastRadius/1000).toFixed(1)} km</p>
          <p><strong>Energy:</strong> {calculateSeverity().energy} MT</p>
          <p><strong>Casualties:</strong> {calculateSeverity().casualties}</p>
          <p><strong>Economic Impact:</strong> {calculateSeverity().economic}</p>
        </div>
        
        {showEffects && (
          <div style={{ marginTop: '0.5rem' }}>
            <p style={{ color: '#4caf50', fontSize: '0.9rem' }}>✓ Impact effects displayed on map</p>
          </div>
        )}
      </div>

      <MapContainer
        center={impactPoint}
        zoom={8}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        <Marker position={impactPoint}>
          <Popup>Impact Point</Popup>
        </Marker>
        
        {showEffects && (
          <>
            <Circle
              center={impactPoint}
              radius={blastRadius}
              pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.3 }}
            >
              <Popup>Blast Zone</Popup>
            </Circle>
            <Circle
              center={impactPoint}
              radius={blastRadius * 2}
              pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.2 }}
            >
              <Popup>Thermal Radiation Zone</Popup>
            </Circle>
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default ImpactSimulation;