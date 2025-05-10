import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import MainNavbar from "../components/MainNavbar";
import "../assets/styles/Transactions.css";

const Transactions = () => {
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      user: "John Doe",
      date: "2025-05-01",
      amount: 420.75,
      type: "Purchase",
      risk: "High",
    },
    {
      id: 2,
      user: "Jane Smith",
      date: "2025-04-29",
      amount: 150.00,
      type: "Withdrawal",
      risk: "Low",
    },
    // Add more fake data as needed
  ]);

  return (
    <div className="transactions-container">
      <MainNavbar />
      <div className="transactions-header">
        <h2>Transactions</h2>
        <div className="controls">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by user or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <input className="date-filter" type="date" />
          <select className="type-filter">
            <option value="">All Types</option>
            <option value="Purchase">Purchase</option>
            <option value="Withdrawal">Withdrawal</option>
            <option value="Transfer">Transfer</option>
          </select>
        </div>
      </div>

      <div className="transactions-table-container">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Date</th>
              <th>Amount (BWP)</th>
              <th>Type</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {transactions
              .filter((txn) =>
                txn.user.toLowerCase().includes(search.toLowerCase())
              )
              .map((txn) => (
                <tr key={txn.id}>
                  <td>{txn.user}</td>
                  <td>{txn.date}</td>
                  <td>{txn.amount.toFixed(2)}</td>
                  <td>{txn.type}</td>
                  <td className={`risk-tag ${txn.risk.toLowerCase()}`}>
                    {txn.risk}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
