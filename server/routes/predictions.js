const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT transaction_id, client_id, fraud_probability,
             fraud_category, model_used, updated_at
      FROM fraud_predictions
      ORDER BY updated_at DESC
      LIMIT 10000
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching predictions:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
