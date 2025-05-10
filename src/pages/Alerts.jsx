import { useState } from 'react';
import { FaSearch, FaTrash } from 'react-icons/fa';
import MainNavbar from '../components/MainNavbar';
import "../assets/styles/Alerts.css";

const Alerts = () => {
  // Sample data
  const [alerts, setAlerts] = useState([
    { id: 1, account: '•••• 4582', type: 'Unusual withdrawal', date: '2023-06-15', status: 'Pending', amount: '1,250.00' },
    { id: 2, account: '•••• 3267', type: 'Multiple logins', date: '2023-06-14', status: 'Reviewed', amount: '0.00' },
    { id: 3, account: '•••• 9821', type: 'Foreign transaction', date: '2023-06-13', status: 'Pending', amount: '89.99' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.account.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         alert.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  // Delete alert
  const handleDelete = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  return (
    <div className="alerts-page">
      <MainNavbar/>
      <div className="alerts-header">
        <h2>Fraud Alerts</h2>
        <div className="controls">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-dropdown"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Reviewed">Reviewed</option>
          </select>
        </div>
      </div>

      <div className="alerts-table-container">
        <table className="alerts-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Alert Type</th>
              <th>Date</th>
              <th>Amount (BWP)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.map(alert => (
              <tr key={alert.id}>
                <td>{alert.account}</td>
                <td>{alert.type}</td>
                <td>{alert.date}</td>
                <td>{alert.amount}</td>
                <td>
                  <span className={`status-badge ${alert.status.toLowerCase()}`}>
                    {alert.status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleDelete(alert.id)}
                    className="delete-btn"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Alerts;