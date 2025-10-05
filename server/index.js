const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// CNEOS Sentry asteroids endpoint
app.get('/api/asteroids', (req, res) => {
  res.json({
    near_earth_objects: [
      { id: '29075', name: '29075 (1950 DA)', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 1300 } }, impact_probability: '3.8e-4', torino_scale: 0 },
      { id: '101955', name: '101955 Bennu (1999 RQ36)', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 490 } }, impact_probability: '5.7e-4', torino_scale: 0 },
      { id: '2008JL3', name: '2008 JL3', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 29 } }, impact_probability: '1.7e-4', torino_scale: 0 },
      { id: '2000SG344', name: '2000 SG344', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 37 } }, impact_probability: '2.7e-3', torino_scale: 0 },
      { id: '2010RF12', name: '2010 RF12', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 7 } }, impact_probability: '1.0e-1', torino_scale: 0 },
      { id: 'impactor2025', name: 'Impactor-2025', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 150 } }, impact_probability: '3.7e-4', torino_scale: 1 }
    ]
  });
});

// Risk analysis endpoint using Python script
app.get('/api/analyze/:designation', async (req, res) => {
  const { designation } = req.params;
  const { spawn } = require('child_process');
  
  try {
    const python = spawn('python', ['risk_analyzer.py', designation]);
    let result = '';
    
    python.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        try {
          const analysis = JSON.parse(result);
          res.json(analysis);
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse analysis result' });
        }
      } else {
        res.status(500).json({ error: 'Python analysis failed' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run risk analysis' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});