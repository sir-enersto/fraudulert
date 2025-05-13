import { useState, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import axios from 'axios';
import { FiUser, FiMail, FiKey, FiTrash2, FiUsers, FiPlus } from 'react-icons/fi';
import '../assets/styles/AdminProfile.css'

const AdminProfile = () => {
  const auth = getAuth();
  const adminUser = auth.currentUser;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    role: 'viewer'
  });

  const api = axios.create({
    baseURL: 'http://localhost:5000/api'
  });

  // Fetch all users in admin's organization
  const fetchUsers = async () => {
    try {
      const token = await adminUser.getIdToken();
      const response = await axios.get('/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users');
      setTimeout(() => setError(''), 3000);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Create new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const randomPassword = Math.random().toString(36).slice(-10);
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        newUser.email, 
        randomPassword
      );

      const token = await adminUser.getIdToken();
      await axios.post('/users', {
        firebase_uid: userCredential.user.uid,
        email: newUser.email,
        username: newUser.username,
        organisation: adminUser.organisation,
        role: newUser.role,
        created_by: adminUser.uid
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await sendPasswordResetEmail(auth, newUser.email);
      
      setSuccess('User created! Password reset email sent');
      setNewUser({ email: '', username: '', role: 'viewer' });
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (uid) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    
    try {
      const token = await adminUser.getIdToken();
      const response = await axios.delete(`/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.message) {
        setSuccess(`${response.data.message} (Firebase & PostgreSQL)`);
        fetchUsers();
      } else {
        setError(response.data.error || 'Deletion completed with warnings');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.details 
        ? `Firebase error: ${err.response.data.details}`
        : 'Failed to delete user';
      setError(errorMsg);
    } finally {
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
    }
  };

  return (
    <div className="admin-container">
      {/* Floating alerts */}
      {error && (
        <div className="floating-alert error">
          {error}
        </div>
      )}
      {success && (
        <div className="floating-alert success">
          {success}
        </div>
      )}

      <div className="admin-content">
        <h1 className="admin-title">
          <FiUsers className="title-icon" /> User Management
        </h1>
        
        <div className="admin-card">
          <h2 className="card-header">
            <FiPlus className="header-icon" /> Create New User
          </h2>
          
          <form onSubmit={handleCreateUser} className="user-form">
            <div className="input-group">
              <FiMail className="input-icon" />
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="form-input"
                placeholder="Enter user email"
                required
              />
            </div>
            
            <div className="input-group">
              <FiUser className="input-icon" />
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                className="form-input"
                placeholder="Enter username"
                required
              />
            </div>
            
            <div className="input-group">
              <FiKey className="input-icon" />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className="form-input"
              >
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="primary-btn"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>

        <div className="admin-card">
          <h2 className="card-header">
            <FiUsers className="header-icon" /> Organization Users
          </h2>
          
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.firebase_uid}>
                    <td>{user.username || 'N/A'}</td>
                    <td>{user.email}</td>
                    <td className={`role-badge role-${user.role}`}>
                      {user.role}
                    </td>
                    <td>
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleString() 
                        : 'Never logged in'}
                    </td>
                    <td>
                      {user.role !== 'admin' && (
                        <button 
                          onClick={() => handleDeleteUser(user.firebase_uid)}
                          className="danger-btn"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;