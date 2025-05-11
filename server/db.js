const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'fraud_detection',
  password: 'Commonniggah',
  port: 5432,
});

module.exports = pool;
