const pool = require('../db');
const axios = require('axios');
const fs = require('fs');

const COLAB_API_URL = 'https://b96c-34-82-26-76.ngrok-free.app/predict';

const processTransactionFile = async (file, userId) => {
  try {
    // 1. Send CSV to Colab API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path));

    const response = await axios.post(COLAB_API_URL, formData, {
      headers: { ...formData.getHeaders() }
    });

    const predictions = response.data.predictions;

    // 2. Save to PostgreSQL
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const tx of predictions) {
        await client.query(`
          INSERT INTO transactions (
            id, client_id, date, fraud_probability, 
            risk_category, model_used, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [
          tx.id,
          tx.client_id, // Ensure this exists in your CSV
          new Date(),   // Or extract from CSV if available
          tx.fraud_probability,
          tx.risk_category,
          'xgboost',    // Hardcoded since you're using XGBoost
          userId
        ]);
      }

      await client.query('COMMIT');
      return { success: true, processed: predictions.length };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = { processTransactionFile };