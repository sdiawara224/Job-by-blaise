import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { api, fmtDate } from '../api.js';

const STATUS_CLASS = {
  'En attente': 'pending',
  'En cours': 'progress',
  'Acceptée': 'accepted',
  'Refusée': 'rejected',
};

export default function Applications() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  const load = () => api('/applications').then(setData).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  if (err) return <div className="page-loader">{err}</div>;
  if (!data) return <div className="page-loader">Chargement des candidatures…</div>;

  const withdraw = async (id) => {
    if (!window.confirm('Retirer cette candidature ?')) return;
    try {
      await api(`/applications/${id}`, { method: 'DELETE' });
      load();
    } catch (ex) {
      setErr(ex.message);
    }
  };

  return (
    <div className="dash">
      <div className="page-title-row">
        <div>
          <h1>Mes candidatures</h1>
          <p className="muted">Suis chaque étape, de l’envoi à la réponse.</p>
        </div>
        <Link to="/app/offres" className="btn btn-outline">Chercher d’autres offres →</Link>
      </div>

      <div className="mini-stats wide">
        <div><b>{data.stats.total}</b><span>Total</span></div>
        <div><b>{data.stats.pending}</b><span>En attente</span></div>
        <div><b>{data.stats.inProgress}</b><span>En cours</span></div>
        <div><b>{data.stats.accepted}</b><span>Acceptées</span></div>
      </div>

      {data.applications.length ? (
        <div className="app-list">
          {data.applications.map((a) => (
            <div className="app-row card" key={a.id}>
              <div className="company-avatar" style={{ background: a.company.color }}>
                {a.company.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="app-row-main">
                <Link to={`/app/offres/${a.jobId}`} className="app-row-title">{a.title}</Link>
                <p className="muted">{a.company.name} · {a.city} · {a.contract}</p>
                <p className="muted small">Postulée {fmtDate(a.createdAt)}</p>
              </div>
              <div className="app-row-actions">
                <span className={`status ${STATUS_CLASS[a.status] || 'pending'}`}>{a.status}</span>
                <button className="link-btn danger" onClick={() => withdraw(a.id)}>Retirer</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty empty-lg card">
          <Icon name="apps" size={34} />
          <b>Tu n’as pas encore postulé</b>
          <p>Explore les offres à fort matching et postule en un clic.</p>
          <Link to="/app/offres" className="btn btn-primary">Voir les offres recommandées</Link>
        </div>
      )}
    </div>
  );
}
