// server/routes/asteroids.js
const express = require('express');
const router = express.Router();
const {
    fetchNeoWsFeed,
    fetchNeoWsBrowse,
    fetchNeoWsLookup,
    formatAsteroidData
} = require('../services/nasa');
const { fetchSbdb, normalizeSbdbPayload } = require('../services/sbdb');

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

// Enriched asteroid route combining NeoWs + SBDB data (when available)
// Usage: GET /asteroids/:id/full?sstr=Eros OR /asteroids/:id/full?spk=2000433 OR /asteroids/:id/full?des=433
// If SBDB query params are omitted, attempts SPK id and then name fallback.
// Accept both with and without trailing slash because the Next.js `trailingSlash` option
// rewrites `/full` -> `/full/` before appending query parameters, causing 404 otherwise.
const enrichedHandler = async (req, res) => {
    const { id } = req.params;
    const { sstr, spk, des } = req.query;
    try {
        // Prefer SBDB if explicit query provided (spk/sstr/des)
        let sbdb = null;
        let neo = null;

        // SBDB first when client provided explicit identifier
        let sbdbQuery = null;
        if (sstr || spk || des) {
            sbdbQuery = { sstr, spk, des };
        }

        // Attempt SBDB fetch if we have a query already
        if (sbdbQuery) {
            try {
                const sbdbRaw = await fetchSbdb(sbdbQuery);
                if (sbdbRaw && sbdbRaw.list && Array.isArray(sbdbRaw.list)) {
                    sbdb = { match_list: sbdbRaw.list, message: sbdbRaw.message || 'multiple matches' };
                } else {
                    sbdb = normalizeSbdbPayload(sbdbRaw);
                }
            } catch (e) {
                sbdb = { error: true, message: e.message };
            }
        }

        // Try NeoWs lookup, but don't fail the request if it 404s
        try {
            const neoRaw = await fetchNeoWsLookup(id);
            if (neoRaw) neo = formatAsteroidData(neoRaw);
        } catch (e) {
            // NeoWs lookup failed (likely 404 if id isn't a NeoWs internal id). Continue with SBDB-only.
            neo = null;
        }

        // If we still don't have an SBDB query and we got a NeoWs payload, derive SBDB query
        if (!sbdbQuery && neo) {
            if (/^\d+$/.test(neo.id)) {
                sbdbQuery = { spk: neo.id };
            } else if (neo.name) {
                const cleaned = neo.name.replace(/[()]/g, '').trim();
                sbdbQuery = { sstr: cleaned };
            }
            if (sbdbQuery) {
                try {
                    const sbdbRaw = await fetchSbdb(sbdbQuery);
                    if (sbdbRaw && sbdbRaw.list && Array.isArray(sbdbRaw.list)) {
                        sbdb = { match_list: sbdbRaw.list, message: sbdbRaw.message || 'multiple matches' };
                    } else {
                        sbdb = normalizeSbdbPayload(sbdbRaw);
                    }
                } catch (e) {
                    sbdb = { error: true, message: e.message };
                }
            }
        }

        // If neither source is available, return 404
        if (!neo && (!sbdb || sbdb.error)) {
            return res.status(404).json({ error: 'Asteroid not found in NeoWs or SBDB' });
        }

        return res.json({
            id: neo?.id || sbdb?.id || id,
            name: neo?.name || sbdb?.name || 'Unknown',
            neo,
            sbdb,
            merged: mergeAsteroidSources(neo, sbdb)
        });
    } catch (err) {
        console.error('Error fetching enriched asteroid:', err);
        res.status(500).json({
            error: 'Failed to fetch enriched asteroid',
            message: err.message,
            code: err.code || 'UNKNOWN_ERROR'
        });
    }
};

router.get('/:id/full', enrichedHandler);
router.get('/:id/full/', enrichedHandler);

// Merge helper: prefer SBDB precise orbit when available; fallback to NeoWs orbital_data
function mergeAsteroidSources(neo, sbdb) {
    if (!neo && !sbdb) return null;
    const merged = {
        id: neo?.id || sbdb?.id || null,
        name: neo?.name || sbdb?.name || 'Unknown',
        is_potentially_hazardous_asteroid: neo?.is_potentially_hazardous_asteroid ?? sbdb?.is_potentially_hazardous_asteroid ?? false,
        absolute_magnitude_h: neo?.absolute_magnitude_h ?? sbdb?.absolute_magnitude_h ?? null,
        estimated_diameter: neo?.estimated_diameter || sbdb?.estimated_diameter || null,
        orbit: undefined,
        sources: {
            neo: !!neo,
            sbdb: !!(sbdb && !sbdb.error && !sbdb.match_list)
        }
    };
    // Orbit selection
    if (sbdb && sbdb.orbit && !sbdb.error && !sbdb.match_list) {
        merged.orbit = {
            semi_major_axis_au: sbdb.orbit.a_au,
            eccentricity: sbdb.orbit.e,
            period_days: sbdb.orbit.period_days,
            longitude_perihelion_deg: sbdb.orbit.longitudePerihelionDeg,
            argument_perihelion_deg: sbdb.orbit.w_deg,
            ascending_node_deg: sbdb.orbit.om_deg,
            source: 'sbdb'
        };
    } else if (neo?.orbital_data) {
        merged.orbit = {
            semi_major_axis_au: neo.orbital_data.semi_major_axis ? parseFloat(neo.orbital_data.semi_major_axis) : null,
            eccentricity: neo.orbital_data.eccentricity ? parseFloat(neo.orbital_data.eccentricity) : null,
            period_days: neo.orbital_data.orbital_period ? parseFloat(neo.orbital_data.orbital_period) : null,
            perihelion_distance_au: neo.orbital_data.perihelion_distance ? parseFloat(neo.orbital_data.perihelion_distance) : null,
            aphelion_distance_au: neo.orbital_data.aphelion_distance ? parseFloat(neo.orbital_data.aphelion_distance) : null,
            source: 'neows'
        };
    }
    return merged;
}

module.exports = router;
