# Realistic Physics-Based Solar System Simulation

## Overview
This is a complete rewrite of the solar system visualization using **realistic astronomical physics** based on NASA/JPL data and Kepler's laws of planetary motion.

## Key Features

### 1. **Accurate Orbital Mechanics**
- Uses **Kepler's laws** to calculate planetary positions
- Implements the **Kepler equation** to solve for eccentric anomaly
- Calculates true anomaly and heliocentric distance
- Uses real astronomical data:
  - Semi-major axis (in AU)
  - Orbital eccentricity
  - Orbital periods (in Earth days)
  - Longitude of perihelion

### 2. **Real Planetary Data (NASA/JPL Values)**

| Planet  | Semi-Major Axis | Eccentricity | Period (days) | Rotation Period |
|---------|----------------|--------------|---------------|-----------------|
| Mercury | 0.387 AU       | 0.2056       | 87.969        | 58.646 days     |
| Venus   | 0.723 AU       | 0.0068       | 224.701       | -243.018 days   |
| Earth   | 1.000 AU       | 0.0167       | 365.256       | 0.997 days      |
| Mars    | 1.524 AU       | 0.0934       | 686.980       | 1.026 days      |
| Jupiter | 5.203 AU       | 0.0484       | 4332.589      | 0.414 days      |
| Saturn  | 9.537 AU       | 0.0542       | 10759.22      | 0.444 days      |
| Uranus  | 19.191 AU      | 0.0472       | 30688.5       | -0.718 days     |
| Neptune | 30.068 AU      | 0.0086       | 60182         | 0.671 days      |

### 3. **Time-Based Simulation**
- Uses **Julian Date** (J2000 epoch) for accurate time calculations
- Planets move based on **current real-world date**
- Time can be fast-forwarded using the TimelineSlider
- Supports multiple time scales:
  - 1 day per second
  - 1 week per second
  - 2 weeks per second
  - 1 month per second
  - 3 months per second

### 4. **Interactive Controls**
- **Play/Pause button**: Animate time progression
- **LIVE button**: Jump to current real-time date
- **Time slider**: Manually scrub through the year
- **Speed control**: Cycle through time acceleration rates
- **Camera controls**: Pan, zoom, and rotate the view

### 5. **Visual Enhancements**
- Elliptical orbits drawn using actual eccentricity values
- Starfield background for realistic space environment
- Accurate Sun lighting with point light source
- Adaptive planet labels that scale with camera distance
- Color-coded orbits and planets
- Hazardous asteroids highlighted in red

## Physics Implementation

### Orbital Position Calculation
```javascript
calculateOrbitalPosition(planet, julianDate)
```
1. Calculate days since J2000 epoch (Jan 1, 2000, 12:00 TT)
2. Compute mean anomaly (M) from mean motion
3. Solve Kepler's equation iteratively: `M = E - e*sin(E)`
4. Calculate true anomaly (v) from eccentric anomaly
5. Compute heliocentric distance: `r = a(1 - e*cos(E))`
6. Transform to 3D coordinates using longitude of perihelion

### Time Advancement
- Real-time animation updates planet positions each frame
- Time scale multiplier allows fast-forwarding
- Planet rotation speeds based on actual rotation periods
- Smooth interpolation between frames

## Technical Stack
- **React Three Fiber** - 3D rendering
- **@react-three/drei** - Helper components (OrbitControls, Html, Stars)
- **Three.js** - WebGL 3D graphics
- **Next.js** - React framework

## Usage
1. The simulation starts at the current date/time
2. Click **Play** to start time animation
3. Use the **speed control** to adjust how fast time passes
4. Click **LIVE** to return to current real-time
5. Drag the **slider** to jump to any day of the year
6. Use mouse to **rotate, zoom, and pan** the camera

## References
- NASA/JPL Horizons System
- Kepler's Laws of Planetary Motion
- Google Earth space view
- NASA Eyes on the Solar System
- JPL Small-Body Database

## Future Enhancements
- Integration with NASA NEO API for real asteroid data
- Accurate asteroid orbital elements
- Planetary textures and realistic materials
- Moon orbits
- Spacecraft trajectories
- Impact trajectory calculations
- Historical comet data
