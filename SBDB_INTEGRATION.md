# SBDB Integration Summary

## Overview
Integrated NASA JPL's Small-Body Database (SBDB) API to enhance asteroid orbital data with high-precision dynamical models computed by JPL's Solar System Dynamics group.

## Features Implemented

### 1. Server-Side SBDB Service (`server/services/sbdb.js`)
- Fetches asteroid data from `https://ssd-api.jpl.nasa.gov/sbdb.api`
- Supports query by `sstr` (search string), `spk` (SPK-ID), or `des` (designation)
- Requests physical parameters (`phys-par=1`) and calendar date epochs (`cd-epoch=1`)
- Implements 15-minute in-memory cache with automatic retry logic
- Normalizes SBDB payload to client-friendly structure:
  - Orbit elements: `a_au`, `e`, `period_days`, `longitude_perihelion_deg`
  - Physical params: absolute magnitude `H`, diameter (converted to meters)
  - NEO/PHA flags, orbit class

### 2. Enriched Asteroid Endpoint (`/api/asteroids/:id/full`)
- Combines NASA NeoWs base data + SBDB precision orbits
- Query params: `?sstr=<name>` or `?spk=<id>` or `?des=<designation>`
- Auto-fallback: tries SPK if numeric ID, else cleaned name
- Response structure:
  ```json
  {
    "id": "29075",
    "name": "29075 (1950 DA)",
    "neo": { /* NeoWs data */ },
    "sbdb": { /* SBDB normalized data */ },
    "merged": {
      "orbit": {
        "semi_major_axis_au": 1.7,
        "eccentricity": 0.51,
        "period_days": 770,
        "longitude_perihelion_deg": 350,
        "source": "sbdb"
      },
      "sources": { "neo": true, "sbdb": true }
    }
  }
  ```
- Handles multiple SBDB matches by returning `match_list` array

### 3. Client Auto-Enrichment (`client/src/components/SolarSystemView.js`)
- Added SPK IDs to asteroid dataset:
  - `29075 (1950 DA)`: spkid `2029075`
  - `101955 Bennu`: spkid `2101955`
  - Others use `sstr` fallback
- Auto-fetches SBDB data when asteroid selected
- Merges enriched orbit into rendering pipeline
- Asteroid component now consumes `merged.orbit` fields with unit conversion:
  - Converts `semi_major_axis_au` (AU) → scene units
  - Uses `eccentricity`, `period_days`, `longitude_perihelion_deg` directly
  - Fallback to local orbit if enrichment unavailable

### 4. Enhanced Overlay Display
- Shows **Absolute Magnitude (H)** from SBDB physical params
- Displays orbit data source label ("sbdb" or "neows")
- Improved null-safe formatting with "—" for missing values
- Prefers SBDB precision orbits when available

### 5. SBDB Caching
- 15-minute TTL in-memory cache (Map-based)
- Cache key: JSON-serialized query params
- Reduces redundant API calls for repeated lookups

## Asteroid Orbital Data Usage

### Data Flow
1. **Static Base Data** → Hardcoded in `SolarSystemView.js` with approximate orbits
2. **Selection Event** → Triggers enrichment fetch to `/api/asteroids/:id/full`
3. **SBDB Lookup** → Server queries SBDB with SPK ID or name
4. **Merge & Cache** → Server combines NeoWs + SBDB, caches result
5. **Client Render** → `Asteroid` component uses `merged.orbit` for position calculation
6. **Overlay Display** → Shows merged data with source attribution

### Orbital Elements Mapping
| SBDB Element | Client Usage | Notes |
|--------------|--------------|-------|
| `a` (AU) | `semi_major_axis_au` | Converted to scene units (× 10 × ORBITAL_DISTANCE_SCALE) |
| `e` | `eccentricity` | Directly used in Kepler equation |
| `per` (days) | `period_days` | Orbital period for mean motion calculation |
| `w` + `om` (deg) | `longitude_perihelion_deg` | Combined (w + Ω) mod 360° for 2D ecliptic |
| `q` (AU) | `perihelion_distance_au` | Available but not currently used in rendering |

### Precision Improvements
- **Before**: Approximate orbits (e.g., Bennu `a=1.126 AU`, estimated)
- **After**: JPL high-precision ephemerides (e.g., Bennu `a=1.126343 AU` from SBDB)
- **Source**: SBDB orbits use full dynamical models with:
  - Planetary perturbations (DE431 ephemeris)
  - Radar astrometry when available
  - Small-body perturbers (SB431-N16)
  - Relativistic corrections

## Testing the Integration

### Server Test
```bash
cd server
npm run dev
# Test SBDB endpoint:
curl "http://localhost:5000/api/asteroids/29075/full?spk=2029075"
```

### Expected SBDB Response Fields
- `merged.orbit.source`: `"sbdb"`
- `merged.orbit.semi_major_axis_au`: High-precision value
- `sbdb._raw.orbit.elements`: Full array of orbital elements with sigmas
- `sbdb._raw.phys_par`: Physical parameters array (H, diameter, etc.)

### Client Test
1. Start dev server: `cd client && npm run dev`
2. Navigate to 3D Orbital View
3. Click asteroid "29075 (1950 DA)"
4. Verify overlay shows:
   - Absolute Magnitude (H)
   - Orbit Source: "sbdb"
   - Precise orbital elements
5. Check browser console for fetch success/failure

## API Rate Limits
- SBDB API: No key required, fair use policy
- Implemented client-side debouncing via selection event
- Server-side caching reduces repeat queries

## Future Enhancements
1. **Match List UI**: When SBDB returns multiple matches, present selection dialog
2. **Orbit Visualization**: Add orbit lines for asteroids using SBDB elements
3. **Uncertainty Ellipses**: Display 3-sigma position uncertainties from covariance
4. **Time-varying Orbits**: Request covariance matrix to show orbit evolution
5. **Physical Params**: Surface albedo, rotation period, spectral type
6. **Close Approaches**: Integrate SBDB close approach data into timeline

## Files Modified
- `server/services/sbdb.js` (new)
- `server/routes/asteroids.js` (enhanced)
- `server/index.js` (mounted routes)
- `client/src/components/SolarSystemView.js` (enrichment + rendering)
- `client/src/components/Sidebar.js` (added SPK IDs)

## References
- [SBDB API Documentation](https://ssd-api.jpl.nasa.gov/doc/sbdb.html)
- [JPL Small-Body Database](https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html)
- [Horizons System](https://ssd.jpl.nasa.gov/horizons/)
