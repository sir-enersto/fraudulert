const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { check } = require('express-validator');
const { auth, adminCheck } = require('../controllers/authController');
const pool = require('../db');

const upload = multer({ dest: 'uploads/' });

// Upload CSV (Admin only)
router.post('/upload', [
  auth,
  adminCheck,
  upload.single('csvFile'),
  check('csvFile').custom((value, { req }) => {
    if (!req.file) throw new Error('CSV file is required');
    if (req.file.mimetype !== 'text/csv') throw new Error('Only CSV files allowed');
    return true;
  })
], async (req, res) => {
  try {
    const results = [];
    const errors = [];

    // Process CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
          // Validate required fields
          if (!data.id || !data.current_age || !data.birth_year || 
              !data.birth_month || !data.gender || !data.address || 
              !data.credit_score) {
            errors.push({ row: data, error: 'Missing required fields' });
            return;
          }
          
          results.push({
            id: data.id,
            current_age: parseInt(data.current_age),
            birth_year: parseInt(data.birth_year),
            birth_month: parseInt(data.birth_month),
            gender: data.gender,
            address: data.address,
            credit_score: parseInt(data.credit_score),
            created_by: req.user.firebase_uid
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Clean up file
    fs.unlinkSync(req.file.path);

    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Some rows had errors',
        errors,
        totalRecords: results.length
      });
    }

    // Insert into DB
    const inserted = await Promise.all(
      results.map(async (account) => {
        try {
          await pool.query(
            `INSERT INTO accounts (
              id, current_age, birth_year, birth_month, 
              gender, address, credit_score, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING`,
            Object.values(account)
          );
          return { id: account.id, status: 'success' };
        } catch (err) {
          return { id: account.id, status: 'error', error: err.message };
        }
      })
    );

    res.json({
      success: true,
      totalRecords: results.length,
      inserted: inserted.filter(i => i.status === 'success').length,
      errors: inserted.filter(i => i.status === 'error')
    });

  } catch (err) {
    console.error('CSV upload error:', err);
    res.status(500).json({ success: false, error: 'Server error processing CSV' });
  }
});

// Get accounts (Admin sees all, others see only their created accounts)
router.get('/', auth, async (req, res) => {
    try {
      let query;
      let params = [];
  
      if (req.user.role === 'admin') {
        // Admin sees all accounts they created
        query = `
          SELECT a.id, a.current_age, a.birth_year, a.birth_month, 
                 a.gender, a.address, a.credit_score, a.risk_score
          FROM accounts a
          WHERE a.created_by = $1
        `;
        params = [req.user.firebase_uid];
      } else {
        // Viewer sees accounts created by their admin
        query = `
        SELECT a.id, a.current_age, a.birth_year, a.birth_month, 
               a.gender, a.address, a.credit_score
        FROM accounts a
        WHERE a.created_by = (
          SELECT created_by FROM app_users 
          WHERE firebase_uid = $1
        )
        OR a.created_by = $1
      `;
        params = [req.user.firebase_uid];
      }
  
      const { rows } = await pool.query(query, params);
      res.json(rows);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

module.exports = router;