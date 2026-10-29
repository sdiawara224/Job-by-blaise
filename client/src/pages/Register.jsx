import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', city: 'Conakry', password: '',
  });
  const [cities, setCities] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/jobs/meta').then((m) => setCities(m.allCities || [])).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await register(form);
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
        <h1>Crée ton compte Job by blaise</h1>
        <p className="muted">5 minutes pour ton profil — puis reçois les offres faites pour toi.</p>

        <form onSubmit={submit} className="form">
          <label>Nom complet</label>
          <input required autoFocus value={form.fullName} onChange={set('fullName')} placeholder="Ex. Mariama Camara" />
          <div className="form-row">
            <div>
              <label>E-mail</label>
              <input type="email" required value={form.email} onChange={set('email')} placeholder="toi@exemple.com" />
            </div>
            <div>
              <label>Téléphone</label>
              <input value={form.phone} onChange={set('phone')} placeholder="+224 6XX XXX XXX" />
            </div>
          </div>
          <div className="form-row">
            <div>
              <label>Ville</label>
              <select value={form.city} onChange={set('city')}>
                {(cities.length ? cities : ['Conakry']).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Mot de passe</label>
              <input type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="6 caractères min." />
            </div>
          </div>
          {err && <div className="form-error">{err}</div>}
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? 'Création…' : 'Créer mon compte gratuit'}
          </button>
        </form>

        <p className="auth-switch">
          Déjà inscrit(e) ? <Link to="/connexion">Se connecter</Link>
        </p>
        <Link to="/" className="link-btn center">← Retour à l’accueil</Link>
      </div>
    </div>
  );
}
