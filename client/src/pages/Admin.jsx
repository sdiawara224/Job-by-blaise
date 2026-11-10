import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import { SECTIONS, LIST_FILTERS, LIST_SORTS, SEARCH_HINTS } from './adminConfig.js';
import ContentEditor from './admin/ContentEditor.jsx';
import RecordDialog from './admin/RecordDialog.jsx';
import DeleteDialog from './admin/DeleteDialog.jsx';
import './admin.css';

const date = (value) => value ? new Date(String(value).replace(' ', 'T').replace(/^(.*\d{2}:\d{2}:\d{2})$/, '$1Z')).toLocaleDateString('fr-FR') : '—';
const initial = (s) => String(s || 'J').split(' ').filter(Boolean).slice(0, 2).map((v) => v[0]).join('').toUpperCase();
function Badge({ children, tone = '' }) { return <span className={`adm-badge ${tone}`}><i />{children}</span>; }
function Cell({ field, value }) {
  if (field === 'is_active') return <Badge tone={Number(value) ? 'green' : 'gray'}>{Number(value) ? 'Publiée' : 'Non publiée'}</Badge>;
  if (field === 'enabled') return <Badge tone={Number(value) ? 'green' : 'gray'}>{Number(value) ? 'Activées' : 'Désactivées'}</Badge>;
  if (field === 'is_read') return <Badge tone={Number(value) ? 'green' : 'amber'}>{Number(value) ? 'Lu' : 'Non lu'}</Badge>;
  if (field === 'status') return <Badge tone={value === 'Acceptée' ? 'green' : value === 'Refusée' ? 'red' : value === 'En cours' ? 'blue' : 'amber'}>{value}</Badge>;
  if (field.endsWith('_at')) return <time dateTime={value}>{date(value)}</time>;
  return value || '—';
}

function Overview({ data, open }) {
  const s = data.stats;
  return <>
    <section className="adm-welcome"><div><span className="adm-eyebrow">VOTRE ESPACE DE PILOTAGE</span><h2>Les bonnes opportunités<br />commencent ici.</h2><p>Des contenus à jour. Des candidats accompagnés.<br />Gardez une longueur d’avance sur votre plateforme.</p><button className="adm-btn" onClick={() => open('jobs')}><Icon name="plus" size={16} /> Créer une offre</button></div><div className="adm-welcome-art" aria-hidden="true"><div className="adm-art-card"><span>J</span><i /><i /><b>Un nouveau départ.</b><em>Le bon emploi. Au bon moment.</em><div>✓ &nbsp; Opportunités en ligne</div></div><div className="adm-art-stamp"><Icon name="external" size={25} /></div></div></section>
    <div className="adm-metrics">{[['jobs', 'Offres publiées', s.activeJobs, `${s.jobs - s.activeJobs} non publiée(s)`, 'blue'], ['team', 'Comptes inscrits', s.users, 'Candidats et équipe', 'green'], ['apps', 'Candidatures', s.applications, `${s.pending} en attente de réponse`, 'purple'], ['briefcase', 'Entreprises', s.companies, 'Présentes sur la plateforme', 'amber']].map(([icon, label, count, hint, tone]) => <article className="adm-metric" key={label}><span className={`adm-stat-icon ${tone}`}><Icon name={icon} size={21} /></span><p>{label}</p><strong>{Number(count).toLocaleString('fr-FR')}</strong><small>{hint}</small></article>)}</div>
    <div className="adm-overview-grid"><section className="adm-panel"><div className="adm-panel-head"><div><h2>Dernières candidatures</h2><p>Les parcours qui avancent, en un coup d’œil.</p></div><Link to="/admin/applications">Tout voir ↗</Link></div><div className="adm-table-scroll"><table><thead><tr><th>Candidat & opportunité</th><th>Statut</th><th>Date</th></tr></thead><tbody>{data.recent.map((r) => <tr key={r.id}><td><b>{r.full_name}</b><small>{r.title}</small></td><td><Cell field="status" value={r.status} /></td><td><time dateTime={r.created_at}>{date(r.created_at)}</time></td></tr>)}</tbody></table>{!data.recent.length && <div className="adm-empty">Les nouvelles candidatures apparaîtront ici.</div>}</div></section>
      <section className="adm-panel adm-shortcuts"><div className="adm-panel-head"><div><h2>À portée de main</h2><p>Faites vivre votre plateforme.</p></div></div>{[['content', 'Actualiser l’accueil', 'Votre message, au premier plan'], ['advice', 'Partager un conseil', `${s.advice} articles pour guider les candidats`], ['alerts', 'Suivre les alertes', `${s.alerts} abonnements actifs`]].map(([key, title, text]) => <Link key={key} to={`/admin/${key}`}><span className="adm-shortcut-icon"><Icon name={SECTIONS[key].icon} size={20} /></span><div><b>{title}</b><small>{text}</small></div><span>↗</span></Link>)}</section></div>
  </>;
}

