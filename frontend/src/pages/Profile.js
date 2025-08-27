import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Edit, Save, X, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, changePassword, loading, error, clearError } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [successMessage, setSuccessMessage] = useState('');

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) clearError();
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) clearError();
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const result = await updateProfile(profileData);
    if (result.success) {
      setIsEditingProfile(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      clearError();
      return;
    }
    
    const result = await changePassword(passwordData.current_password, passwordData.new_password);
    if (result.success) {
      setIsChangingPassword(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const cancelProfileEdit = () => {
    setProfileData({
      full_name: user?.full_name || '',
      email: user?.email || ''
    });
    setIsEditingProfile(false);
    clearError();
  };

  const cancelPasswordChange = () => {
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setIsChangingPassword(false);
    clearError();
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!user) {
    return (
      <div className="container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={48} />
          </div>
          <h2>Profile Settings</h2>
          <p>Manage your account information and preferences</p>
        </div>

        {error && (
          <div className="profile-error">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="profile-success">
            {successMessage}
          </div>
        )}

        {/* Profile Information Section */}
        <div className="profile-section">
          <div className="section-header">
            <h3>Account Information</h3>
            {!isEditingProfile && (
              <button
                className="btn btn-secondary"
                onClick={() => setIsEditingProfile(true)}
              >
                <Edit size={16} />
                Edit
              </button>
            )}
          </div>

          {!isEditingProfile ? (
            <div className="profile-info">
              <div className="info-item">
                <label>Username</label>
                <span>{user.username}</span>
              </div>
              <div className="info-item">
                <label>Full Name</label>
                <span>{user.full_name || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <label>Email</label>
                <span>{user.email}</span>
              </div>
              <div className="info-item">
                <label>Member Since</label>
                <span>{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={profileData.full_name}
                  onChange={handleProfileChange}
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="form-input"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelProfileEdit}
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Password Change Section */}
        <div className="profile-section">
          <div className="section-header">
            <h3>Security</h3>
            {!isChangingPassword && (
              <button
                className="btn btn-secondary"
                onClick={() => setIsChangingPassword(true)}
              >
                <Lock size={16} />
                Change Password
              </button>
            )}
          </div>

          {isChangingPassword && (
            <form onSubmit={handlePasswordSubmit} className="profile-form">
              <div className="form-group">
                <label>Current Password</label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>New Password</label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordData.new_password && passwordData.confirm_password && 
                 passwordData.new_password !== passwordData.confirm_password && (
                  <span className="field-error">Passwords do not match</span>
                )}
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={16} />
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelPasswordChange}
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Theme Settings Section */}
        <div className="profile-section">
          <div className="section-header">
            <h3>Appearance</h3>
          </div>
          <div className="theme-toggle-container">
            <div className="theme-info">
              <span className="theme-label">Theme Mode</span>
              <span className="theme-description">
                {isDarkMode ? 'Dark mode for better visibility in low light' : 'Light mode for better readability'}
              </span>
            </div>
            <button
              className={`theme-toggle-btn ${isDarkMode ? 'dark' : 'light'}`}
              onClick={toggleTheme}
              title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="theme-text">
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
