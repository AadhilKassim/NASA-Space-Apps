// server/routes/sentry.js
const express = require('express');
const { fetchSentry, fetchNeoWsById } = require('../services/nasa');
const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Try Sentry first (if available)
    const sentry = await fetchSentry(id).catch(() => null);
    const neo = await fetchNeoWsById(id).catch(() => null);
    res.json({ sentry, neo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sentry data' });
  }
});

module.exports = router;
