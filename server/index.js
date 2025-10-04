// server/index.js
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const axios = require('axios');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const asteroidsRouter = require('./routes/asteroids');
const sentryRouter = require('./routes/sentry');
const simulateRouter = require('./routes/simulate');

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Mongo client for simple caching and scenario storage
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/aim';
const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function start() {
  await client.connect();
  const db = client.db('aim');
  // Attach db to request
  app.use((req, res, next) => { req.db = db; next(); });

  // Routes
  app.use('/api/asteroids', asteroidsRouter);
  app.use('/api/sentry', sentryRouter);
  app.use('/api/impact', simulateRouter);

  // Static serve for production build (optional)
  if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
    });
  }

  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`AIM server listening on ${port}`));
}

start().catch(err => { console.error(err); process.exit(1); });
