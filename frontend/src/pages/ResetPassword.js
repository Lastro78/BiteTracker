import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token,
        new_password: formData.newPassword
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Invalid link</h2>
            <p>This reset link is missing or invalid. Please request a new one.</p>
          </div>
          <div className="auth-footer">
            <Link to="/forgot-password" className="auth-link">Request new link</Link>
            <Link to="/login" className="auth-link" style={{ marginLeft: 16 }}>Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Password reset</h2>
            <p>Your password has been updated. You can now sign in.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary auth-btn"
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Set new password</h2>
          <p>Enter and confirm your new password.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">New password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input"
              placeholder="Confirm new password"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={loading}
          >
            <Lock size={20} />
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
