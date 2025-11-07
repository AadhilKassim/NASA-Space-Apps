const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from Next.js build
app.use(express.static(path.join(__dirname, '../client/.next/static')));
app.use(express.static(path.join(__dirname, '../client/out')));

// Mount asteroid routes (NeoWs + SBDB)
const asteroidRoutes = require('./routes/asteroids');
app.use('/api/asteroids', asteroidRoutes);

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

// Catch all handler for Next.js pages
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../client/out/index.html'));
});

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
    console.log(`Asteroid routes mounted at /api/asteroids`);
});

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
  });