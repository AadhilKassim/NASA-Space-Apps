const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
let basePort = parseInt(process.env.PORT, 10) || 5000;
let serverInstance;

app.use(cors());
app.use(express.json());

// Serve static files from Next.js build (exported to client/out)
const outDir = path.join(__dirname, '../client/out');
const nextStaticDir = path.join(__dirname, '../client/.next/static');
if (fs.existsSync(nextStaticDir)) {
  app.use(express.static(nextStaticDir));
}
if (fs.existsSync(outDir)) {
  app.use(express.static(outDir));
}

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

// Catch-all handler for SPA routing when static export exists
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexHtml = path.join(outDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  // Graceful fallback when static export not found (e.g., first deploy)
  res.status(200).send(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>AIM Visualizer</title>
      <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;max-width:800px;margin:4rem auto;padding:0 1rem;line-height:1.6}</style>
    </head>
    <body>
      <h1>AIM Visualizer</h1>
      <p>The static client build was not found at <code>/client/out</code>.</p>
      <p>Please ensure the client is built with Next.js static export:</p>
      <pre>cd client\nnpm run build</pre>
      <p>Then redeploy or restart the server.</p>
    </body>
  </html>`);
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