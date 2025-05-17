import { useState, useEffect } from 'react';
import axios from 'axios';
import MainNavbar from '../components/MainNavbar';
import WelcomePopup from '../components/WelcomePopup';
import { FaUserShield, FaChartLine, FaExclamationTriangle, FaBalanceScale, FaSyncAlt, FaDatabase, FaTable } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import '../assets/styles/Dashboard.css';

const Dashboard = () => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    metrics: null,
    riskDistribution: [],
    highRiskTransactions: [],
    probabilityTrend: [],
    highRiskClients: [],
    modelPerformance: [],
    ageRiskData: [],
    geographicRisk: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const API_BASE_URL = 'http://localhost:5000/api/dashboard';
  const MIN_REFRESH_INTERVAL = 30; // seconds

  // Initialize dashboard and check for welcome popup
  useEffect(() => {
    const shouldShowWelcome = localStorage.getItem('showWelcome') === 'true';
    if (shouldShowWelcome) {
      setShowWelcome(true);
      localStorage.removeItem('showWelcome');
      localStorage.setItem('hasSeenWelcome', 'true');
    }

    fetchInitialData();
  }, []);

  // Handle refresh cooldown timer
  useEffect(() => {
    let timer;
    if (refreshCooldown > 0) {
      timer = setTimeout(() => {
        setRefreshCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [refreshCooldown]);

  // Fetch initial data (full load)
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const essentialData = await Promise.all([
        fetchWithRetry(`${API_BASE_URL}/metrics`),
        fetchWithRetry(`${API_BASE_URL}/risk-distribution`)
      ]);

      setDashboardData(prev => ({
        ...prev,
        metrics: essentialData[0],
        riskDistribution: essentialData[1]
      }));

      // Load secondary data after initial render
      setTimeout(() => {
        fetchSecondaryData();
      }, 1000);

      setLastUpdated(new Date());
    } catch (err) {
      handleDataError(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch secondary data (less critical)
  const fetchSecondaryData = async () => {
    try {
      const secondaryData = await Promise.all([
        fetchWithRetry(`${API_BASE_URL}/high-risk-transactions?limit=10`),
        fetchWithRetry(`${API_BASE_URL}/probability-trend?days=30`),
        fetchWithRetry(`${API_BASE_URL}/high-risk-clients?limit=10`)
      ]);

      setDashboardData(prev => ({
        ...prev,
        highRiskTransactions: secondaryData[0],
        probabilityTrend: secondaryData[1],
        highRiskClients: secondaryData[2]
      }));
    } catch (err) {
      console.error('Secondary data load error:', err);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (refreshCooldown > 0) {
      setError(`Please wait ${refreshCooldown} seconds before refreshing again`);
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      // Only refresh the most critical data
      const refreshedData = await Promise.all([
        fetchWithRetry(`${API_BASE_URL}/metrics`),
        fetchWithRetry(`${API_BASE_URL}/high-risk-transactions?limit=10`)
      ]);

      setDashboardData(prev => ({
        ...prev,
        metrics: refreshedData[0],
        highRiskTransactions: refreshedData[1]
      }));

      setLastUpdated(new Date());
      setRefreshCooldown(MIN_REFRESH_INTERVAL);
      setRefreshCount(prev => prev + 1);
    } catch (err) {
      handleDataError(err);
      // Longer cooldown if rate limited
      if (err.response?.status === 429) {
        setRefreshCooldown(60);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // API wrapper with retry logic
  const fetchWithRetry = async (url, retries = 3) => {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchWithRetry(url, retries - 1);
      }
      throw err;
    }
  };

  const handleDataError = (err) => {
    console.error('Dashboard API error:', err);
    setError(err.response?.data?.error || 'Failed to load dashboard data');
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
  };

  const EmptyState = ({ icon, message }) => (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <p className="empty-message">{message}</p>
    </div>
  );

  if (loading && !dashboardData.metrics) {
    return (
      <div className="dashboard-loading">
        <MainNavbar />
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <MainNavbar />
        <div className="error-message">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button 
            onClick={fetchInitialData} 
            className="retry-button"
            disabled={refreshCooldown > 0}
          >
            <FaSyncAlt /> {refreshCooldown > 0 ? `Try Again in ${refreshCooldown}s` : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <MainNavbar />
      {showWelcome && <WelcomePopup onClose={handleWelcomeClose} />}
      
      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>Fraud Detection Dashboard</h1>
          <div className="header-controls">
            <button 
              onClick={handleRefresh} 
              className={`refresh-button ${refreshCooldown > 0 ? 'cooldown' : ''}`}
              disabled={isRefreshing || refreshCooldown > 0}
            >
              {isRefreshing ? (
                <span className="spinner"></span>
              ) : refreshCooldown > 0 ? (
                `Wait ${refreshCooldown}s`
              ) : (
                <><FaSyncAlt /> Refresh</>
              )}
            </button>
            {lastUpdated && (
              <div className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
                {refreshCount > 0 && ` (Refreshed ${refreshCount}x)`}
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics Section */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon"><FaUserShield /></div>
            <div className="metric-value">
              {dashboardData.metrics?.totalAccounts || 0}
            </div>
            <div className="metric-label">Total Accounts</div>
          </div>
          
          <div className="metric-card high-risk">
            <div className="metric-icon"><FaExclamationTriangle /></div>
            <div className="metric-value">
              {dashboardData.metrics?.highRiskAccounts || 0}
            </div>
            <div className="metric-label">High Risk Accounts</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon"><FaChartLine /></div>
            <div className="metric-value">
              {dashboardData.metrics?.avgProbability ? 
                (dashboardData.metrics.avgProbability * 100).toFixed(2) + '%' : '0%'}
            </div>
            <div className="metric-label">Avg Fraud Probability</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon"><FaBalanceScale /></div>
            <div className="metric-value">
              {dashboardData.metrics?.modelUsage?.find(m => m.model === 'xgboost')?.count || 0}
            </div>
            <div className="metric-label">XGBoost Predictions</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="dashboard-row">
          <div className="dashboard-card">
            <h2>Risk Distribution</h2>
            <div className="chart-container">
              {dashboardData.riskDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.riskDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fraud_category" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Count']} />
                    <Legend />
                    <Bar dataKey="count" fill="#006D77" name="Transaction Count" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState 
                  icon={<FaDatabase size={48} />} 
                  message="No risk distribution data available" 
                />
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Model Usage</h2>
            <div className="chart-container">
              {dashboardData.metrics?.modelUsage?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.metrics.modelUsage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="model"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {dashboardData.metrics.modelUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [value, props.payload.model]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState 
                  icon={<FaDatabase size={48} />} 
                  message="No model usage data available" 
                />
              )}
            </div>
          </div>
        </div>

        {/* Data Tables Section */}
        <div className="dashboard-row">
          <div className="dashboard-card full-width">
            <div className="table-header">
              <h2>Recent High-Risk Transactions</h2>
              <button 
                onClick={() => handleRefresh()} 
                className="refresh-sm"
                disabled={isRefreshing || refreshCooldown > 0}
              >
                <FaSyncAlt /> {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <div className="table-container">
              {dashboardData.highRiskTransactions.length > 0 ? (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Client Age</th>
                      <th>Gender</th>
                      <th>Probability</th>
                      <th>Risk Level</th>
                      <th>Model</th>
                      <th>Updated At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.highRiskTransactions.map((txn, index) => (
                      <tr key={index}>
                        <td>{txn.transaction_id}</td>
                        <td>{txn.current_age}</td>
                        <td>{txn.gender}</td>
                        <td className={txn.fraud_probability > 0.7 ? 'high-risk' : ''}>
                          {(txn.fraud_probability * 100).toFixed(2)}%
                        </td>
                        <td className={`risk-${txn.fraud_category.toLowerCase().replace(' ', '-')}`}>
                          {txn.fraud_category}
                        </td>
                        <td>{txn.model_used}</td>
                        <td>{new Date(txn.updated_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState 
                  icon={<FaTable size={48} />} 
                  message="No high-risk transactions found" 
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;