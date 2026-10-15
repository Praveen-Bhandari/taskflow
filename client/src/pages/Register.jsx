import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: '80px auto' }}>
      <h2>Register</h2>
      <form onSubmit={onSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={onChange} required />
        <br /><br />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <br /><br />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required />
        <br /><br />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Please wait...' : 'Register'}</button>
      </form>
      <p>Account hai? <Link to="/login">Login</Link></p>
    </div>
  );
}