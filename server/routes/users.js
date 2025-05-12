// server/routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

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

// Get current user's data
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT username, email, organisation, role 
       FROM app_users 
       WHERE firebase_uid = $1`,
      [req.user.id]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Update user profile
router.patch('/me', verifyToken, async (req, res) => {
  const { username, organisation } = req.body;
  
  try {
    const updatedUser = await pool.query(
      `UPDATE app_users 
       SET username = $1, organisation = $2 
       WHERE firebase_uid = $3
       RETURNING username, email, organisation, role`,
      [username, organisation, req.user.id]
    );
    
    res.json(updatedUser.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});


module.exports = router;
