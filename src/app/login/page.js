'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeSwitcher from '../components/ThemeSwitcher';


export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // default is user (candidate)
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { username, password } : { username, password, role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isLogin) {
        // Logged in successfully! Redirect to dashboard
        router.push('/');
        router.refresh();
      } else {
        // Registered successfully! Switch to login tab and prefill
        setIsLogin(true);
        setPassword('');
        setError('Registration successful! Please sign in with your credentials.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
        <ThemeSwitcher />
      </div>
      {/* Background glow effects */}
      <div className="login-glow sphere-1"></div>
      <div className="login-glow sphere-2"></div>

      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="login-logo">✨</div>
          <h2>AI Resume Analyzer</h2>
          <p>Optimize your resume alignment for modern applicant tracking systems</p>
        </div>

        {/* Tab Controls */}
        <div className="login-tabs">
          <button 
            type="button"
            className={`tab-btn ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`tab-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register
          </button>
        </div>

        {error && (
          <div className={`error-banner ${error.includes('successful') ? 'success-banner' : ''}`}>
            <span>{error.includes('successful') ? '✅' : '⚠️'}</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input 
              type="text" 
              id="username"
              className="textarea-field" 
              style={{ height: '45px' }}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              className="textarea-field" 
              style={{ height: '45px' }}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>


          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1.5rem' }}>
            {loading ? (
              <div className="spinner"></div>
            ) : isLogin ? (
              'Sign In to Dashboard'
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
