// server/services/sbdb.js
const axios = require('axios');

const SBDB_BASE = 'https://ssd-api.jpl.nasa.gov/sbdb.api';

function toNumber(v) {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

function elementsArrayToMap(elements = []) {
  const map = {};
  for (const el of elements) {
    if (el && el.name) map[el.name] = el;
  }
  return map;
}

function findPhysValue(physArr = [], names = []) {
  const lower = new Set(names.map(n => n.toLowerCase()));
  for (const item of physArr) {
    if (!item || !item.name) continue;
    if (lower.has(String(item.name).toLowerCase())) {
      const val = toNumber(item.value);
      const units = item.units || null;
      return { value: val, units };
    }
  }
  return { value: null, units: null };
}

/**
 * Fetch SBDB record by sstr/spk/des with optional flags
 * @param {Object} query - { sstr?, spk?, des? }
 */
// Simple in-memory cache for SBDB responses
const _cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

async function fetchSbdb(query, retries = 3) {
  if (!query || (!query.sstr && !query.spk && !query.des)) {
    throw new Error('One of sstr, spk, or des is required');
  }

  const params = {
    // request physical params and calendar-date epoch for readability
    'phys-par': 1,
    'cd-epoch': 1,
    ...query,
  };

  const key = JSON.stringify(params);
  const now = Date.now();
  const cached = _cache.get(key);
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await axios.get(SBDB_BASE, {
        params,
        timeout: 15000,
        headers: { 'User-Agent': 'AIM-Asteroid-Visualizer/1.0' }
      });
      _cache.set(key, { data: resp.data, timestamp: now });
      return resp.data;
    } catch (error) {
      if (attempt === retries) throw error;
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

/**
 * Normalize SBDB payload to our client-friendly asteroid shape
 * Note: returns orbit values in AU and days; client can scale for visualization.
 */
function normalizeSbdbPayload(data) {
  if (!data) return null;
  const obj = data.object || {};
  const orbit = data.orbit || {};
  const elements = elementsArrayToMap(orbit.elements || []);

  const a_au = toNumber(elements.a?.value);
  const e = toNumber(elements.e?.value);
  const per_days = toNumber(elements.per?.value);
  const w_deg = toNumber(elements.w?.value);
  const om_deg = toNumber(elements.om?.value);
  const longitudePerihelionDeg = (w_deg != null && om_deg != null)
    ? (((w_deg + om_deg) % 360) + 360) % 360
    : null;

  // Physical params
  const phys = data.phys_par || [];
  const H = findPhysValue(phys, ['H']).value; // absolute magnitude
  const diam = findPhysValue(phys, ['diameter', 'diam']).value; // likely km
  const diamUnits = findPhysValue(phys, ['diameter', 'diam']).units;
  const diameter_m = diam != null
    ? (String(diamUnits).toLowerCase() === 'km' ? diam * 1000 : diam)
    : null;

  // Build structure compatible with current client overlay usage where possible
  const asteroid = {
    id: obj.spkid || obj.des || obj.fullname || obj.shortname || null,
    name: obj.fullname || obj.shortname || obj.des || obj.spkid || 'Unknown Object',
    neo: !!obj.neo,
    is_potentially_hazardous_asteroid: !!obj.pha,
    orbit_class: obj.orbit_class || null,
    spkid: obj.spkid || null,
    // Overlay-friendly
    orbit: {
      a_au: a_au,
      e: e,
      period_days: per_days,
      w_deg: w_deg,
      om_deg: om_deg,
      longitudePerihelionDeg: longitudePerihelionDeg
    },
    estimated_diameter: diameter_m != null ? {
      meters: { estimated_diameter_max: diameter_m }
    } : null,
    absolute_magnitude_h: H,
    // Include raw payload subsections for advanced clients
    _raw: {
      object: obj,
      orbit,
      phys_par: phys
    }
  };

  return asteroid;
}

module.exports = {
  fetchSbdb,
  normalizeSbdbPayload
};
