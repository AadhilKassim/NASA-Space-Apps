import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Sidebar({ activeModule, setActiveModule, selectedAsteroid, setSelectedAsteroid }) {
  const [asteroids, setAsteroids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrichedCache, setEnrichedCache] = useState({});

  useEffect(() => {
    fetchAsteroids();
  }, []);

  const fetchAsteroids = () => {
    // Use CNEOS Sentry data with SPK IDs for SBDB enrichment
    setAsteroids([
      { id: '29075', spkid: '2029075', name: '29075 (1950 DA)', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 1300 } }, impact_probability: '3.8e-4', torino_scale: 0 },
      { id: '101955', spkid: '2101955', name: '101955 Bennu (1999 RQ36)', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 490 } }, impact_probability: '5.7e-4', torino_scale: 0 },
      { id: '2008JL3', spkid: null, name: '2008 JL3', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 29 } }, impact_probability: '1.7e-4', torino_scale: 0 },
      { id: '2000SG344', spkid: null, name: '2000 SG344', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 37 } }, impact_probability: '2.7e-3', torino_scale: 0 },
      { id: 'impactor2025', spkid: null, name: 'Impactor-2025', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 150 } }, impact_probability: '3.7e-4', torino_scale: 1 }
    ]);
    setLoading(false);
  };

  const handleAsteroidClick = async (asteroid) => {
    // Check if we already have enriched data cached
    if (enrichedCache[asteroid.id]) {
      setSelectedAsteroid({ ...asteroid, ...enrichedCache[asteroid.id] });
      return;
    }

    // Set the asteroid immediately for instant UI feedback
    setSelectedAsteroid(asteroid);

    // Fetch enriched data from SBDB
    try {
      const query = asteroid.spkid 
        ? `spk=${asteroid.spkid}` 
        : `sstr=${encodeURIComponent(asteroid.name)}`;
      
      const response = await fetch(`/api/asteroids/${asteroid.id}/full?${query}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Cache the enriched data
        setEnrichedCache(prev => ({
          ...prev,
          [asteroid.id]: {
            merged: data.merged,
            sbdb: data.sbdb,
            absolute_magnitude_h: data.merged?.absolute_magnitude_h
          }
        }));

        // Update selected asteroid with enriched data
        setSelectedAsteroid({
          ...asteroid,
          merged: data.merged,
          sbdb: data.sbdb,
          absolute_magnitude_h: data.merged?.absolute_magnitude_h
        });
      }
    } catch (error) {
      console.error('Failed to fetch enriched asteroid data:', error);
      // Keep the basic asteroid data on error
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
                onClick={() => handleAsteroidClick(asteroid)}
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
          
          {selectedAsteroid.merged?.orbit && (
            <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'rgba(0,255,0,0.1)', borderRadius: '4px' }}>
              <p style={{ fontSize: '0.85rem', margin: 0 }}><strong>📡 SBDB Data Loaded</strong></p>
              {selectedAsteroid.absolute_magnitude_h && (
                <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>H: {selectedAsteroid.absolute_magnitude_h.toFixed(2)}</p>
              )}
              {selectedAsteroid.merged.orbit.semi_major_axis_au && (
                <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
                  a: {selectedAsteroid.merged.orbit.semi_major_axis_au.toFixed(3)} AU
                </p>
              )}
              {selectedAsteroid.merged.orbit.eccentricity !== undefined && (
                <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
                  e: {selectedAsteroid.merged.orbit.eccentricity.toFixed(4)}
                </p>
              )}
              {selectedAsteroid.merged.orbit.period_days && (
                <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
                  Period: {selectedAsteroid.merged.orbit.period_days.toFixed(1)} days
                </p>
              )}
            </div>
          )}
          
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