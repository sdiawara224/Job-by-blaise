import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../auth.jsx';

export default function Login({ adminMode = false }) {
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
      const signedIn = await login(form.email, form.password);
      if (adminMode && !signedIn.isAdmin) {
        setErr('Ce compte ne possède pas de droits d’administration.');
        return;
      }
      nav(adminMode || signedIn.isAdmin ? '/admin' : '/app', { replace: true });
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
        <h1>{adminMode ? 'Votre espace de pilotage' : 'Bon retour parmi nous 👋'}</h1>
        <p className="muted">{adminMode ? "Connectez-vous avec votre compte administrateur pour gérer Job by blaise." : "Connecte-toi pour retrouver tes offres, candidatures et alertes SMS."}</p>

        <form onSubmit={submit} className="form" aria-busy={busy}>
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email" type="email" required autoFocus autoComplete="username"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="toi@exemple.com"
          />
          <label htmlFor="login-password">Mot de passe</label>
          <input
            id="login-password" type="password" required autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
          {err && <div className="form-error" role="alert">{err}</div>}
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        {!adminMode && <div className="demo-box">
          <b>Compte de démonstration</b>
          <code>mamadou@jobbyblaise.com</code>
          <code>demo1234</code>
          <button
            type="button" className="link-btn"
            onClick={() => setForm({ email: 'mamadou@jobbyblaise.com', password: 'demo1234' })}
          >
            Pré-remplir →
          </button>
        </div>}

        <p className="auth-switch">
          {adminMode ? <Link to="/">← Retour au site public</Link> : <>Pas encore de compte ? <Link to="/inscription">Créer un compte gratuitement</Link></>}
        </p>
        {!adminMode && <Link to="/" className="link-btn center">← Retour à l’accueil</Link>}
        {loc.state?.from && <p className="muted small center">Connecte-toi pour continuer.</p>}
      </div>
    </div>
  );
}
