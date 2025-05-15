import React, { useState, useEffect } from "react";
import { FaSearch, FaTrash, FaPlus, FaFileUpload } from "react-icons/fa";
import axios from 'axios';
import MainNavbar from "../components/MainNavbar";
import "../assets/styles/Accounts.css";

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const api = axios.create({
      baseURL: 'http://localhost:5000/api'
    });

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get('/accounts');
        setAccounts(response.data);
      } catch (err) {
        setError('Failed to load accounts');
      }
    };
    fetchAccounts();
  }, []);

  // Handle CSV upload
  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await axios.post('/accounts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.data.success) {
        // Refresh accounts after upload
        const { data } = await axios.get('/accounts');
        setAccounts(data);
        alert(`Successfully uploaded ${response.data.inserted} accounts`);
      } else {
        setError(response.data.message || 'Upload failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
      console.error('Error details:', err.response?.data);
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  // Handle account deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    
    try {
      await axios.delete(`/accounts/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      setAccounts(accounts.filter(acc => acc.id !== id));
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  return (
    <div className="accounts-container">
      <MainNavbar />
      <div className="accounts-header">
        <h2>Accounts</h2>
        <div className="controls">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search accounts..."
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
      onChange={(e) => setFile(e.target.files[0])}
      style={{ display: 'none' }}
    />
  </label>
  {file && (
    <>
      <span>{file.name}</span>
      <button 
        onClick={handleUpload}
        disabled={uploading}
        className="upload-confirm-btn"
      >
        {uploading ? 'Uploading...' : 'Confirm'}
      </button>
    </>
  )}
</div>

          <select className="filter-dropdown">
            <option value="">All Accounts</option>
            <option value="high-risk">High Risk</option>
            <option value="low-risk">Low Risk</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="accounts-table-container">
        {accounts.length === 0 ? (
          <div className="no-accounts-placeholder">
            <div className="placeholder-content">
              <h3>No Accounts Found</h3>
              <p>There are currently no accounts to display.</p>
            </div>
          </div>
        ) : (
        <table className="accounts-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Age</th>
              <th>Birth Year</th>
              <th>Birth Month</th>
              <th>Gender</th>
              <th>Address</th>
              <th>Credit Score</th>
              <th>Risk Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {accounts
              .filter(acc => 
                Object.values(acc).some(
                  val => val.toString().toLowerCase().includes(search.toLowerCase())
                )
              )
              .map((acc) => (
                <tr key={acc.id}>
                  <td>{acc.id}</td>
                  <td>{acc.current_age}</td>
                  <td>{acc.birth_year}</td>
                  <td>{acc.birth_month}</td>
                  <td>{acc.gender}</td>
                  <td>{acc.address}</td>
                  <td>{acc.credit_score}</td>
                  <td className={acc.risk_score > 70 ? 'high-risk' : acc.risk_score < 30 ? 'low-risk' : ''}>
                    {acc.risk_score?.toFixed(2) || 'N/A'}
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(acc.id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};

export default Accounts;