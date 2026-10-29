import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await login(form.email, form.password);
      nav('/app', { replace: true });
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <Logo />
        <h1>Bon retour parmi nous 👋</h1>
        <p className="muted">Connecte-toi pour retrouver tes offres, candidatures et alertes SMS.</p>

        <form onSubmit={submit} className="form">
          <label>E-mail</label>
          <input
            type="email" required autoFocus
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="toi@exemple.com"
          />
          <label>Mot de passe</label>
          <input
            type="password" required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
          {err && <div className="form-error">{err}</div>}
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="demo-box">
          <b>Compte de démonstration</b>
          <code>mamadou@jobbyblaise.com</code>
          <code>demo1234</code>
          <button
            type="button" className="link-btn"
            onClick={() => setForm({ email: 'mamadou@jobbyblaise.com', password: 'demo1234' })}
          >
            Pré-remplir →
          </button>
        </div>

        <p className="auth-switch">
          Pas encore de compte ? <Link to="/inscription">Créer un compte gratuitement</Link>
        </p>
        <Link to="/" className="link-btn center">← Retour à l’accueil</Link>
        {loc.state?.from && <p className="muted small center">Connecte-toi pour continuer.</p>}
      </div>
    </div>
  );
}
