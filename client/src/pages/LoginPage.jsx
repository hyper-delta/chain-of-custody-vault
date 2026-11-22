import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  if (user) return <Navigate to={location.state?.from?.pathname || '/items'} replace />;
  const submit = async (event) => {
    event.preventDefault(); setError('');
    try { await (mode === 'login' ? login(form.email, form.password) : register(form)); }
    catch (err) { setError(err.response?.data?.error?.message || 'Unable to continue.'); }
  };
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  return <section className="card" style={{maxWidth: 420, margin: '3rem auto'}}>
    <h1>{mode === 'login' ? 'Sign in' : 'Register'}</h1>
    {error && <p className="error">{error}</p>}
    <form onSubmit={submit}>
      {mode === 'register' && <label>Name<input name="name" value={form.name} onChange={change} required /></label>}<br />
      <label>Email<input type="email" name="email" value={form.email} onChange={change} required /></label><br />
      <label>Password<input type="password" name="password" value={form.password} onChange={change} minLength={mode === 'register' ? 8 : 1} required /></label><br />
      <button type="submit">{mode === 'login' ? 'Sign in' : 'Create Collector account'}</button>
    </form>
    <button className="secondary" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
      {mode === 'login' ? 'Create an account' : 'Already have an account?'}
    </button>
  </section>;
}
