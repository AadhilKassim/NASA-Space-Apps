# A.I.M. - Asteroid Impact Mitigation Visualizer

## NASA Space Apps Challenge Solution

Interactive visualization and simulation tool for asteroid threat assessment and mitigation planning.

## Features

- **3D Orbital Visualizer**: Interactive solar system with real asteroid trajectories
- **Impact Simulation**: Earth impact modeling with blast radius visualization  
- **Risk Analysis**: Advanced damage assessment using Python-based calculations
- **Mitigation Planning**: Strategy evaluation and mission planning interface
- **Timeline Control**: Interactive timeline for asteroid trajectory analysis

## Quick Start

### Development Mode

1. Install dependencies:

```bash
npm install
cd client && npm install
cd ../server && npm install
```

2. Start the application:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

### Docker Deployment

```bash
docker-compose up
```

## Tech Stack

- **Frontend**: Next.js, React, Three.js (@react-three/fiber), Leaflet
- **Backend**: Node.js, Express, Python Flask
- **APIs**: NASA NeoWs, NASA Sentry
- **Database**: MongoDB
- **Deployment**: Docker

## API Services

### Node.js Backend (Port 5000)

- Asteroid data aggregation from NASA APIs
- Real-time orbital calculations
- Mission planning endpoints

### Python Risk Analyzer (Flask API)

- **Blast radius calculations** using kinetic energy models
- **Damage assessment** including seismic effects and crater formation
- **Mitigation analysis** with Delta-V requirements
- **Endpoint**: `/analyze/<asteroid_designation>`

## Project Structure

```text
├── client/                    # Next.js frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── SolarSystemView.js    # 3D solar system visualization
│   │   │   ├── ImpactSimulation.js   # Earth impact modeling
│   │   │   ├── MitigationPlanner.js  # Mission planning interface
│   │   │   ├── RiskAnalysis.js       # Risk assessment display
│   │   │   ├── TimelineSlider.js     # Timeline control
│   │   │   └── Sidebar.js            # Navigation sidebar
│   │   ├── contexts/
│   │   │   └── AsteroidContext.js    # Global state management
│   │   └── pages/
│   │       └── index.js              # Main application page
│   └── package.json
├── server/                    # Express backend
│   ├── routes/
│   │   ├── asteroids.js             # NASA NeoWs integration
│   │   ├── sentry.js                # NASA Sentry API
│   │   └── simulate.js              # Simulation endpoints
│   ├── services/
│   │   └── nasa.js                  # NASA API service layer
│   ├── risk_analyzer.py             # Python Flask API for damage analysis
│   ├── index.js                     # Main server file
│   └── package.json
├── docker-compose.yml         # Multi-service deployment
└── package.json              # Root package configuration
```

## Python Risk Analyzer Features

The `risk_analyzer.py` provides comprehensive impact assessment:

- **Blast Radius Calculation**: 4 psi (heavy destruction) and 1 psi (light damage) zones
- **Seismic Analysis**: Moment magnitude estimation from kinetic energy
- **Crater Formation**: Diameter prediction based on impact energy
- **Mitigation Planning**: Delta-V requirements for deflection missions
- **Real-time Analysis**: RESTful API for asteroid designation queries

### Example API Response

```json
{
  "status": "success",
  "asteroid_info": {
    "designation": "2000 SG344",
    "risk_assessment_summary": "Cumulative Impact Probability: 0.0001",
    "size_km": "0.037",
    "energy_mt": "0.150"
  },
  "impact_severity": {
    "destruction_radius_km": "1.25",
    "shaking_radius_km": "3.42",
    "seismic_magnitude_mw": "4.2",
    "crater_diameter_km": "0.53"
  },
  "mitigation_planning": {
    "required_delta_v_mms": "0.15",
    "conclusion": "SUCCESSFUL"
  }
}
```
