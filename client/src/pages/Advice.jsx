import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../api.js';

const CATS = ['', 'CV', 'Entretien', 'Alertes SMS', 'Carrière'];

export default function Advice({ inApp = false }) {
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    api('/advice').then((d) => setItems(d.advice)).catch(() => {});
    document.title = 'Conseils carrière | Job by blaise';
  }, []);

  const filtered = cat ? items.filter((a) => a.category === cat) : items;
  const base = inApp ? '/app/conseils' : '/conseils';

  return (
    <div className="page">
      {!inApp && <Navbar />}
      <section className="page-hero">
        <div className="container">
          <span className="kicker">Conseils carrière</span>
          <h1>Progresse à chaque étape de ta recherche</h1>
          <p>CV, entretien, salaire, alertes SMS : nos meilleures pratiques, concrètes et adaptées au marché ouest-africain.</p>
        </div>
      </section>

      <main className={`container section-tight ${inApp ? 'in-app-main' : ''}`}>
        <div className="cat-tabs">
          {CATS.map((c) => (
            <button key={c || 'all'} className={`cat-tab ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
              {c || 'Tous'}
            </button>
          ))}
        </div>
        <div className="advice-grid reveal stagger">
          {filtered.map((a) => (
            <Link to={`${base}/${a.id}`} className="advice-card" key={a.id}>
              <span className="advice-cat" style={{ background: `${a.color}1a`, color: a.color }}>{a.category}</span>
              <h3>{a.title}</h3>
              <p>{a.excerpt}</p>
              <span className="advice-more" style={{ color: a.color }}>
                <Icon name="clock" size={13} /> {a.minutes} min de lecture →
              </span>
            </Link>
          ))}
          {!filtered.length && <div className="empty">Chargement des conseils…</div>}
        </div>
      </main>

      {!inApp && (
        <section className="section final-cta">
          <div className="container final-cta-inner">
            <h2>Applique ces conseils concrètement</h2>
            <p>Crée ton profil, active tes alertes SMS et postule aux offres à fort matching.</p>
            <div className="final-cta-actions">
              <Link to="/inscription" className="btn btn-white btn-xl">Créer mon compte</Link>
              <button className="btn btn-ghost-light btn-xl" onClick={() => nav('/jobs')}>Voir les offres →</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
