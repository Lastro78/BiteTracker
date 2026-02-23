import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail } from 'lucide-react';
import './Login.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      setSuccess(true);
      if (data.reset_link) setResetLink(data.reset_link);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Check your email</h2>
            <p>If an account exists with that email, we&apos;ve sent a reset link.</p>
          </div>
          {resetLink && (
            <div className="auth-success" style={{ marginTop: 16 }}>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>For testing, use this link:</p>
              <a href={resetLink} className="auth-link" style={{ wordBreak: 'break-all' }}>
                Reset password
              </a>
            </div>
          )}
          <div className="auth-footer" style={{ marginTop: 24 }}>
            <Link to="/login" className="auth-link">Back to Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Forgot password</h2>
          <p>Enter your account email and we&apos;ll send you a reset link.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={loading}
          >
            <Mail size={20} />
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
