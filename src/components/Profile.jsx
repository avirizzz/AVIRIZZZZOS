import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import '../styles/Profile.css';

const Profile = () => {
  const { user, login, signup, logout, updateUserProfile } = useContext(AppContext);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        // Login
        await login(formData.email, formData.password);
      } else {
        // Signup
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await signup(formData.email, formData.password, formData.displayName);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <motion.div 
      className="component-container profile-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {user ? (
        <div className="profile-content">
          <div className="profile-header">
            <h2>Your Profile</h2>
            <p>Manage your account and settings</p>
          </div>
          
          <div className="profile-card">
            <div className="profile-avatar">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">
                  {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                </div>
              )}
            </div>
            
            <div className="profile-info">
              <h3>{user.displayName || 'User'}</h3>
              <p>{user.email}</p>
              <p className="joined-date">Joined: {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</p>
            </div>
            
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
          
          <div className="profile-stats">
            <h3>Your Progress</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Habits Tracked</span>
                <span className="stat-value">12</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completed Tasks</span>
                <span className="stat-value">48</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Current Streak</span>
                <span className="stat-value">7 days</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Best Streak</span>
                <span className="stat-value">14 days</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="auth-container">
          <div className="auth-card">
            <h2>{isLogin ? 'Login' : 'Create Account'}</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="displayName">Display Name</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    required={!isLogin}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={!isLogin}
                  />
                </div>
              )}
              
              <button 
                type="submit" 
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
              </button>
            </form>
            
            <div className="auth-switch">
              <p>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                  type="button"
                  className="switch-button"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Profile;