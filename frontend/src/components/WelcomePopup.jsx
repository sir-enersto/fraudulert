import { FaTimes, FaFileUpload, FaRobot, FaUserShield, FaBell } from 'react-icons/fa';
import { useEffect } from 'react';
import '../assets/styles/WelcomePopup.css'

const WelcomePopup = ({ onClose }) => {
  useEffect(() => {
    localStorage.setItem('hasSeenWelcome', 'true');
  }, []);

  return (
    <div className="welcome-overlay">
      <div className="welcome-popup">
        <button onClick={onClose} className="close-button">
          <FaTimes className="close-icon" />
        </button>
        
        <h2 className="welcome-title">Welcome to Fraudulert!</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <FaFileUpload className="feature-icon" />
            <div>
              <h3>Upload in CSV/JSON</h3>
              <p className="feature-description">Import transaction data easily</p>
            </div>
          </div>

          <div className="feature-card">
            <FaRobot className="feature-icon" />
            <div>
              <h3>2 Detection Models</h3>
              <p className="feature-description">Choose between algorithms</p>
            </div>
          </div>

          <div className="feature-card">
            <FaUserShield className="feature-icon" />
            <div>
              <h3>Role-Based Access</h3>
              <p className="feature-description">Admin and viewer roles</p>
            </div>
          </div>

          <div className="feature-card">
            <FaBell className="feature-icon" />
            <div>
              <h3>Alerts</h3>
              <p className="feature-description">Get notified of fraud</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="continue-button"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomePopup;