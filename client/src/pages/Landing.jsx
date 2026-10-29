import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import CompanyCard from '../components/CompanyCard.jsx';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import MatchRing from '../components/MatchRing.jsx';
import { api } from '../api.js';

/* ---------- Maquette du dashboard (visuel du hero) ---------- */
function MockSidebar() {
  const items = [
    ['home', 'Accueil', true],
    ['jobs', 'Offres d’emploi'],
    ['profile', 'Mon profil'],
    ['apps', 'Mes candidatures'],
    ['bell', 'Mes alertes'],
    ['advice', 'Conseils carrière'],
  ];
  return (
    <div className="mk-sidebar">
      <div className="mk-brand"><span className="mk-dot" /> Job by <span>blaise</span></div>
      {items.map(([ic, label, active]) => (
        <div key={label} className={`mk-navitem ${active ? 'active' : ''}`}>
          <Icon name={ic} size={13} /> {label}
        </div>
      ))}
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-window">
        <MockSidebar />
        <div className="mock-main">
          <div className="mock-topbar">
            <span className="mock-navlinks"><b>Accueil</b> Offres Mon profil Conseils</span>
            <span className="mock-user"><span className="mock-avatar">MD</span> Bonjour<br />Mamadou</span>
          </div>
          <div className="mock-greet">
            <h4>Bonjour Mamadou 👋</h4>
            <p>De nouvelles opportunités t’attendent en Guinée.</p>
          </div>
          <div className="mock-searchbar">
            <span className="mock-search-input"><Icon name="search" size={12} /> Rechercher un emploi, une entreprise…</span>
            <span className="mock-search-loc"><Icon name="pin" size={12} /> Conakry, Guinée</span>
            <span className="mock-search-btn"><Icon name="search" size={12} /></span>
          </div>
          <div className="mock-grid">
            <div className="mock-jobcard">
              <div className="mock-jobcard-title">Offre d'emploi <span>•••</span></div>
              <div className="mock-jobcard-body">
                <div>
                  <h5>Assistant Administratif</h5>
                  <p>Société basée à Conakry</p>
                  <div className="mock-chips">
                    <span>📍 Conakry, Guinée</span>
                    <span>💼 Temps plein</span>
                    <span>🎓 Bac+2</span>
                  </div>
                  <p className="mock-desc">La société recherche un Assistant Administratif pour ses activités au sein de son siège à Conakry.</p>
                  <span className="mock-cta">Voir l'offre →</span>
                </div>
                <div className="mock-match">
                  <MatchRing score={91} size={62} stroke={5} label={false} />
                  <small>Match</small>
                </div>
              </div>
            </div>
            <div className="mock-profilecard">
              <div className="mock-jobcard-title">Mon profil <span>Modifier</span></div>
              <div className="mock-profile-body">
                <MatchRing score={85} size={58} stroke={5} label={false} />
                <ul>
                  <li>✓ CV optimal</li>
                  <li>✓ Compétences renseignées</li>
                  <li>✓ Préférences définies</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mock-phone">
        <div className="mock-phone-time">7:00</div>
        <div className="mock-phone-date">Mar. 27 mai</div>
        <div className="mock-notif">
          <div className="mock-notif-head">
            <span className="mock-notif-icon" aria-hidden="true">J</span>
            <b>Job by blaise</b> <span>maintenant</span>
          </div>
          <strong>Alerte SMS – 7h00</strong>
          <p>3 nouvelles offres correspondent à votre profil.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Illustrations SVG ---------- */
function CvIllustration() {
  return (
    <svg className="illu" viewBox="0 0 440 360" role="img" aria-label="CV moderne">
      <ellipse cx="230" cy="190" rx="200" ry="155" fill="#eaf0ff" />
      <circle cx="80" cy="80" r="34" fill="#00a868" opacity="0.25" />
      <circle cx="376" cy="300" r="46" fill="#2e6bff" opacity="0.18" />
      <g>
        <rect x="105" y="45" width="230" height="275" rx="18" fill="#fff" stroke="#dfe7fb" strokeWidth="2" />
        <circle cx="155" cy="100" r="26" fill="#2e6bff" />
        <path d="M146 96a9 9 0 1 1 18 0a9 9 0 0 1-18 0Zm-11 30a20 20 0 0 1 40 0" fill="#fff" opacity="0.9" />
        <rect x="196" y="82" width="110" height="12" rx="6" fill="#0a1b4d" />
        <rect x="196" y="102" width="82" height="9" rx="4.5" fill="#98a2b3" />
        <rect x="130" y="150" width="180" height="9" rx="4.5" fill="#dfe7fb" />
        <rect x="130" y="168" width="150" height="9" rx="4.5" fill="#dfe7fb" />
        <rect x="130" y="186" width="168" height="9" rx="4.5" fill="#dfe7fb" />
        <rect x="130" y="214" width="70" height="9" rx="4.5" fill="#2e6bff" opacity="0.7" />
        <rect x="130" y="234" width="88" height="22" rx="11" fill="#eaf0ff" />
        <rect x="226" y="234" width="74" height="22" rx="11" fill="#e6f7ef" />
        <rect x="130" y="270" width="120" height="9" rx="4.5" fill="#dfe7fb" />
      </g>
      <g transform="translate(300 230) rotate(12)">
        <rect x="0" y="0" width="74" height="74" rx="18" fill="#fff" stroke="#ffd666" strokeWidth="3" />
        <path d="M18 40l14 14 26-30" stroke="#00a868" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="translate(52 232)">
        <rect x="0" y="0" width="132" height="44" rx="14" fill="#ffd666" />
        <circle cx="24" cy="22" r="12" fill="#fff" />
        <path d="M18 22l5 5 9-10" stroke="#00a868" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <rect x="44" y="13" width="70" height="7" rx="3.5" fill="#0a1b4d" />
        <rect x="44" y="25" width="52" height="6" rx="3" fill="#0a1b4d" opacity="0.55" />
      </g>
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg className="illu" viewBox="0 0 440 360" role="img" aria-label="Recherche d'emploi">
      <ellipse cx="220" cy="190" rx="200" ry="155" fill="#eaf0ff" />
      <rect x="70" y="60" width="235" height="240" rx="18" fill="#fff" stroke="#dfe7fb" strokeWidth="2" />
      <rect x="94" y="90" width="120" height="12" rx="6" fill="#0a1b4d" />
      <rect x="94" y="112" width="80" height="9" rx="4.5" fill="#98a2b3" />
      {[150, 200, 250].map((y, i) => (
        <g key={y}>
          <rect x="94" y={y} width="186" height="40" rx="10" fill={i === 1 ? '#eaf0ff' : '#f5f8ff'} stroke={i === 1 ? '#2e6bff' : '#e4eaf6'} strokeWidth={i === 1 ? 2 : 1} />
          <circle cx="118" cy={y + 20} r="11" fill={i === 1 ? '#2e6bff' : '#cfdcff'} />
          <rect x="140" y={y + 11} width="90" height="8" rx="4" fill="#0a1b4d" opacity="0.75" />
          <rect x="140" y={y + 24} width="60" height="7" rx="3.5" fill="#98a2b3" />
          <rect x="240" y={y + 13} width="28" height="14" rx="7" fill={i === 1 ? '#00a868' : '#e4eaf6'} />
        </g>
      ))}
      <g transform="translate(268 196)">
        <circle cx="42" cy="42" r="40" fill="#2e6bff" opacity="0.16" />
        <circle cx="42" cy="42" r="30" fill="none" stroke="#2e6bff" strokeWidth="10" />
        <line x1="64" y1="64" x2="92" y2="92" stroke="#2e6bff" strokeWidth="13" strokeLinecap="round" />
      </g>
      <g transform="translate(300 60)">
        <rect x="0" y="0" width="118" height="42" rx="14" fill="#fff" stroke="#e4eaf6" strokeWidth="2" />
        <path d="M20 12a9 9 0 0 1 9 9c0 7-9 15-9 15s-9-8-9-15a9 9 0 0 1 9-9Z" fill="#00a868" />
        <circle cx="20" cy="21" r="3.5" fill="#fff" />
        <rect x="38" y="13" width="64" height="7" rx="3.5" fill="#0a1b4d" />
        <rect x="38" y="25" width="46" height="6" rx="3" fill="#98a2b3" />
      </g>
    </svg>
  );
}

function CvBuilderMock() {
  return (
    <div className="cvmock" aria-hidden="true">
      <div className="cvmock-bar">
        <span /><span /><span />
        <b>Job by blaise — Mon CV</b>
      </div>
      <div className="cvmock-body">
        <div className="cvmock-rail">
          <i className="on" /><i /><i /><i />
        </div>
        <div className="cvmock-page">
          <div className="cvmock-head">
            <span className="cvmock-avatar">MD</span>
            <div>
              <b>Mamadou Diallo</b>
              <small>Assistant Administratif · Conakry</small>
            </div>
            <span className="cvmock-edit">✎ Modifier</span>
          </div>
          <div className="cvmock-lines">
            <i style={{ width: '92%' }} /><i style={{ width: '78%' }} /><i style={{ width: '85%' }} />
          </div>
          <div className="cvmock-tags">
            <span>Excel</span><span>Organisation</span><span>Communication</span><span>+4</span>
          </div>
          <div className="cvmock-lines dim">
            <i style={{ width: '60%' }} /><i style={{ width: '70%' }} />
          </div>
          <span className="cvmock-export">⬇ Télécharger en PDF</span>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { n: '1', title: 'Créez votre profil facilement', text: 'Créez votre compte en quelques clics et remplissez votre profil pour indiquer votre situation et vos aspirations.' },
  { n: '2', title: 'Concevez un CV percutant', text: 'Utilisez nos rubriques optimisées pour créer un CV moderne, professionnel et attractif en quelques minutes.' },
  { n: '3', title: 'Postulez et soyez recruté', text: 'Postulez en un clic, recevez les offres par SMS dès 7h00 et laissez les entreprises vous contacter.' },
];

export default function Landing() {
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [cities, setCities] = useState([]);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    api('/jobs?sort=recent').then((d) => setJobs(d.jobs.slice(0, 4))).catch(() => {});
    api('/companies').then((d) => setCompanies(d.companies.slice(0, 6))).catch(() => {});
    api('/jobs/meta').then((m) => setCities(m.cities || [])).catch(() => {});
    document.title = 'Offres d’emploi et recrutement en Guinée et en Afrique | Job by blaise';
  }, []);

  const search = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    if (city) params.set('city', city);
    nav(`/jobs${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <div className="landing">
      <Navbar />

      {/* ============ 1. HERO ============ */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="hero-pill">✓ Votre prochain emploi n'attend que vous !</span>
            <h1>
              Transformez votre carrière<br />
              avec <span className="hero-brand">Job by <span className="logo-os">blaise</span></span>
            </h1>
            <p className="hero-sub">
              Créez un CV moderne en quelques minutes et connectez-vous aux meilleures
              opportunités d'emploi en Guinée et en Afrique de l'Ouest — avec des
              <b className="blue"> alertes SMS chaque matin à 7h00</b>.
            </p>
            <div className="hero-cta">
              <Link to="/jobs" className="btn btn-primary btn-xl">Trouver un job</Link>
              <Link to="/inscription" className="btn btn-outline btn-xl">Créer mon CV</Link>
            </div>
            <div className="hero-trust">
              <span><b>299+</b> offres actives</span>
              <span><b>18</b> entreprises</span>
              <span><b>4,8/5</b> ★ candidats</span>
            </div>
          </div>
          <div className="hero-visual">
            <DashboardMockup />
            <span className="hero-scribble">Le bon emploi.<br />Au bon moment.</span>
          </div>
        </div>
      </section>

      {/* ============ 2. DERNIÈRES OFFRES ============ */}
      <section className="section">
        <div className="container">
          <div className="section-head center">
            <div>
              <span className="kicker">Offres d'emploi</span>
              <h2>Les dernières offres d'emploi</h2>
              <p className="muted">Découvrez les offres d'emploi qui correspondent à vos compétences et aspirations.</p>
            </div>
          </div>
          <div className="mini-jobs-grid">
            {jobs.map((j) => (
              <Link to={`/jobs/${j.id}`} className="mini-job" key={j.id}>
                <div className="mini-job-head">
                  <span className="company-avatar" style={{ background: j.company?.color }}>
                    {(j.company?.name || '?').slice(0, 2).toUpperCase()}
                  </span>
                  <b className="mini-job-title">{j.title}</b>
                </div>
                <span className="mini-job-company">{j.company?.name}</span>
                <div className="mini-job-meta">
                  <span><Icon name="pin" size={13} /> {j.city}</span>
                  <span className="mini-job-tag">{j.contract}</span>
                </div>
                <div className="mini-job-req">
                  <span>Expérience : {j.experienceMin ? `${j.experienceMin} an${j.experienceMin > 1 ? 's' : ''} et plus` : 'Débutant accepté'}</span>
                  <span>Études : {j.educationMin || 'Non précisé'}</span>
                </div>
              </Link>
            ))}
            {!jobs.length && <div className="empty">Chargement des offres…</div>}
          </div>
          <div className="center-btn">
            <Link to="/jobs" className="btn btn-outline btn-lg">Voir toutes les offres</Link>
          </div>
        </div>
      </section>

      {/* ============ 3. ENTREPRISES ============ */}
      <section className="section section-soft">
        <div className="container">
          <div className="section-head center">
            <div>
              <span className="kicker">Talents & entreprises</span>
              <h2>Les entreprises qui recrutent</h2>
              <p className="muted">Explorez les entreprises qui recrutent et découvrez les opportunités qu'elles offrent.</p>
            </div>
          </div>
          <div className="company-grid">
            {companies.map((c) => <CompanyCard key={c.id} company={c} />)}
            {!companies.length && <div className="empty">Chargement des entreprises…</div>}
          </div>
          <div className="center-btn">
            <Link to="/entreprises" className="btn btn-outline btn-lg">Découvrir toutes les entreprises</Link>
          </div>
        </div>
      </section>

      {/* ============ 4. CV EN 3 CLICS ============ */}
      <section className="section">
        <div className="container split">
          <div className="split-visual"><CvIllustration /></div>
          <div className="split-copy">
            <span className="kicker">CV</span>
            <h2>Votre CV moderne en 3 clics</h2>
            <p>
              Votre CV est votre passeport pour l'emploi. Découvrez nos rubriques modernes,
              professionnelles et optimisées pour capter l'attention des recruteurs dès la
              première seconde.
            </p>
            <p className="split-strong">Faites de votre CV un véritable passeport pour l'emploi.</p>
            <Link to="/inscription" className="btn btn-primary btn-xl">Créer un CV maintenant</Link>
          </div>
        </div>
      </section>

      {/* ============ 5. RECHERCHE ============ */}
      <section className="section section-soft">
        <div className="container split split-reverse">
          <div className="split-copy">
            <span className="kicker">Matching</span>
            <h2>Trouvez l'emploi fait pour vous</h2>
            <p>
              Plus qu'une simple recherche, une mise en relation intelligente.
              Indiquez simplement le poste recherché et votre ville, nous nous chargeons du reste.
            </p>
            <p className="muted">Découvrez immédiatement des offres adaptées à votre profil.</p>
            <form className="split-form" onSubmit={search}>
              <span className="split-form-field">
                <Icon name="search" size={16} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Poste recherché…" aria-label="Poste recherché" />
              </span>
              <span className="split-form-field">
                <Icon name="pin" size={16} />
                <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Ville">
                  <option value="">Toutes les villes</option>
                  {cities.map((c) => <option key={c}>{c}</option>)}
                </select>
              </span>
              <button className="btn btn-primary" type="submit">Explorer les offres</button>
            </form>
          </div>
          <div className="split-visual"><SearchIllustration /></div>
        </div>
      </section>

      {/* ============ 6. REJOIGNEZ L'AVENTURE ============ */}
      <section className="section">
        <div className="container">
          <div className="section-head center">
            <div>
              <span className="kicker">3 étapes</span>
              <h2>Rejoignez l'aventure Job by blaise</h2>
              <p className="muted">
                Prenez le contrôle de votre avenir professionnel avec un profil qui vous met
                réellement en avant.
              </p>
            </div>
          </div>
          <div className="join-grid">
            <div className="join-steps">
              {STEPS.map((s) => (
                <div className="join-step" key={s.n}>
                  <span className="join-step-num">{s.n}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </div>
              ))}
              <Link to="/inscription" className="btn btn-primary btn-xl">Rejoindre Job by blaise</Link>
            </div>
            <div className="join-visual"><CvBuilderMock /></div>
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="section final-cta">
        <div className="container final-cta-inner">
          <h2>Votre prochain emploi n'attend que vous</h2>
          <p>Rejoignez les candidats qui reçoivent chaque matin les offres faites pour eux.</p>
          <div className="final-cta-actions">
            <Link to="/inscription" className="btn btn-white btn-xl">Créer mon compte</Link>
            <Link to="/jobs" className="btn btn-ghost-light btn-xl">Trouver un job →</Link>
          </div>
          <div className="hero-url light">
            <b>www.jobbyblaise.com/jobs</b>
            <span>Le bon emploi. Au bon moment.</span>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <Logo />
            <p className="footer-tag">Le bon emploi. Au bon moment.</p>
            <p className="footer-muted">Plateforme d'emploi — Guinée & Afrique de l'Ouest</p>
          </div>
          <div className="footer-cols">
            <div>
              <b>Plateforme</b>
              <Link to="/jobs">Offres d'emploi</Link>
              <Link to="/entreprises">Entreprises</Link>
              <Link to="/conseils">Conseils carrière</Link>
            </div>
            <div>
              <b>Candidat</b>
              <Link to="/connexion">Connexion</Link>
              <Link to="/inscription">Créer un compte</Link>
              <Link to="/inscription">Créer mon CV</Link>
            </div>
            <div>
              <b>Contact</b>
              <span>www.jobbyblaise.com</span>
              <span>Conakry, Guinée</span>
              <span>contact@jobbyblaise.com</span>
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 Job by blaise — Tous droits réservés.</span>
          <span>Fait avec ❤ en Guinée 🇬🇳</span>
        </div>
      </footer>
    </div>
  );
}
