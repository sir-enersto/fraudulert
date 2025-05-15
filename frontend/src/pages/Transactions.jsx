import React, { useState, useEffect } from "react";
import { FaSearch, FaFileUpload } from "react-icons/fa";
import axios from 'axios';
import MainNavbar from "../components/MainNavbar";
import "../assets/styles/Transactions.css";

const Transactions = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelType, setModelType] = useState('xgboost');
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const FASTAPI_URL = 'http://localhost:8000';
  const NODE_API_URL = 'http://localhost:5000/api';

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPredictions([]);
    setMetadata(null);

    if (!selectedFile) {
      setError('Please upload a CSV file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setLoading(true);
    try {
      const response = await axios.post(
        `${FASTAPI_URL}/predict?model_type=${modelType}&sample_size=5`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setPredictions(response.data.predictions);
      setMetadata(response.data.metadata);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPredictions = async () => {
    try {
      const response = await axios.get(`${NODE_API_URL}/predictions`);
      setRecentPredictions(response.data);
    } catch (err) {
      console.error('Error fetching recent predictions:', err);
    }
  };

  useEffect(() => {
    fetchRecentPredictions();
  }, []);

  const filterByRisk = (prediction) => {
    if (riskFilter === "all") return true;
    return prediction.fraud_category.toLowerCase().includes(riskFilter.toLowerCase());
  };

  return (
    <div className="transactions-container">
      <MainNavbar />
      <div className="transactions-header">
        <h2>Fraud Detection</h2>
        <div className="controls">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="file-upload-wrapper">
            <label className="csv-upload-btn">
              <FaFileUpload /> Upload CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            {selectedFile && (
              <>
                <span>{selectedFile.name}</span>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="upload-confirm-btn"
                >
                  {loading ? 'Processing...' : 'Predict'}
                </button>
              </>
            )}
          </div>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            className="filter-dropdown"
          >
            <option value="xgboost">XGBoost</option>
            <option value="lightgbm">LightGBM</option>
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="filter-dropdown"
          >
            <option value="all">All Risks</option>
            <option value="very high">Very High Risk</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
            <option value="very low">Very Low Risk</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="transactions-table-container">
        {/* Current Prediction Results */}
        {predictions.length > 0 && (
          <div className="results-section">
            <h3>Current Prediction Results</h3>
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Client ID</th>
                  <th>Probability</th>
                  <th>Risk Level</th>
                  <th>Model Used</th>
                </tr>
              </thead>
              <tbody>
                {predictions
                  .filter(p => filterByRisk(p))
                  .map((p, i) => (
                    <tr key={i}>
                      <td>{p.transaction_id || p.id}</td>
                      <td>{p.client_id}</td>
                      <td>{(p.fraud_probability * 100).toFixed(2)}%</td>
                      <td className={p.fraud_category.toLowerCase().includes('high') ? 'high-risk' : 
                                    p.fraud_category.toLowerCase().includes('low') ? 'low-risk' : ''}>
                        {p.fraud_category}
                      </td>
                      <td>{p.model_used}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recent Predictions */}
        {recentPredictions.length > 0 && (
          <div className="results-section">
            <h3>Recent Predictions</h3>
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Client ID</th>
                  <th>Probability</th>
                  <th>Risk Level</th>
                  <th>Model Used</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentPredictions
                  .filter(pred => 
                    Object.values(pred).some(
                      val => val.toString().toLowerCase().includes(search.toLowerCase())
                    )
                  )
                  .filter(p => filterByRisk(p))
                  .map((r, i) => (
                    <tr key={i}>
                      <td>{r.transaction_id}</td>
                      <td>{r.client_id}</td>
                      <td>{(r.fraud_probability * 100).toFixed(2)}%</td>
                      <td className={r.fraud_category.toLowerCase().includes('high') ? 'high-risk' : 
                                      r.fraud_category.toLowerCase().includes('low') ? 'low-risk' : ''}>
                        {r.fraud_category}
                      </td>
                      <td>{r.model_used}</td>
                      <td>{new Date(r.updated_at).toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {predictions.length === 0 && recentPredictions.length === 0 && (
          <div className="no-transactions-placeholder">
            <div className="placeholder-content">
              <h3>No Predictions Found</h3>
              <p>Upload a CSV file to get started with fraud detection.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;