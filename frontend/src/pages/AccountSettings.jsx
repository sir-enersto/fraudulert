import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import axios from 'axios';
import '../assets/styles/AccountSettings.css';

const AccountSettings = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    organisation: ''
  });

  // Create axios instance (optional but recommended)
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

  // Fetch user data from PostgreSQL backend
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await axios.get('/users/me', {  // Removed duplicate /api
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserData(response.data);
          setEditData({
            username: response.data.username,
            organisation: response.data.organisation
          });
        } catch (err) {
          console.error('API Error:', err.response?.data || err.message);
          setError('Failed to fetch user data');
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      return setError("Passwords don't match");
    }

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = await user.getIdToken();
      await axios.patch('/users/me', editData, {  // Removed duplicate /api
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUserData(prev => ({ ...prev, ...editData }));
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Update Error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  return (
    <div className="account-settings-container">
      <button 
        onClick={() => navigate(-1)} 
        className="back-button"
      >
        &larr; Back
      </button>

      <div className="account-settings-card">
        <h2>Account Settings</h2>

        {/* User Info Section */}
        <div className="settings-section">
          <div className="section-header">
            <h3>Profile Information</h3>
            {!isEditing ? (
              <button 
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button 
                  className="cancel-button"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button 
                  className="save-button"
                  onClick={handleProfileUpdate}
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {userData ? (
            isEditing ? (
              <form className="edit-form">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData({...editData, username: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Organization</label>
                  <input
                    type="text"
                    value={editData.organisation}
                    onChange={(e) => setEditData({...editData, organisation: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={userData.role}
                    disabled
                  />
                </div>
              </form>
            ) : (
              <div className="user-info">
                <p><strong>Name:</strong> {userData.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Organization:</strong> {userData.organisation}</p>
                <p><strong>Role:</strong> <span className="role-badge">{userData.role}</span></p>
              </div>
            )
          ) : (
            <div className="loading-info">Loading user data...</div>
          )}
        </div>

        {/* Password Update Section */}
        <div className="settings-section">
          <h3>Change Password</h3>
          <form onSubmit={handlePasswordUpdate}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="6"
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <button type="submit" className="update-button">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;