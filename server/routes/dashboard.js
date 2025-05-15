const express = require('express');
const router = express.Router();
const pool = require('../db'); // Assuming you have a db connection pool

// Helper function for error handling
const handleErrors = (res, error) => {
  console.error('Database error:', error);
  res.status(500).json({ error: 'Internal server error' });
};

// 1. Key Metrics Overview
router.get('/metrics', async (req, res) => {
  try {
    // Execute all metric queries in parallel
    const [totalAccounts, highRiskAccounts, avgProbability, modelUsage] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM accounts WHERE is_active = TRUE'),
      pool.query(`
        SELECT COUNT(DISTINCT client_id) as count 
        FROM fraud_predictions 
        WHERE fraud_category IN ('Very High Risk', 'High Risk')
      `),
      pool.query('SELECT AVG(fraud_probability) as avg FROM fraud_predictions'),
      pool.query('SELECT model_used, COUNT(*) as count FROM fraud_predictions GROUP BY model_used')
    ]);

    res.json({
      totalAccounts: parseInt(totalAccounts.rows[0].count),
      highRiskAccounts: parseInt(highRiskAccounts.rows[0].count),
      avgProbability: parseFloat(avgProbability.rows[0].avg),
      modelUsage: modelUsage.rows.map(row => ({
        model: row.model_used,
        count: parseInt(row.count)
      }))
    });
  } catch (error) {
    handleErrors(res, error);
  }
});

// 2. Risk Distribution
router.get('/risk-distribution', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        fraud_category,
        COUNT(*) as count,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM fraud_predictions) as percentage
      FROM fraud_predictions
      GROUP BY fraud_category
      ORDER BY 
        CASE fraud_category
          WHEN 'Very High Risk' THEN 1
          WHEN 'High Risk' THEN 2
          WHEN 'Medium Risk' THEN 3
          WHEN 'Low Risk' THEN 4
          ELSE 5
        END
    `);
    res.json(rows);
  } catch (error) {
    handleErrors(res, error);
  }
});

// 3. Recent High-Risk Transactions
router.get('/high-risk-transactions', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const { rows } = await pool.query(`
      SELECT 
        fp.transaction_id,
        a.current_age,
        a.gender,
        fp.fraud_probability,
        fp.fraud_category,
        fp.model_used,
        fp.updated_at
      FROM fraud_predictions fp
      JOIN accounts a ON fp.client_id = a.id
      WHERE fp.fraud_category IN ('Very High Risk', 'High Risk')
      ORDER BY fp.updated_at DESC
      LIMIT $1
    `, [limit]);
    res.json(rows);
  } catch (error) {
    handleErrors(res, error);
  }
});

// 4. Fraud Probability Over Time
router.get('/probability-trend', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const { rows } = await pool.query(`
      SELECT 
        DATE_TRUNC('day', updated_at) as day,
        AVG(fraud_probability) as avg_probability,
        COUNT(*) as transaction_count
      FROM fraud_predictions
      WHERE updated_at >= NOW() - INTERVAL '${days} days'
      GROUP BY day
      ORDER BY day ASC
    `);
    res.json(rows);
  } catch (error) {
    handleErrors(res, error);
  }
});

// 5. Highest Risk Clients
router.get('/high-risk-clients', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const { rows } = await pool.query(`
      SELECT 
        a.id,
        a.current_age,
        a.gender,
        MAX(fp.fraud_probability) as highest_risk_score,
        COUNT(fp.transaction_id) as transaction_count
      FROM accounts a
      LEFT JOIN fraud_predictions fp ON a.id = fp.client_id
      WHERE a.is_active = TRUE
      GROUP BY a.id
      ORDER BY highest_risk_score DESC NULLS LAST
      LIMIT $1
    `, [limit]);
    res.json(rows);
  } catch (error) {
    handleErrors(res, error);
  }
});

// 6. Model Performance Comparison
router.get('/model-performance', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        model_used,
        AVG(fraud_probability) as avg_probability,
        COUNT(*) as prediction_count,
        COUNT(DISTINCT client_id) as unique_clients
      FROM fraud_predictions
      GROUP BY model_used
    `);
    res.json(rows);
  } catch (error) {
    handleErrors(res, error);
  }
});

// 7. Age vs. Fraud Risk
router.get('/age-risk-correlation', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        a.current_age,
        AVG(fp.fraud_probability) as avg_risk,
        COUNT(fp.transaction_id) as transaction_count
      FROM accounts a
      JOIN fraud_predictions fp ON a.id = fp.client_id
      GROUP BY a.current_age
      ORDER BY a.current_age
    `);
    res.json(rows);
  } catch (error) {
    handleErrors(res, error);
  }
});

// 8. Geographic Risk Distribution
router.get('/geographic-risk', async (req, res) => {
  try {
    const { minTransactions = 5, limit = 10 } = req.query;
    const { rows } = await pool.query(`
      SELECT 
        SUBSTRING(a.address FROM '([A-Za-z ]+),') as city,
        AVG(fp.fraud_probability) as avg_risk,
        COUNT(*) as transaction_count
      FROM accounts a
      JOIN fraud_predictions fp ON a.id = fp.client_id
      GROUP BY city
      HAVING COUNT(*) > $1
      ORDER BY avg_risk DESC
      LIMIT $2
    `, [minTransactions, limit]);
    res.json(rows);
  } catch (error) {
    handleErrors(res, error);
  }
});

module.exports = router;