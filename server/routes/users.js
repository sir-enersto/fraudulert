const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/signup', async (req, res) => {
  const { firebase_uid, email, username, organisation, role, created_by } = req.body;

  try {
    await pool.query(
      `INSERT INTO app_users 
        (firebase_uid, email, username, organisation, role, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [firebase_uid, email, username, organisation, role, created_by]
    );

    res.status(201).json({ message: 'User added to PostgreSQL.' });
  } catch (err) {
    console.error('DB insert error:', err);
    res.status(500).json({ error: 'Failed to insert user.' });
  }
});

module.exports = router;
