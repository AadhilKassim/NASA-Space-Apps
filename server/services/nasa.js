// server/services/nasa.js
const axios = require('axios');

const NASA_API_KEY = process.env.NASA_API_KEY;
const NEOWS_BASE = 'https://api.nasa.gov/neo/rest/v1';
const SENTRY_BASE = 'https://ssd-api.jpl.nasa.gov/sentry.api'; // NOTE: Sentry endpoints vary; this is an example

async function fetchNeoWsBrowse(start_date, end_date) {
  const url = `${NEOWS_BASE}/feed?start_date=${start_date}&end_date=${end_date}&api_key=${NASA_API_KEY}`;
  const resp = await axios.get(url, { timeout: 15000 });
  return resp.data;
}

async function fetchNeoWsById(id) {
  const url = `${NEOWS_BASE}/neo/${id}?api_key=${NASA_API_KEY}`;
  const resp = await axios.get(url);
  return resp.data;
}

async function fetchSentry(id) {
  // JPL Sentry API has different forms; this endpoint is illustrative
  const url = `${SENTRY_BASE}?des=${encodeURIComponent(id)}&fullname=true`;
  const resp = await axios.get(url);
  return resp.data;
}

module.exports = { fetchNeoWsBrowse, fetchNeoWsById, fetchSentry };
