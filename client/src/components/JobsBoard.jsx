import { useSearchParams } from 'react-router-dom';
import JobCard from './JobCard.jsx';
import Icon from './Icon.jsx';
import useApiResource from '../hooks/useApiResource.js';
import ResourceError from './ResourceError.jsx';
import { useAuth } from '../auth.jsx';

export default function JobsBoard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data: meta, error: metaError, reload: reloadMeta } = useApiResource('/jobs/meta');

  const search = params.get('search') || '';
  const city = params.get('city') || '';
  const contract = params.get('contract') || '';
  const domain = params.get('domain') || '';
  const sort = params.get('sort') || 'recent';

  const qs = new URLSearchParams();
  if (search) qs.set('search', search);
  if (city) qs.set('city', city);
  if (contract) qs.set('contract', contract);
  if (domain) qs.set('domain', domain);
  if (sort) qs.set('sort', sort);
  const { data, error, loading, reload } = useApiResource(`/jobs?${qs}`, user);
  const jobs = data?.jobs || [];
  const total = data?.total || 0;

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

      {metaError && <div className="form-error" role="status">Les filtres sont temporairement indisponibles. <button className="link-btn" onClick={reloadMeta}>Recharger les filtres</button></div>}

      <div className="jobsboard-meta">
        <span aria-live="polite">{loading ? 'Recherche en cours…' : error ? 'Recherche indisponible' : <><b>{total}</b> offre{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}</>}</span>
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
      ) : error ? (
        <ResourceError message={error} retry={reload} />
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
