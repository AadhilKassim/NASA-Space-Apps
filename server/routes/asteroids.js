// server/routes/asteroids.js
const express = require('express');
const router = express.Router();
const { fetchNeoWsBrowse } = require('../services/nasa');

// Simple cache: store last fetch (TTL handled manually)
const CACHE_KEY = 'neows_feed';

router.get('/', async (req, res) => {
  try {
    const db = req.db;
    const cache = await db.collection('cache').findOne({ key: CACHE_KEY });
    const now = Date.now();

    // If cached and fresh (TTL 15m)
    if (cache && (now - cache.ts < 1000 * 60 * 15)) {
      return res.json(cache.data);
    }

    // Otherwise fetch a 7-day window
    const today = new Date();
    const start = new Date(today.getTime() - (3 * 24 * 3600 * 1000));
    const end = new Date(today.getTime() + (3 * 24 * 3600 * 1000));
    const fmt = d => d.toISOString().slice(0,10);
    const data = await fetchNeoWsBrowse(fmt(start), fmt(end));

    // cache
    await db.collection('cache').updateOne(
      { key: CACHE_KEY },
      { $set: { key: CACHE_KEY, data, ts: now }},
      { upsert: true }
    );

    res.json(data);
  } catch (err) {
    console.error('Error fetching asteroids', err.message);
    res.status(500).json({ error: 'Failed to fetch asteroids' });
  }
});

module.exports = router;
