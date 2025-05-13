const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');
const admin = require('../utils/firebaseAdmin');

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

// Get all users in admin's organization
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT username, email, role, last_login, firebase_uid
       FROM app_users
       WHERE organisation = $1
       ORDER BY created_at DESC`,
      [req.user.org]
    );
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Create new user
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { firebase_uid, email, username, role } = req.body;
  
  try {
    const newUser = await pool.query(
      `INSERT INTO app_users 
       (firebase_uid, email, username, organisation, role, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING username, email, role, last_login`,
      [firebase_uid, email, username, req.user.org, role, req.user.id]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Delete user endpoint
router.delete('/:uid', verifyToken, isAdmin, async (req, res) => {
  const { uid } = req.params;
  
  try {
    // 1. First delete from Firebase
    try {
      await admin.auth().deleteUser(uid);
      console.log(`Successfully deleted user ${uid} from Firebase`);
    } catch (firebaseErr) {
      console.error('Firebase deletion error:', firebaseErr);
      return res.status(500).json({ 
        error: 'Failed to delete from Firebase',
        details: firebaseErr.message 
      });
    }

    // 2. Then delete from PostgreSQL
    const deleteResult = await pool.query(
      `DELETE FROM app_users
       WHERE firebase_uid = $1
       AND organisation = $2
       AND role != 'admin'`,
      [uid, req.user.org]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ 
        error: 'User not found in database or cannot delete admins' 
      });
    }

    res.json({ message: 'User deleted successfully from both systems' });
  } catch (err) {
    console.error('Overall deletion error:', err);
    res.status(500).json({ 
      error: 'Failed to complete deletion',
      details: err.message 
    });
  }
});

module.exports = router;
