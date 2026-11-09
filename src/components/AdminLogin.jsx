import { useState } from 'react';
import { adminLogin } from '../services/admin';

export default function AdminLogin({ onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await adminLogin(username, password);

      if (!result.success) {
        throw new Error(result.message || 'Login gagal.');
      }

      sessionStorage.setItem('admin_token', result.token);
      sessionStorage.setItem('admin_expires_at', result.expires_at);

      onLoginSuccess(result.token);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-overlay" onClick={onClose}>
      <div className="admin-login-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="admin-login-close" onClick={onClose}>
          ×
        </button>

        <div className="admin-login-icon">✦</div>

        <h2>Admin Login</h2>
        <p>Sign in to manage your orders</p>

        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            autoComplete="username"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />

          {error && <div className="admin-login-error">{error}</div>}

          <button
            type="submit"
            className="admin-login-submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
