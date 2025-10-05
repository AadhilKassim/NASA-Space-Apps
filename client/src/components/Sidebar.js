import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Sidebar({ activeModule, setActiveModule, selectedAsteroid, setSelectedAsteroid }) {
  const [asteroids, setAsteroids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAsteroids();
  }, []);

  const fetchAsteroids = () => {
    // Use CNEOS Sentry data
    setAsteroids([
      { id: '29075', name: '29075 (1950 DA)', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 1300 } }, impact_probability: '3.8e-4', torino_scale: 0 },
      { id: '101955', name: '101955 Bennu (1999 RQ36)', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 490 } }, impact_probability: '5.7e-4', torino_scale: 0 },
      { id: '2008JL3', name: '2008 JL3', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 29 } }, impact_probability: '1.7e-4', torino_scale: 0 },
      { id: '2000SG344', name: '2000 SG344', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 37 } }, impact_probability: '2.7e-3', torino_scale: 0 },
      { id: 'impactor2025', name: 'Impactor-2025', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 150 } }, impact_probability: '3.7e-4', torino_scale: 1 }
    ]);
    setLoading(false);
  };

  const modules = [
    { id: 'orbital', name: '3D Orbital View', icon: '🌌' },
    { id: 'impact', name: 'Impact Simulation', icon: '💥' },
    { id: 'mitigation', name: 'Mitigation Planning', icon: '🚀' }
  ];

  return (
    <div className="sidebar">
      <div className="module-selector">
        <h3>Modules</h3>
        {modules.map(module => (
          <button
            key={module.id}
            className={`module-btn ${activeModule === module.id ? 'active' : ''}`}
            onClick={() => setActiveModule(module.id)}
          >
            <span>{module.icon}</span>
            {module.name}
          </button>
        ))}
      </div>

      <div className="asteroid-list">
        <h3>Near-Earth Asteroids</h3>
        {loading ? (
          <p>Loading asteroids...</p>
        ) : (
          <div className="asteroid-items">
            {asteroids.slice(0, 10).map(asteroid => (
              <div
                key={asteroid.id}
                className={`asteroid-item ${selectedAsteroid?.id === asteroid.id ? 'selected' : ''}`}
                onClick={() => setSelectedAsteroid(asteroid)}
              >
                <strong>{asteroid.name}</strong>
                <small>Diameter: {asteroid.estimated_diameter?.meters?.estimated_diameter_max?.toFixed(0)}m</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAsteroid && (
        <div className="asteroid-details">
          <h3>Selected Asteroid</h3>
          <p><strong>Name:</strong> {selectedAsteroid.name}</p>
          <p><strong>Hazardous:</strong> {selectedAsteroid.is_potentially_hazardous_asteroid ? 'Yes' : 'No'}</p>
          <p><strong>Impact Probability:</strong> {selectedAsteroid.impact_probability || 'N/A'}</p>
          <p><strong>Torino Scale:</strong> {selectedAsteroid.torino_scale || 0}</p>
          <button 
            className="btn-danger" 
            style={{ marginTop: '1rem', width: '100%' }}
            onClick={() => setActiveModule('impact')}
          >
            💥 Analyze Impact
          </button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;