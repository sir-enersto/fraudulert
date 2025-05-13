const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const pool = require('../db');
const { jwtSecret, jwtExpiresIn } = require('../config');

// Initialize Firebase Admin (create serviceAccountKey.json from Firebase Console)
const serviceAccount = require('../fraudulert-firebase-adminsdk-fbsvc-d56b81a7cb.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

exports.login = async (req, res) => {
    try {
      const { firebaseToken } = req.body;
  
      // Verify Firebase token
      const decoded = await admin.auth().verifyIdToken(firebaseToken);
      
      // Get user from PostgreSQL
      const user = await pool.query(
        `SELECT firebase_uid, email, role, organisation 
         FROM app_users 
         WHERE firebase_uid = $1`,
        [decoded.uid]
      );
  
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'User not registered' });
      }

      await pool.query(
        `UPDATE app_users SET last_login = NOW() WHERE firebase_uid = $1`,
        [decoded.uid]
      );
  
      // Set custom claims in Firebase
      await admin.auth().setCustomUserClaims(decoded.uid, {
        role: user.rows[0].role,
        org: user.rows[0].organisation
      });
  
      
      // Create JWT
      const token = jwt.sign(
        {
          id: decoded.uid,
          role: user.rows[0].role,
          org: user.rows[0].organisation
        },
        jwtSecret,
        { expiresIn: jwtExpiresIn }
      );
  
      // Force token refresh to get updated claims
      await admin.auth().revokeRefreshTokens(decoded.uid);
  
      res.json({ token });
    } catch (err) {
      console.error('Auth error:', err);
      res.status(401).json({ error: 'Authentication failed' });
    }
  };