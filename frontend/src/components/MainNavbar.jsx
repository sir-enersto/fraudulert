import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import logo from '../assets/logo.png';
import '../assets/styles/MainNav.css';

const MainNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await signOut(auth);
        navigate("/", { replace: true });
        window.location.reload();
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
  };

  return (
    <>
      <nav className="main-nav">
        {/* Mobile Menu Toggle Button - Add this right after nav opening tag */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <div className="nav-brand">
          <Link to="/dashboard">
            <img src={logo} alt="Logo" className="nav-logo" />
          </Link>
        </div>

        {/* Updated nav-links with mobile-open class */}
        <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/accounts" className="nav-link">Accounts</Link>
          <Link to="/transactions" className="nav-link">Transactions</Link>
          <Link to="/alerts" className="nav-link">Alerts</Link>
        </div>

        <div className="user-menu">
          <button 
            className="user-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            User
            <span className={`dropdown-arrow ${isMenuOpen ? "open" : ""}`}>▼</span>
          </button>

          {isMenuOpen && (
            <div className="dropdown-menu">
              <Link to="/accountsettings" className="dropdown-item">Account Settings</Link>
              <Link to="/adminprofile" className="dropdown-item">Admin Profile</Link>
              <div className="dropdown-divider" />
              <button 
                className="dropdown-item logout" 
                onClick={() => {
                  setShowLogoutModal(true);
                  setIsMenuOpen(false);
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <h3>Logout Confirmation</h3>
            <p>Are you sure you want to log out?</p>
            <div className="modal-buttons">
              <button 
                className="modal-btn cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn confirm-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MainNavbar;