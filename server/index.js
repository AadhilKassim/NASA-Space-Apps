const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
let basePort = parseInt(process.env.PORT, 10) || 5000;
let serverInstance;

app.use(cors());
app.use(express.json());

// Serve static files from Next.js build
app.use(express.static(path.join(__dirname, '../client/.next/static')));
app.use(express.static(path.join(__dirname, '../client/out')));

// Mount asteroid routes (NeoWs + SBDB)
const asteroidRoutes = require('./routes/asteroids');
app.use('/api/asteroids', asteroidRoutes);

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), port: basePort });
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

function startServer(attempt = 0) {
  const portToUse = basePort + attempt;
  console.log(`[startServer] Attempting to listen on port ${portToUse}...`);
  serverInstance = app.listen(portToUse, () => {
    console.log(`Server running on port ${portToUse}`);
    if (attempt > 0) console.log(`(Used fallback port after EADDRINUSE)`);
    console.log(`Asteroid routes mounted at /api/asteroids`);
    console.log(`Health endpoint: http://localhost:${portToUse}/api/health`);
  });
  serverInstance.on('error', (err) => {
    console.error(`[startServer] Error on port ${portToUse}:`, err.code, err.message);
    if (err.code === 'EADDRINUSE' && attempt < 3) {
      console.warn(`Port ${portToUse} in use, retrying on port ${portToUse + 1}`);
      startServer(attempt + 1);
    } else {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  });
  serverInstance.on('close', () => {
    console.log(`[startServer] Server on port ${portToUse} closed.`);
  });
}

console.log('[index.js] Initializing server...');
startServer();
console.log('[index.js] startServer() called.');

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
  });