export default function Admin() {
  const { user, loading, logout } = useAuth();
  const { section: routeSection } = useParams();
  const section = routeSection || 'overview';
  const cfg = SECTIONS[section];
  const navigate = useNavigate();
  const location = useLocation();
  const [contentDirty, setContentDirty] = useState(false);
  const [summary, setSummary] = useState(null), [items, setItems] = useState([]), [total, setTotal] = useState(0), [page, setPage] = useState(1), [q, setQ] = useState(''), [status, setStatus] = useState(''), [busy, setBusy] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState(''), [refresh, setRefresh] = useState(0), [editor, setEditor] = useState(null), [companies, setCompanies] = useState([]), [menu, setMenu] = useState(false), [pendingDelete, setPendingDelete] = useState(null), [sort, setSort] = useState('newest'), [loadedKey, setLoadedKey] = useState('');
  const listKey = JSON.stringify([section, q, status, sort, page, refresh]);
  const listBusy = busy || loadedKey !== listKey;
  useEffect(() => { setQ(''); setStatus(''); setSort('newest'); setPage(1); setEditor(null); setPendingDelete(null); setMenu(false); setError(''); document.title = `${cfg?.label || 'Administration'} | Job by blaise`; }, [section]);
  useEffect(() => {
    if (location.search === '?create=1' && cfg?.defaults && user?.isAdmin) {
      setEditor({ ...cfg.defaults });
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, section, user?.isAdmin]);
  useEffect(() => { if (!user?.isAdmin) return; api('/admin/summary').then(setSummary).catch((e) => setError(e.message)); api('/admin/options').then((d) => setCompanies(d.companies)).catch((e) => setError(e.message)); }, [user?.isAdmin, refresh]);
  useEffect(() => {
    if (!user?.isAdmin || !cfg?.columns) { setBusy(false); return; }
    let active = true;
    setBusy(true); setError('');
    const timer = setTimeout(() => {
      api(`/admin/${section}?${new URLSearchParams({ q, status, sort, page })}`).then((d) => { if (active) { setItems(d.items); setTotal(d.total); if (d.page) setPage(d.page); } }).catch((e) => { if (active) setError(e.message); }).finally(() => { if (active) { setBusy(false); setLoadedKey(listKey); } });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [section, q, status, sort, page, refresh, user?.isAdmin]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(timer); }, [notice]);
  if (loading) return <div className="page-loader">Vérification de votre accès…</div>;
  if (!user) return <Navigate to="/admin/connexion" replace />;
  if (!user.isAdmin) return <div className="adm-access"><Logo /><span className="adm-stat-icon blue"><Icon name="lock" size={28} /></span><h1>Un espace réservé à l’équipe.</h1><p>Votre compte ne possède pas de droits d’administration.<br />Vos offres et candidatures restent disponibles dans l’espace candidat.</p><Link className="adm-btn primary" to="/app">Mon espace candidat</Link><button className="adm-btn" onClick={() => { logout(); navigate('/admin/connexion'); }}>Changer de compte</button></div>;
  if (!cfg) return <Navigate to="/admin" replace />;
  const openCreate = (resource) => { if (resource !== section) { navigate(`/admin/${resource}?create=1`); } else setEditor({ ...SECTIONS[resource].defaults }); };
  const remove = async (row) => {
    await api(`/admin/${section}/${row.id}`, { method: 'DELETE' });
    setPendingDelete(null); setNotice('Enregistrement supprimé.'); setRefresh((v) => v + 1);
  };
  const resetFilters = () => { setQ(''); setStatus(''); setSort('newest'); setPage(1); };
  return <div className="adm-shell" onClickCapture={(e) => {
    const link = e.target.closest('a');
    if (contentDirty && link && link.target !== '_blank' && !window.confirm('Quitter sans enregistrer les modifications des textes ?')) {
      e.preventDefault(); e.stopPropagation();
    }
  }}>
    <aside className={`adm-sidebar ${menu ? 'is-open' : ''}`}><div className="adm-brand"><Logo to="/admin" /><span>ADMINISTRATION</span></div><nav aria-label="Administration"><p className="adm-nav-label">ESPACE DE TRAVAIL</p>{Object.entries(SECTIONS).map(([key, config]) => <NavLink key={key} end={key === 'overview'} to={key === 'overview' ? '/admin' : `/admin/${key}`} className="adm-nav-link"><Icon name={config.icon} size={19} /><span>{config.label}</span>{['jobs', 'applications'].includes(key) && summary && <em>{summary.stats[key]}</em>}</NavLink>)}</nav><div className="adm-sidebar-bottom"><div className="adm-team"><span className="adm-avatar">{initial(user.fullName)}</span><div><b>{user.fullName}</b><small>Administrateur</small></div></div><Link to="/" className="adm-nav-link"><Icon name="external" size={18} /> Voir le site public</Link><button className="adm-nav-link" onClick={() => { logout(); navigate('/admin/connexion'); }}><Icon name="logout" size={18} /> Déconnexion</button></div></aside>
    {menu && <button className="adm-scrim" aria-label="Fermer le menu" onClick={() => setMenu(false)} />}
    <div className="adm-main"><header className="adm-topbar"><div><button className="adm-icon-btn adm-menu-toggle" aria-label="Ouvrir le menu" aria-expanded={menu} onClick={() => setMenu(!menu)}><Icon name="menu" /></button><span>Administration <i>/</i> <b>{cfg.label}</b></span></div><div><span className="adm-secure"><Icon name="lock" size={14} /> Accès sécurisé</span><Link to="/" className="adm-btn">Voir le site <Icon name="external" size={15} /></Link></div></header>
      <main className="adm-workspace"><div className="adm-page-heading"><div><span className="adm-eyebrow">JOB BY BLAISE · BACK-OFFICE</span><h1>{cfg.label}</h1><p>{cfg.description}</p></div>{cfg.columns && !cfg.noCreate && <button className="adm-btn primary" onClick={() => setEditor({ ...cfg.defaults })}><Icon name="plus" size={17} /> Créer {cfg.singular}</button>}</div>
        {notice && <div className="adm-toast" role="status"><Icon name="check" size={18} />{notice}<button aria-label="Fermer la notification" onClick={() => setNotice('')}>×</button></div>}
        {error && <div className="adm-error" role="alert">{error} <button className="adm-btn" onClick={() => setRefresh((v) => v + 1)}>Réessayer</button></div>}
        {section === 'overview' && (summary ? <Overview data={summary} open={openCreate} /> : !error && <div className="adm-empty">Chargement de votre tableau de bord…</div>)}
        {section === 'content' && <ContentEditor notify={setNotice} onDirtyChange={setContentDirty} jobCount={summary?.stats.activeJobs} />}
        {section === 'settings' && <div className="adm-settings"><section className="adm-panel"><Icon name="lock" size={26} /><h2>Accès & sécurité</h2><p>L’accès administrateur dépend de la liste <code>ADMIN_EMAILS</code> et d’un secret de signature serveur robuste (<code>JBB_SECRET</code>, au moins 32 caractères). Aucun candidat ne peut s’attribuer ces droits depuis son profil.</p><dl><dt>Compte connecté</dt><dd>{user.email}</dd><dt>Droits</dt><dd>Administration des contenus</dd></dl></section><section className="adm-panel"><Icon name="settings" size={26} /><h2>Environnement</h2><dl><dt>Base de données</dt><dd>{summary?.backend === 'supabase' ? 'Supabase · PostgreSQL' : summary?.backend === 'sqlite' ? 'SQLite · environnement local' : 'Vérification…'}</dd><dt>Contenus éditoriaux</dt><dd>Enregistrés en base de données</dd><dt>SMS</dt><dd>Génération interne · pas de confirmation opérateur</dd></dl><p>Les secrets et la connexion à la base se configurent uniquement sur le serveur, jamais dans le navigateur.</p></section></div>}
        {cfg.columns && <section className="adm-panel adm-list-panel"><div className="adm-list-toolbar"><div className="adm-list-title"><b>Tous les enregistrements</b><span className="adm-count">{listBusy ? '…' : total}</span></div><div className="adm-filters"><label className="adm-search"><Icon name="search" size={18} /><input aria-label={`Rechercher dans ${cfg.label}`} placeholder={SEARCH_HINTS[section] || "Rechercher…"} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></label>{LIST_FILTERS[section] && <select aria-label="Filtrer par statut" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">Tous les statuts</option>{LIST_FILTERS[section].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>}<select aria-label="Trier les enregistrements" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>{LIST_SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="adm-icon-btn" aria-label="Actualiser les enregistrements" onClick={() => setRefresh((v) => v + 1)}><Icon name="refresh" size={18} /></button></div></div>
          {(q || status || sort !== 'newest') && <div className="adm-active-filters"><span aria-live="polite">{listBusy ? 'Actualisation…' : `${total} résultat${total > 1 ? 's' : ''}`}</span>{q && <span className="adm-filter-chip">Recherche : {q}<button aria-label="Effacer la recherche" onClick={() => { setQ(''); setPage(1); }}>×</button></span>}{status && <span className="adm-filter-chip">{LIST_FILTERS[section]?.find(([v]) => v === status)?.[1]}<button aria-label="Effacer le filtre de statut" onClick={() => { setStatus(''); setPage(1); }}>×</button></span>}<button className="adm-filter-reset" onClick={resetFilters}>Réinitialiser</button></div>}
          <div className="adm-table-scroll" aria-busy={listBusy}><table><thead><tr>{cfg.columns.map(([key, title]) => <th key={key} scope="col">{title}</th>)}<th scope="col" className="adm-action-col">Actions</th></tr></thead><tbody>{!listBusy && !error && items.map((row) => <tr key={row.id ?? row.user_id}>{cfg.columns.map(([key], i) => <td key={key} className={i === 0 ? 'adm-primary-cell' : ''}>{i === 0 ? <div className="adm-row-name"><span className="adm-row-avatar">{initial(row[key])}</span><div><b><Cell field={key} value={row[key]} /></b><small>#{row.id ?? row.user_id}</small></div></div> : <span className={key === 'body' ? 'adm-truncate' : ''}><Cell field={key} value={row[key]} /></span>}</td>)}<td className="adm-actions"><button className="adm-icon-btn" title={cfg.readOnly ? 'Consulter' : 'Modifier'} aria-label={`${cfg.readOnly ? 'Consulter' : 'Modifier'} ${row.full_name || row.title || row.name || row.id}`} onClick={() => setEditor(row)}><Icon name={cfg.readOnly ? 'eye' : 'edit'} size={17} /></button>{['jobs', 'companies', 'advice'].includes(section) && !(section === 'jobs' && !Number(row.is_active)) && <Link className="adm-icon-btn" title="Voir sur le site" aria-label={`Voir ${row.title || row.name} sur le site`} target="_blank" to={`/${section === 'companies' ? 'entreprises' : section === 'advice' ? 'conseils' : 'jobs'}/${row.id}`}><Icon name="external" size={17} /></Link>}{!cfg.noDelete && <button className="adm-icon-btn danger" disabled={pendingDelete !== null} title="Supprimer" aria-label={`Supprimer ${row.full_name || row.title || row.name || row.id}`} onClick={() => setPendingDelete(row)}><Icon name="trash" size={17} /></button>}</td></tr>)}</tbody></table>{listBusy ? <div className="adm-empty" role="status"><span className="dots" />Chargement des contenus…</div> : !error && !items.length && <div className="adm-empty"><span className="adm-empty-icon"><Icon name="search" size={28} /></span><h3>{q || status ? 'Aucun résultat pour ces filtres' : 'Tout commence par un premier contenu'}</h3><p>{q || status ? 'Essayez un autre mot-clé ou réinitialisez vos filtres.' : 'Les enregistrements de cette rubrique apparaîtront ici.'}</p>{q || status ? <button className="adm-btn" onClick={resetFilters}>Effacer les filtres</button> : !cfg.noCreate && <button className="adm-btn primary" onClick={() => setEditor({ ...cfg.defaults })}>Créer {cfg.singular}</button>}</div>}</div>
          <footer className="adm-pagination"><span>{total ? `${Math.min((page - 1) * 20 + 1, total)}–${Math.min(page * 20, total)} sur ${total}` : '0 enregistrement'}</span><div><button className="adm-btn" disabled={page <= 1 || listBusy} onClick={() => setPage(page - 1)}>← Précédent</button><span>Page {page}</span><button className="adm-btn" disabled={page * 20 >= total || listBusy} onClick={() => setPage(page + 1)}>Suivant →</button></div></footer>
        </section>}
        <footer className="adm-workspace-footer"><span>Job by blaise · Le bon emploi. Au bon moment.</span><span>Administration des contenus</span></footer>
      </main>
    </div>
    {pendingDelete && <DeleteDialog section={section} record={pendingDelete} onClose={() => setPendingDelete(null)} onConfirm={remove} onEdit={(row) => { setPendingDelete(null); setEditor(row); }} />}
    {editor && <RecordDialog key={`${section}-${editor.id || editor.user_id || 'new'}`} section={section} record={editor} companies={companies} onClose={() => setEditor(null)} onSaved={(message) => { setEditor(null); setNotice(message); setRefresh((v) => v + 1); }} />}
  </div>;
}
