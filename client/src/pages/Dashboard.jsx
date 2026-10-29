import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import MatchRing from '../components/MatchRing.jsx';
import JobCard from '../components/JobCard.jsx';
import { api } from '../api.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const nav = useNavigate();

  const load = () => api('/dashboard').then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  if (!data) return <div className="page-loader">Chargement de ton espace…</div>;

  const first = (data.greeting.fullName || '').split(' ')[0];
  const rec = data.recommended || [];
  const best = rec[0];
  const search = (e) => {
    e.preventDefault();
    nav(`/app/offres${q ? `?search=${encodeURIComponent(q)}` : ''}`);
  };

  return (
    <div className="dash">
      <section className="dash-hero card reveal">
        <div className="dash-hero-copy">
          <h1>Bonjour {first} 👋</h1>
          <p>De nouvelles opportunités t’attendent en Guinée.</p>
          <form className="dash-search" onSubmit={search}>
            <Icon name="search" size={17} />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un emploi, une entreprise…"
            />
            <span className="dash-loc"><Icon name="pin" size={14} /> {data.greeting.city}</span>
            <button className="btn btn-primary" type="submit" aria-label="Rechercher">
              <Icon name="search" size={16} />
            </button>
          </form>
        </div>
        <div className="dash-hero-stats">
          <div className="dash-stat">
            <b>{data.applications.total}</b>
            <span>candidature{data.applications.total > 1 ? 's' : ''}</span>
          </div>
          <div className="dash-stat">
            <b>{data.applications.accepted}</b>
            <span>acceptée{data.applications.accepted > 1 ? 's' : ''}</span>
          </div>
          <div className="dash-stat">
            <b>{data.unreadSms}</b>
            <span>SMS non lu{data.unreadSms > 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>

      <div className="dash-grid">
        <div className="dash-main">
          <section className="dash-block">
            <div className="block-head">
              <h2><Icon name="star" size={18} /> Offres d’emploi pour toi</h2>
              <Link to="/app/offres" className="link-btn">Toutes les offres →</Link>
            </div>
            <div className="jobs-grid reveal stagger">
              {rec.map((j) => <JobCard key={j.id} job={j} to={`/app/offres/${j.id}`} />)}
              {!rec.length && <div className="empty">Aucune recommandation pour l’instant — complète ton profil.</div>}
            </div>
          </section>

          <section className="dash-block">
            <div className="block-head">
              <h2><Icon name="sms" size={18} /> Ta dernière alerte SMS</h2>
              <Link to="/app/alertes" className="link-btn">Gérer mes alertes →</Link>
            </div>
            <div className={`sms-mini ${data.alertsEnabled ? '' : 'off'}`}>
              <div className="sms-mini-icon"><Icon name="bell" size={20} /></div>
              <div>
                <b>
                  {data.alertsEnabled
                    ? `Alerte active — tous les jours à ${data.alertsTime}`
                    : 'Alertes SMS désactivées'}
                </b>
                <p>{data.lastSms ? data.lastSms.body : 'Active ton alerte pour recevoir les offres du matin.'}</p>
              </div>
              <Link to="/app/alertes" className="btn btn-outline btn-sm">
                {data.lastSms ? 'Voir' : 'Activer'}
              </Link>
            </div>
          </section>

          <section className="dash-block">
            <div className="block-head">
              <h2><Icon name="advice" size={18} /> Conseils du moment</h2>
              <Link to="/app/conseils" className="link-btn">Tous les conseils →</Link>
            </div>
            <div className="mini-advice-row reveal stagger">
              <Link to="/app/conseils/1" className="mini-advice">📝 Rédiger un CV qui décroche un entretien</Link>
              <Link to="/app/conseils/3" className="mini-advice">⏰ Recevoir les alertes SMS 7h00</Link>
              <Link to="/app/conseils/5" className="mini-advice">🎯 Stratégie 30 jours pour trouver un emploi</Link>
            </div>
          </section>
        </div>

        <aside className="dash-aside">
          <div className="card profile-score-card">
            <div className="block-head">
              <h2>Mon profil</h2>
              <Link to="/app/profil" className="link-btn">Modifier</Link>
            </div>
            <div className="profile-score-top">
              <MatchRing score={data.completion.percent} size={84} stroke={7} />
              <div>
                <b>Profil à {data.completion.percent}%</b>
                <p>{data.completion.percent >= 85 ? 'Ton profil est visible et complet.' : 'Complète-le pour plus de matchs.'}</p>
              </div>
            </div>
            <ul className="checklist">
              {data.completion.checks.map((c) => (
                <li key={c.id} className={c.done ? 'done' : 'todo'}>
                  <span className="check-ic">{c.done ? '✓' : '○'}</span> {c.label}
                </li>
              ))}
            </ul>
            <Link to="/app/profil" className="btn btn-primary btn-block">
              {data.completion.percent >= 85 ? 'Voir mon profil' : 'Compléter mon profil'}
            </Link>
          </div>

          <div className="card">
            <div className="block-head">
              <h2><Icon name="apps" size={17} /> Mes candidatures</h2>
            </div>
            <div className="mini-stats">
              <div><b>{data.applications.pending}</b><span>En attente</span></div>
              <div><b>{data.applications.inProgress}</b><span>En cours</span></div>
              <div><b>{data.applications.accepted}</b><span>Acceptées</span></div>
            </div>
            <Link to="/app/candidatures" className="btn btn-outline btn-block">Suivre mes candidatures</Link>
          </div>

          {best && (
            <div className="card best-match">
              <span className="best-match-tag">🔥 Meilleur match du jour</span>
              <b>{best.title}</b>
              <p>{best.company?.name} · {best.city}</p>
              <div className="best-match-row">
                <MatchRing score={best.match.score} size={54} stroke={5} label={false} />
                <Link to={`/app/offres/${best.id}`} className="btn btn-primary btn-sm">Voir l'offre →</Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
