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
    async function load() {
      try {
        const res = await axios.get(`${API_BASE}/asteroids`);
        // Always flatten near_earth_objects (object of arrays) into a single array
        let arr = [];
        const feed = res.data.near_earth_objects;
        if (feed && typeof feed === 'object') {
          // feed is an object keyed by date, each value is an array
          Object.values(feed).forEach(dayArr => {
            if (Array.isArray(dayArr)) arr = arr.concat(dayArr);
          });
        } else if (Array.isArray(feed)) {
          arr = feed;
        }
        if (mounted) {
          setAsteroids(arr.slice(0, 100));
        }
      } catch (e) {
        console.error(e);
        if (mounted) {
          setError(e.message);
          setAsteroids([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AsteroidContext.Provider value={{ asteroids, loading, error }}>
      {children}
    </AsteroidContext.Provider>
  );
}
