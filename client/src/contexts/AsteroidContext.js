import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AsteroidContext = createContext();

export function AsteroidProvider({ children }) {
  const [asteroids, setAsteroids] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.REACT_APP_API_BASE || '/api';

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await axios.get(`${API_BASE}/asteroids`);
        // NeoWs feed has nested structure feed -> date -> array. Flatten top 50
        const feed = res.data.near_earth_objects || res.data;
        let arr = [];
        if (Array.isArray(feed)) arr = feed;
        else {
          for (const k of Object.keys(feed || {})) {
            arr = arr.concat(feed[k]);
          }
        }
        if (mounted) {
          setAsteroids(arr.slice(0, 100));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AsteroidContext.Provider value={{ asteroids, loading }}>
      {children}
    </AsteroidContext.Provider>
  );
}
