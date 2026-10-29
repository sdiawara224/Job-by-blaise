import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import JobCard from './JobCard.jsx';
import Icon from './Icon.jsx';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function JobsBoard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [meta, setMeta] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const search = params.get('search') || '';
  const city = params.get('city') || '';
  const contract = params.get('contract') || '';
  const domain = params.get('domain') || '';
  const sort = params.get('sort') || 'recent';

  useEffect(() => {
    api('/jobs/meta').then(setMeta).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (city) qs.set('city', city);
    if (contract) qs.set('contract', contract);
    if (domain) qs.set('domain', domain);
    if (sort) qs.set('sort', sort);
    api(`/jobs?${qs}`)
      .then((d) => { setJobs(d.jobs); setTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, city, contract, domain, sort]);

  useEffect(() => { load(); }, [load]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div className="jobsboard">
      <div className="jobsboard-filters reveal">
        <div className="filter-search">
          <Icon name="search" size={17} />
          <input
            value={search}
            onChange={(e) => setParam('search', e.target.value)}
            placeholder="Rechercher un emploi, une entreprise, une compétence…"
            aria-label="Rechercher"
          />
        </div>
        <div className="filter-selects">
          <select value={city} onChange={(e) => setParam('city', e.target.value)} aria-label="Ville">
            <option value="">Toutes les villes</option>
            {(meta?.cities || []).map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={contract} onChange={(e) => setParam('contract', e.target.value)} aria-label="Contrat">
            <option value="">Tous les contrats</option>
            {(meta?.contracts || []).map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={domain} onChange={(e) => setParam('domain', e.target.value)} aria-label="Domaine">
            <option value="">Tous les domaines</option>
            {(meta?.domains || []).map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={(e) => setParam('sort', e.target.value)} aria-label="Tri">
            <option value="recent">Plus récentes</option>
            <option value="salary">Salaire le plus élevé</option>
          </select>
        </div>
      </div>

      <div className="jobsboard-meta">
        <span><b>{total}</b> offre{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}</span>
        {user && <span className="hint"><Icon name="star" size={14} /> Le % de match est calculé pour ton profil</span>}
        {(search || city || contract || domain) && (
          <button
            className="link-btn"
            onClick={() => setParams(new URLSearchParams(), { replace: true })}
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty">Chargement des offres…</div>
      ) : jobs.length ? (
        <div className="jobs-grid reveal stagger">
          {jobs.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      ) : (
        <div className="empty empty-lg">
          <Icon name="search" size={34} />
          <b>Aucune offre ne correspond à ces critères</b>
          <p>Essaie d’élargir la recherche ou active tes alertes SMS pour être prévenu dès qu’une offre arrive.</p>
        </div>
      )}
    </div>
  );
}
