import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const defaultContextValue = {
  asteroids: [],
  loading: true,
  error: null
};

export const AsteroidContext = createContext(defaultContextValue);

export function AsteroidProvider({ children }) {
  const [asteroids, setAsteroids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE = process.env.REACT_APP_API_BASE || '/api';

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    async function load() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await axios.get(`${API_BASE}/asteroids`, {
          timeout: 10000, // 10 second timeout
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        // NeoWs feed has nested structure feed -> date -> array. Flatten top 50
        const feed = res.data.near_earth_objects || res.data;
        let arr = [];
        
        if (Array.isArray(feed)) {
          arr = feed;
        } else if (typeof feed === 'object') {
          arr = Object.values(feed).flat();
        }

        // Sort by potential hazard and size
        arr.sort((a, b) => {
          if (a.is_potentially_hazardous_asteroid !== b.is_potentially_hazardous_asteroid) {
            return b.is_potentially_hazardous_asteroid ? 1 : -1;
          }
          return (b.estimated_diameter?.meters?.estimated_diameter_max || 0) - 
                 (a.estimated_diameter?.meters?.estimated_diameter_max || 0);
        });

        if (mounted) {
          setAsteroids(arr.slice(0, 100));
          setError(null);
        }
      } catch (e) {
        console.error('Error fetching asteroids:', e);
        if (mounted) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying... Attempt ${retryCount} of ${maxRetries}`);
            setTimeout(load, 2000 * retryCount); // Exponential backoff
          } else {
            setError(e.message);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    
    // Refresh data every 5 minutes
    const interval = setInterval(load, 5 * 60 * 1000);
    
    return () => { 
      mounted = false;
      clearInterval(interval);
    };
  }, [API_BASE]);

  return (
    <AsteroidContext.Provider value={{ asteroids, loading, error }}>
      {children}
    </AsteroidContext.Provider>
  );
}