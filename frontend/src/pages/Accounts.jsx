import React, { useState } from "react";
import { FaSearch, FaTrash, FaPlus, FaFileUpload } from "react-icons/fa";
import MainNavbar from "../components/MainNavbar";
import "../assets/styles/Accounts.css";

const Accounts = () => {
  const [search, setSearch] = useState("");
  const [accounts, setAccounts] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", transactions: 5 },
    { id: 2, name: "Jane Smith", email: "jane@example.com", transactions: 3 },
    // Add sample accounts or fetch dynamically
  ]);

  const handleDelete = (id) => {
    setAccounts(accounts.filter((account) => account.id !== id));
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
          <button className="add-btn">
            <FaPlus /> Add Account
          </button>
          <button className="csv-upload-btn">
            <FaFileUpload /> Upload CSV
          </button>
          <select className="filter-dropdown">
            <option value="">All Users</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="accounts-table-container">
        <table className="accounts-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Transactions</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {accounts
              .filter((acc) =>
                acc.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((acc) => (
                <tr key={acc.id}>
                  <td>
                    <a className="account-link" href={`/transactions/${acc.id}`}>
                      {acc.name}
                    </a>
                  </td>
                  <td>{acc.email}</td>
                  <td>{acc.transactions}</td>
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
      </div>
    </div>
  );
};

export default Accounts;
