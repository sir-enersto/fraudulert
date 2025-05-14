import { useState, useEffect } from 'react';
import MainNavbar from '../components/MainNavbar';
import WelcomePopup from '../components/WelcomePopup';

const Dashboard = () => {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if we should show welcome popup
    const shouldShowWelcome = localStorage.getItem('showWelcome') === 'true';
    if (shouldShowWelcome) {
      setShowWelcome(true);
      // Clear the flag so it doesn't show again
      localStorage.removeItem('showWelcome');
      // Mark as seen for future logins
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

  const handleWelcomeClose = () => {
    setShowWelcome(false);
  };

  return (
    <div className="page-container">
      <MainNavbar />
      {showWelcome && <WelcomePopup onClose={handleWelcomeClose} />}
      
      <h1>Dashboard</h1>
      {/* Your dashboard content here */}
    </div>
  );
};

export default Dashboard;