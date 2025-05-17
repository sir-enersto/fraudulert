const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const pool = require('../db');
const { jwtSecret, jwtExpiresIn } = require('../config');

// Initialize Firebase Admin
const serviceAccount = require('../fraudulert-firebase-adminsdk-fbsvc-d56b81a7cb.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.login = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    // Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(firebaseToken);

    // Fetch user from PostgreSQL including first_login flag
    const userQuery = await pool.query(
      `SELECT firebase_uid, email, role, organisation, first_login 
       FROM app_users 
       WHERE firebase_uid = $1`,
      [decoded.uid]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not registered' });
    }

    const user = userQuery.rows[0];

    // Update last_login timestamp
    await pool.query(
      `UPDATE app_users SET last_login = NOW() WHERE firebase_uid = $1`,
      [decoded.uid]
    );

    // Set custom claims
    await admin.auth().setCustomUserClaims(decoded.uid, {
      role: user.role,
      org: user.organisation,
    });

    // Check and update first_login
    let isFirstLogin = user.first_login;
    if (isFirstLogin) {
      await pool.query(
        `UPDATE app_users SET first_login = false WHERE firebase_uid = $1`,
        [decoded.uid]
      );
    }

    // Revoke previous tokens to refresh custom claims
    await admin.auth().revokeRefreshTokens(decoded.uid);

    // Create backend JWT
    const token = jwt.sign(
      {
        id: decoded.uid,
        role: user.role,
        org: user.organisation,
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    // Return token and first login trigger
    return res.json({
      token,
      isFirstLogin,
    });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

exports.auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('Authorization token missing');

    // Check JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check that Firebase UID exists
    const user = await pool.query(
      'SELECT firebase_uid, role FROM app_users WHERE firebase_uid = $1',
      [decoded.id]
    );
    
    if (user.rows.length === 0) throw new Error('User not found');

    // Attach user to request
    req.user = {
      firebase_uid: decoded.id,
      role: user.rows[0].role,
      email: decoded.email || null
    };

    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    res.status(401).json({ error: 'Please authenticate' });
  }
};

exports.adminCheck = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};