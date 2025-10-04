import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Sidebar({ activeModule, setActiveModule, selectedAsteroid }) {
  const [asteroids, setAsteroids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAsteroids();
  }, []);

  const fetchAsteroids = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/asteroids');
      setAsteroids(response.data.near_earth_objects || []);
    } catch (error) {
      console.error('Error fetching asteroids:', error);
    } finally {
      setLoading(false);
    }
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
        </div>
      )}
    </div>
  );
}

export default Sidebar;