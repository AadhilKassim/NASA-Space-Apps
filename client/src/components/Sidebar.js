import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Sidebar({ activeModule, setActiveModule, selectedAsteroid, setSelectedAsteroid }) {
  const [asteroids, setAsteroids] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchAsteroids = async () => {
      try {
        const NASA_API_KEY = process.env.REACT_APP_NASA_API_KEY || 'DEMO_KEY';
        const today = new Date();
        const start = today.toISOString().slice(0,10);
        const end = start;
        const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${start}&end_date=${end}&api_key=${NASA_API_KEY}`;
        const response = await axios.get(url);
        const feed = response.data.near_earth_objects || {};
        let arr = [];
        for (const k of Object.keys(feed)) {
          arr = arr.concat(feed[k]);
        }
        setAsteroids(arr);
      } catch (error) {
        console.error('Error fetching asteroids from NASA NeoWs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAsteroids();
  }, []);

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