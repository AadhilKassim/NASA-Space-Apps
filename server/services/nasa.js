// server/services/nasa.js
const axios = require('axios');

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const NEOWS_BASE = 'https://api.nasa.gov/neo/rest/v1';

/**
 * Fetch asteroids based on their closest approach date to Earth
 * @param {string} start_date - Start date in YYYY-MM-DD format
 * @param {string} end_date - End date in YYYY-MM-DD format
 * @returns {Promise<Object>} Asteroid feed data
 */
async function fetchNeoWsFeed(start_date, end_date, retries = 3) {
    const url = `${NEOWS_BASE}/feed`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const resp = await axios.get(url, { 
                params: {
                    start_date,
                    end_date,
                    api_key: NASA_API_KEY
                },
                timeout: 15000,
                headers: {
                    'User-Agent': 'AIM-Asteroid-Visualizer/1.0'
                }
            });
            return resp.data;
        } catch (error) {
            if (attempt === retries) throw error;
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
            console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Browse the overall Asteroid dataset
 * @param {number} page - Page number (0-based)
 * @returns {Promise<Object>} Paginated asteroid data
 */
async function fetchNeoWsBrowse(page = 0, retries = 3) {
    const url = `${NEOWS_BASE}/neo/browse`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const resp = await axios.get(url, {
                params: {
                    page,
                    size: 20,
                    api_key: NASA_API_KEY
                },
                timeout: 15000,
                headers: {
                    'User-Agent': 'AIM-Asteroid-Visualizer/1.0'
                }
            });
            return resp.data;
        } catch (error) {
            if (attempt === retries) throw error;
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
            console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Lookup specific asteroid by NASA JPL small body ID
 * @param {string} asteroidId - Asteroid SPK-ID
 * @returns {Promise<Object>} Detailed asteroid data
 */
async function fetchNeoWsLookup(asteroidId, retries = 3) {
    const url = `${NEOWS_BASE}/neo/${asteroidId}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const resp = await axios.get(url, {
                params: {
                    api_key: NASA_API_KEY
                },
                timeout: 15000,
                headers: {
                    'User-Agent': 'AIM-Asteroid-Visualizer/1.0'
                }
            });
            return resp.data;
        } catch (error) {
            if (attempt === retries) throw error;
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
            console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Transform raw asteroid data into a standardized format
 * @param {Object} rawAsteroid - Raw asteroid data from NASA API
 * @returns {Object} Formatted asteroid data
 */
function formatAsteroidData(rawAsteroid) {
    return {
        id: rawAsteroid.id,
        name: rawAsteroid.name,
        nasa_jpl_url: rawAsteroid.nasa_jpl_url,
        absolute_magnitude_h: rawAsteroid.absolute_magnitude_h,
        is_potentially_hazardous_asteroid: rawAsteroid.is_potentially_hazardous_asteroid,
        is_sentry_object: rawAsteroid.is_sentry_object,
        estimated_diameter: rawAsteroid.estimated_diameter,
        close_approach_data: rawAsteroid.close_approach_data?.map(approach => ({
            date: approach.close_approach_date,
            date_full: approach.close_approach_date_full,
            epoch_date: approach.epoch_date_close_approach,
            relative_velocity: approach.relative_velocity,
            miss_distance: approach.miss_distance,
            orbiting_body: approach.orbiting_body
        })),
        orbital_data: rawAsteroid.orbital_data ? {
            orbit_id: rawAsteroid.orbital_data.orbit_id,
            determination_date: rawAsteroid.orbital_data.orbit_determination_date,
            first_observation: rawAsteroid.orbital_data.first_observation_date,
            last_observation: rawAsteroid.orbital_data.last_observation_date,
            data_arc_days: rawAsteroid.orbital_data.data_arc_in_days,
            observations: rawAsteroid.orbital_data.observations_used,
            orbit_uncertainty: rawAsteroid.orbital_data.orbit_uncertainty,
            min_orbit_intersection: rawAsteroid.orbital_data.minimum_orbit_intersection,
            jupiter_tisserand: rawAsteroid.orbital_data.jupiter_tisserand_invariant,
            epoch_osculation: rawAsteroid.orbital_data.epoch_osculation,
            eccentricity: rawAsteroid.orbital_data.eccentricity,
            semi_major_axis: rawAsteroid.orbital_data.semi_major_axis,
            inclination: rawAsteroid.orbital_data.inclination,
            ascending_node_longitude: rawAsteroid.orbital_data.ascending_node_longitude,
            orbital_period: rawAsteroid.orbital_data.orbital_period,
            perihelion_distance: rawAsteroid.orbital_data.perihelion_distance,
            perihelion_argument: rawAsteroid.orbital_data.perihelion_argument,
            aphelion_distance: rawAsteroid.orbital_data.aphelion_distance,
            perihelion_time: rawAsteroid.orbital_data.perihelion_time,
            mean_anomaly: rawAsteroid.orbital_data.mean_anomaly,
            mean_motion: rawAsteroid.orbital_data.mean_motion,
            orbit_class: rawAsteroid.orbital_data.orbit_class
        } : null
    };
}

module.exports = {
    fetchNeoWsFeed,
    fetchNeoWsBrowse,
    fetchNeoWsLookup,
    formatAsteroidData
};
