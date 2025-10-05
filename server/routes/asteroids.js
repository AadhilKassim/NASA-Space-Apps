// server/routes/asteroids.js
const express = require('express');
const router = express.Router();
const { 
    fetchNeoWsFeed,
    fetchNeoWsBrowse,
    fetchNeoWsLookup,
    formatAsteroidData
} = require('../services/nasa');

// Simple in-memory cache with separate storage for different endpoints
const cache = {
    feed: { data: null, timestamp: 0 },
    browse: { data: null, timestamp: 0 }
};

// Cache duration in milliseconds (15 minutes)
const CACHE_DURATION = 15 * 60 * 1000;

router.get('/', async (req, res) => {
    try {
        const now = Date.now();
        const { view = 'feed', page = 0 } = req.query;
        
        if (view === 'browse') {
            // Use cached browse data if available and fresh
            if (cache.browse.data && (now - cache.browse.timestamp < CACHE_DURATION)) {
                return res.json(cache.browse.data);
            }

            const data = await fetchNeoWsBrowse(parseInt(page));
            const formattedData = {
                ...data,
                near_earth_objects: data.near_earth_objects.map(formatAsteroidData)
            };

            cache.browse = {
                data: formattedData,
                timestamp: now
            };

            return res.json(formattedData);
        } else {
            // Use cached feed data if available and fresh
            if (cache.feed.data && (now - cache.feed.timestamp < CACHE_DURATION)) {
                return res.json(cache.feed.data);
            }

            // Fetch a 7-day window for feed view
            const today = new Date();
            const start = new Date(today.getTime() - (3 * 24 * 3600 * 1000));
            const end = new Date(today.getTime() + (3 * 24 * 3600 * 1000));
            const fmt = d => d.toISOString().slice(0,10);
            
            const data = await fetchNeoWsFeed(fmt(start), fmt(end));
            
            // Format all asteroids in the feed
            const formattedData = {
                ...data,
                near_earth_objects: Object.entries(data.near_earth_objects).reduce((acc, [date, asteroids]) => {
                    acc[date] = asteroids.map(formatAsteroidData);
                    return acc;
                }, {})
            };

            cache.feed = {
                data: formattedData,
                timestamp: now
            };

            return res.json(formattedData);
        }
    } catch (err) {
        console.error('Error fetching asteroids:', err);
        res.status(500).json({ 
            error: 'Failed to fetch asteroids',
            message: err.message,
            code: err.code || 'UNKNOWN_ERROR'
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = await fetchNeoWsLookup(id);
        const formattedData = formatAsteroidData(data);
        res.json(formattedData);
    } catch (err) {
        console.error('Error fetching asteroid details:', err);
        res.status(500).json({
            error: 'Failed to fetch asteroid details',
            message: err.message,
            code: err.code || 'UNKNOWN_ERROR'
        });
    }
});

module.exports = router;
