import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ATTENDEE');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try { await register(name, email, password, role); nav('/'); }
    catch (err) { setError(err.message); }
  };

  return (
    <>
      <h1>Sign up</h1>
      <form className="form" onSubmit={submit}>
        {error && <div className="alert error">{error}</div>}
        <label>Name<input value={name} onChange={e => setName(e.target.value)} required /></label>
        <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" required /></label>
        <label>Password (min 6)<input value={password} onChange={e => setPassword(e.target.value)} type="password" required /></label>
        <label>I want to…
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="ATTENDEE">Buy tickets</option>
            <option value="ORGANIZER">Organize events</option>
          </select>
        </label>
        <button className="btn" type="submit">Create account</button>
      </form>
      <p className="muted mt">Have an account? <Link to="/login" style={{ textDecoration: 'underline' }}>Login</Link></p>
    </>
  );
}
