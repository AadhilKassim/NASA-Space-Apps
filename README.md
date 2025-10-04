# A.I.M. - Asteroid Impact Mitigation Visualizer

## NASA Space Apps Challenge Solution

Interactive visualization and simulation tool for asteroid threat assessment and mitigation planning.

## Features

- **3D Orbital Visualizer**: Interactive solar system with real asteroid trajectories
- **Impact Simulation**: Earth impact modeling with blast radius visualization
- **Mitigation Planning**: Strategy evaluation and mission planning interface

## Quick Start

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

3. Open [Local Host 3000](http://localhost:3000)

## Tech Stack

- **Frontend**: React, Three.js, Leaflet
- **Backend**: Node.js, Express
- **APIs**: NASA NeoWs, NASA Sentry

## Project Structure

```text
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── SolarSystemView.js
│   │   │   ├── ImpactSimulation.js
│   │   │   ├── MitigationPlanner.js
│   │   │   └── Sidebar.js
│   │   └── App.js
├── server/          # Express backend
│   └── index.js
└── README.md
```
