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

    // 1. Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(firebaseToken);

    // 2. Fetch user from PostgreSQL including first_login flag
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

    // 3. Update last_login timestamp
    await pool.query(
      `UPDATE app_users SET last_login = NOW() WHERE firebase_uid = $1`,
      [decoded.uid]
    );

    // 4. Set custom claims
    await admin.auth().setCustomUserClaims(decoded.uid, {
      role: user.role,
      org: user.organisation,
    });

    // 5. Check and update first_login
    let isFirstLogin = user.first_login;
    if (isFirstLogin) {
      await pool.query(
        `UPDATE app_users SET first_login = false WHERE firebase_uid = $1`,
        [decoded.uid]
      );
    }

    // 6. Revoke previous tokens to refresh custom claims
    await admin.auth().revokeRefreshTokens(decoded.uid);

    // 7. Create backend JWT
    const token = jwt.sign(
      {
        id: decoded.uid,
        role: user.role,
        org: user.organisation,
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    // 8. Return token + first login flag
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
    // 1. Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('Authorization token missing');

    // 2. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Verify Firebase UID exists
    const user = await pool.query(
      'SELECT firebase_uid, role FROM app_users WHERE firebase_uid = $1',
      [decoded.id]
    );
    
    if (user.rows.length === 0) throw new Error('User not found');

    // 4. Attach user to request
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