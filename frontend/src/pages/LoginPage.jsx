import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'operator',
    companyName: 'SKR-Global'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let loggedInUser;
      if (isRegister) {
        loggedInUser = await register(form);
      } else {
        loggedInUser = await login(form.email, form.password);
      }
      navigate(loggedInUser?.role === 'customs' ? '/customs' : '/');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-wrapper">
      <section className="auth-card">
        <h1>{isRegister ? 'Create SKR-Global Account' : 'Sign In to SKR-Global'}</h1>
        <p className="muted">Marine Logistics Import & Export Operations Platform</p>

        {error && <div className="alert error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="stack-form">
          {isRegister && (
            <>
              <div>
                <label htmlFor="fullName">Full Name</label>
                <input id="fullName" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div>
                <label htmlFor="companyName">Organisation</label>
                <input id="companyName" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div>
                <label htmlFor="role">Operational Role</label>
                <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="operator">Logistics Operator</option>
                  <option value="customs">Customs Clearance Officer</option>
                  <option value="client">Importer / Exporter Client</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email">Work Email</label>
            <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          <div>
            <label htmlFor="password">Password (min 8 chars)</label>
            <input id="password" type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Please wait...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        <button type="button" className="link-toggle" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already registered? Sign in' : 'Need an account? Register here'}
        </button>
      </section>
    </main>
  );
}
