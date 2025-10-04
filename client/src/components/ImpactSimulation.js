import React, { useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup, Marker } from 'react-leaflet';

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
    // Simplified calculation based on asteroid size
    const diameter = 100; // Default size in meters
    return Math.sqrt(diameter) * 1000; // Blast radius in meters
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
        
        {showEffects && (
          <div className="card" style={{ marginTop: '1rem', padding: '1rem' }}>
            <p><strong>Blast Radius:</strong> {(blastRadius/1000).toFixed(1)} km</p>
            <p><strong>Estimated Casualties:</strong> 50,000 - 500,000</p>
            <p><strong>Economic Impact:</strong> $10-100 billion</p>
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