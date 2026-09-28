import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try { await login(email, password); nav('/'); }
    catch (err) { setError(err.message); }
  };

  return (
    <>
      <h1>Login</h1>
      <form className="form" onSubmit={submit}>
        {error && <div className="alert error">{error}</div>}
        <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" required /></label>
        <label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" required /></label>
        <button className="btn" type="submit">Login</button>
      </form>
      <p className="muted mt">No account? <Link to="/register" style={{ textDecoration: 'underline' }}>Sign up</Link></p>
      <div className="alert info mt" style={{ maxWidth: 460 }}>
        Demo accounts — organizer: <b>organizer@demo.np</b> / organizer123 ·
        fan: <b>fan@demo.np</b> / fan12345
      </div>
    </>
  );
}
