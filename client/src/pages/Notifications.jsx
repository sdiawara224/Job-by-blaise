import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { api, fmtDate } from '../api.js';
import { useCandidateActivity } from '../candidateActivity.jsx';

export default function Notifications() {
  const { data, refresh } = useCandidateActivity();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const read = async (body) => {
    setBusy(true); setError('');
    try { await api('/notifications/read', { method: 'POST', body }); await refresh(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  if (!data) return <div className="page-loader">Chargement des notifications…</div>;
  const messages = data.notifications || [];
  return <div className="dash">
    <div className="page-title-row"><div><h1>Mes notifications</h1><p className="muted">Suis les changements de statut de tes candidatures. Notifications internes, distinctes des alertes SMS.</p></div>
      {!!data.unreadNotifications && messages.length > 0 && <button className="btn btn-outline" disabled={busy} onClick={() => read({ upTo: messages[0].id })}>Tout marquer comme lu</button>}
    </div>
    {error && <div className="form-error" role="alert">{error}</div>}
    <p role="status">{data.unreadNotifications || 0} notification{data.unreadNotifications > 1 ? 's' : ''} non lue{data.unreadNotifications > 1 ? 's' : ''}</p>
    <div className="candidate-notifications">
      {messages.map(n => <article className={`card candidate-notification ${n.isRead ? '' : 'is-unread'}`} key={n.id}>
        <Icon name="bell" size={22} /><div><h2>{n.title}</h2><p>{n.company} : ta candidature passe de <b>{n.oldStatus}</b> à <b>{n.newStatus}</b>.</p>
          <p className="muted small">{fmtDate(n.createdAt)} · {n.isRead ? 'Lue' : 'Non lue'}</p>
          <div className="candidate-notification-actions"><Link className="link-btn" to="/app/candidatures">Voir mes candidatures →</Link>
            {!n.isRead && <button className="link-btn" disabled={busy} onClick={() => read({ ids: [n.id] })}>Marquer comme lue</button>}
          </div></div>
      </article>)}
      {!messages.length && <div className="card empty empty-lg"><Icon name="bell" size={32} /><b>Aucune notification pour l’instant</b><p>Les prochains changements de statut apparaîtront ici.</p><Link to="/app/candidatures" className="btn btn-outline">Mes candidatures</Link></div>}
    </div>
    {messages.length === 50 && <p className="muted small">Les 50 notifications les plus récentes sont affichées.</p>}
  </div>;
}
