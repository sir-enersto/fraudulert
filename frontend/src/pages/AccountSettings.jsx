import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import '../assets/styles/AccountSettings.css';

const AccountSettings = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    organization: ''
  });

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
            setEditData({
              name: userDoc.data().name,
              organization: userDoc.data().organization
            });
          }
        } catch (err) {
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
      await updateDoc(doc(db, 'users', user.uid), {
        name: editData.name,
        organization: editData.organization
      });
      setUserData(prev => ({ ...prev, ...editData }));
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
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
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
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
                    value={editData.organization}
                    onChange={(e) => setEditData({...editData, organization: e.target.value})}
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
                <p><strong>Name:</strong> {userData.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Organization:</strong> {userData.organization}</p>
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
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
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