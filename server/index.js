const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// NASA NeoWs API endpoint
app.get('/api/asteroids', async (req, res) => {
  try {
    const response = await axios.get(`https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${process.env.NASA_API_KEY || 'DEMO_KEY'}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch asteroid data' });
  }
});

// NASA Sentry API endpoint
app.get('/api/sentry', async (req, res) => {
  try {
    const response = await axios.get(`https://api.nasa.gov/neo/rest/v1/sentry?api_key=${process.env.NASA_API_KEY || 'DEMO_KEY'}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sentry data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});