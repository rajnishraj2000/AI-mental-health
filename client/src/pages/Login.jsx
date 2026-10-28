import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { loginWithGoogle, loginAsDemo } = useAuth();
  const [error, setError] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSuccess = async (res) => {
    setError('');
    try {
      await loginWithGoogle(res);
    } catch (err) {
      setError(err.message || 'Google login failed');
    }
  };

  const handleDemo = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await loginAsDemo();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="logo" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
          <span className="logo-icon">🧠</span>
          <span className="logo-text">MindCare<span className="logo-ai">AI</span></span>
        </Link>

        <div className="glass-card auth-card" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '.5rem' }}>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to continue your wellness journey</p>

          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setError('Google login failed. Please try again.')}
              theme="filled_black"
              shape="pill"
              text="signin_with"
              size="large"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-muted, #888)' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ padding: '0 10px', fontSize: '0.8rem' }}>OR FOR LOCAL TESTING</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDemo}
            disabled={demoLoading}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {demoLoading ? 'Signing in...' : '⚡ Continue with Demo Account (Skip Google OAuth)'}
          </button>

          <p className="auth-footer">Don't have an account? <Link to="/register">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
}
