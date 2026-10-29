import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Icon from '../components/Icon.jsx';
import MatchRing from '../components/MatchRing.jsx';
import { api, fmtSalary, fmtDate } from '../api.js';
import { useAuth } from '../auth.jsx';

function ApplyCard({ job, applied, onApplied }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [letter, setLetter] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api('/applications', { method: 'POST', body: { jobId: job.id, coverLetter: letter } });
      onApplied();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  if (applied) {
    return (
      <div className="apply-card applied">
        <span className="apply-icon ok"><Icon name="check" size={22} /></span>
        <b>Candidature envoyée</b>
        <p>Suis son avancement depuis <Link to="/app/candidatures">Mes candidatures</Link>.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="apply-card">
        <b>Postuler à cette offre</b>
        <p>Connecte-toi pour envoyer ton CV en un clic.</p>
        <button className="btn btn-primary btn-block" onClick={() => nav('/connexion')}>Se connecter</button>
        <Link className="btn btn-outline btn-block" to="/inscription">Créer un compte</Link>
      </div>
    );
  }

  return (
    <div className="apply-card">
      <b>Postuler à cette offre</b>
      <p>Ton profil + ton CV partent avec ta candidature.</p>
      {!open ? (
        <button className="btn btn-primary btn-block" onClick={() => setOpen(true)}>Postuler en un clic</button>
      ) : (
        <form onSubmit={submit} className="apply-form">
          <label>Lettre de motivation (optionnelle)</label>
          <textarea
            rows={5} value={letter} onChange={(e) => setLetter(e.target.value)}
            placeholder="Madame, Monsieur, vivement motivé(e) par ce poste…"
          />
          {err && <div className="form-error">{err}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Envoi…' : 'Envoyer ma candidature'}
          </button>
          <button type="button" className="link-btn center" onClick={() => setOpen(false)}>Annuler</button>
        </form>
      )}
    </div>
  );
}

export default function JobDetail({ inApp = false }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const { user } = useAuth();

  const load = () => {
    api(`/jobs/${id}`)
      .then(setData)
      .catch((e) => setErr(e.message));
  };
  useEffect(load, [id, user]);

  useEffect(() => {
    if (data?.job) document.title = `${data.job.title} | CarrièreOS`;
  }, [data]);

  if (err) return <div className="page-loader">{err}</div>;
  if (!data || !data.job) return <div className="page-loader">Chargement de l’offre…</div>;

  const { job, applied } = data;
  const c = job.company || {};
  const match = job.match;

  return (
    <div className="page">
      {!inApp && <Navbar />}
      <main className={`container section-tight ${inApp ? 'in-app-main' : ''}`}>
        <div className="crumbs">
          <Link to={inApp ? '/app/offres' : '/jobs'}>← Retour aux offres</Link>
          <span className="crumb-date">Publiée {fmtDate(job.postedAt)}</span>
        </div>

        <div className="detail-layout">
          <article className="detail-main card">
            <div className="detail-head">
              <div className="company-avatar xl" style={{ background: c.color || '#2E6BFF' }}>
                {(c.name || '?').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1>{job.title}</h1>
                <p className="detail-company">{c.name} · {c.sector}</p>
                <div className="chip-row">
                  <span className="chip"><Icon name="pin" size={13} /> {job.city}, {job.country}</span>
                  <span className="chip"><Icon name="briefcase" size={13} /> {job.contract}</span>
                  <span className="chip"><Icon name="clock" size={13} /> {job.experienceMin || 0} an{job.experienceMin > 1 ? 's' : ''} d’expérience</span>
                  {job.educationMin && <span className="chip">🎓 {job.educationMin}</span>}
                </div>
              </div>
            </div>

            <div className="detail-salary">
              <span>Rémunération</span>
              <b>{fmtSalary(job.salaryMin, job.salaryMax)}</b>
            </div>

            <section>
              <h2>À propos du poste</h2>
              {String(job.description || '').split('\n').map((p, i) => p && <p key={i}>{p}</p>)}
            </section>

            <section>
              <h2>Profil recherché</h2>
              {String(job.requirements || '').split('\n').map((p, i) => p && <p key={i}>{p}</p>)}
            </section>

            <section>
              <h2>Compétences clés</h2>
              <div className="chip-row">
                {job.skills.map((s) => <span className="chip chip-skill" key={s}>{s}</span>)}
              </div>
            </section>

            <section className="detail-similar-note">
              <Icon name="sms" size={18} />
              <span>
                Postule avant tout le monde : active tes <Link to="/app/alertes">alertes SMS 7h00</Link> et reçois cette offre sur ton téléphone.
              </span>
            </section>
          </article>

          <aside className="detail-aside">
            {match ? (
              <div className="card match-card">
                <div className="match-card-top">
                  <MatchRing score={match.score} size={86} stroke={7} />
                  <div>
                    <b>{match.score >= 80 ? 'Excellente compatibilité' : match.score >= 60 ? 'Bonne compatibilité' : 'Compatibilité partielle'}</b>
                    <p>Calculé pour ton profil</p>
                  </div>
                </div>
                <div className="band-bars compact">
                  {match.breakdown.map((b) => (
                    <div className="band-bar" key={b.key}>
                      <span>{b.label}</span>
                      <div className="bar"><i style={{ width: `${b.score}%` }} /></div>
                      <b>{b.score}%</b>
                    </div>
                  ))}
                </div>
                <Link to="/app/profil" className="link-btn center">Améliorer mon profil →</Link>
              </div>
            ) : (
              <div className="card match-card">
                <b>Calcul ton score de match</b>
                <p>Crée un profil gratuit pour voir ta compatibilité avec cette offre.</p>
                <Link to="/inscription" className="btn btn-primary btn-block">Créer mon compte</Link>
              </div>
            )}

            <ApplyCard job={job} applied={applied} onApplied={load} />

            <div className="card company-card">
              <div className="company-avatar" style={{ background: c.color || '#2E6BFF' }}>
                {(c.name || '?').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <b>{c.name}</b>
                <p>{c.sector} · {c.city}</p>
                <p className="muted small">{c.description}</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {!inApp && (
        <footer className="footer footer-slim">
          <div className="container footer-bottom">
            <span>© 2026 CarrièreOS — Le bon emploi. Au bon moment.</span>
            <span>www.carriereOS.com/jobs</span>
          </div>
        </footer>
      )}
    </div>
  );
}
