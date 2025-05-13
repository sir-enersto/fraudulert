const admin = require('firebase-admin');
const serviceAccount = require('../fraudulert-firebase-adminsdk-fbsvc-d56b81a7cb.json');

// Initialize only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

module.exports = admin;