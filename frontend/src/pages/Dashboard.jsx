import { useState, useEffect } from 'react';
import axios from 'axios';
import MainNavbar from '../components/MainNavbar';
import WelcomePopup from '../components/WelcomePopup';
import { 
  FaUserShield, 
  FaChartLine, 
  FaExclamationTriangle, 
  FaBalanceScale, 
  FaSyncAlt, 
  FaDatabase,
  FaTable
} from 'react-icons/fa';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const API_BASE_URL = 'http://localhost:5000/api/dashboard';

  useEffect(() => {
    const shouldShowWelcome = localStorage.getItem('showWelcome') === 'true';
    if (shouldShowWelcome) {
      setShowWelcome(true);
      localStorage.removeItem('showWelcome');
      localStorage.setItem('hasSeenWelcome', 'true');
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        metricsRes,
        riskDistributionRes,
        highRiskTransactionsRes,
        probabilityTrendRes,
        highRiskClientsRes,
        modelPerformanceRes,
        ageRiskDataRes,
        geographicRiskRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/metrics`),
        axios.get(`${API_BASE_URL}/risk-distribution`),
        axios.get(`${API_BASE_URL}/high-risk-transactions?limit=10`),
        axios.get(`${API_BASE_URL}/probability-trend?days=30`),
        axios.get(`${API_BASE_URL}/high-risk-clients?limit=10`),
        axios.get(`${API_BASE_URL}/model-performance`),
        axios.get(`${API_BASE_URL}/age-risk-correlation`),
        axios.get(`${API_BASE_URL}/geographic-risk?minTransactions=5&limit=10`)
      ]);

      setDashboardData({
        metrics: metricsRes.data,
        riskDistribution: riskDistributionRes.data,
        highRiskTransactions: highRiskTransactionsRes.data,
        probabilityTrend: probabilityTrendRes.data,
        highRiskClients: highRiskClientsRes.data,
        modelPerformance: modelPerformanceRes.data,
        ageRiskData: ageRiskDataRes.data,
        geographicRisk: geographicRiskRes.data
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard API error:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
          <button onClick={fetchDashboardData} className="retry-button">
            <FaSyncAlt /> Try Again
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
            <button onClick={fetchDashboardData} className="refresh-button">
              <FaSyncAlt /> Refresh
            </button>
            {lastUpdated && (
              <div className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
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

        {/* Charts Row 1 */}
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

        {/* Charts Row 2 */}
        <div className="dashboard-row">
          <div className="dashboard-card">
            <h2>Fraud Probability Trend (30 days)</h2>
            <div className="chart-container">
              {dashboardData.probabilityTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.probabilityTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip 
                      formatter={(value) => [(value * 100).toFixed(2) + '%', 'Avg Probability']}
                      labelFormatter={(value) => `Date: ${value}`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="avg_probability" 
                      fill="#83C5BE" 
                      name="Avg Probability"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState 
                  icon={<FaDatabase size={48} />} 
                  message="No trend data available" 
                />
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Age vs. Fraud Risk</h2>
            <div className="chart-container">
              {dashboardData.ageRiskData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.ageRiskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="current_age" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip 
                      formatter={(value) => [(value * 100).toFixed(2) + '%', 'Avg Risk']}
                      labelFormatter={(value) => `Age: ${value}`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="avg_risk" 
                      fill="#FFDDD2" 
                      name="Avg Risk Score"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState 
                  icon={<FaDatabase size={48} />} 
                  message="No age correlation data available" 
                />
              )}
            </div>
          </div>
        </div>

        {/* Data Tables */}
        <div className="dashboard-row">
          <div className="dashboard-card full-width">
            <div className="table-header">
              <h2>Recent High-Risk Transactions</h2>
              <button 
                onClick={() => axios.get(`${API_BASE_URL}/high-risk-transactions?limit=10`)
                  .then(res => setDashboardData(prev => ({
                    ...prev,
                    highRiskTransactions: res.data
                  })))}
                className="refresh-sm"
              >
                <FaSyncAlt /> Refresh
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

        <div className="dashboard-row">
          <div className="dashboard-card full-width">
            <div className="table-header">
              <h2>Highest Risk Clients</h2>
              <button 
                onClick={() => axios.get(`${API_BASE_URL}/high-risk-clients?limit=10`)
                  .then(res => setDashboardData(prev => ({
                    ...prev,
                    highRiskClients: res.data
                  })))}
                className="refresh-sm"
              >
                <FaSyncAlt /> Refresh
              </button>
            </div>
            <div className="table-container">
              {dashboardData.highRiskClients.length > 0 ? (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Client ID</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Highest Risk Score</th>
                      <th>Transaction Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.highRiskClients.map((client, index) => (
                      <tr key={index}>
                        <td>{client.id}</td>
                        <td>{client.current_age}</td>
                        <td>{client.gender}</td>
                        <td className={client.highest_risk_score > 0.7 ? 'high-risk' : ''}>
                          {(client.highest_risk_score * 100).toFixed(2)}%
                        </td>
                        <td>{client.transaction_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState 
                  icon={<FaTable size={48} />} 
                  message="No high-risk clients found" 
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