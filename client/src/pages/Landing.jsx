import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import FeaturedCompanyCard from '../components/FeaturedCompanyCard.jsx';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import { api } from '../api.js';

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
  const [companies, setCompanies] = useState([]);
  const [companiesStatus, setCompaniesStatus] = useState('loading');
  const [jobCount, setJobCount] = useState(null);
  const [cities, setCities] = useState([]);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    api('/companies').then((d) => {
      setCompanies(d.companies.slice(0, 10));
      setCompaniesStatus('ready');
    }).catch(() => setCompaniesStatus('error'));
    api('/stats').then((d) => setJobCount(d.jobs)).catch(() => {});
    api('/jobs/meta').then((m) => setCities(m.cities || [])).catch(() => {});
    document.title = 'Offres d’emploi et recrutement en Guinée et en Afrique | Job by blaise';
  }, []);

  const search = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('search', q.trim());
    if (city) params.set('city', city);
    nav(`/jobs${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <div className="landing">
      <Navbar />

      {/* ============ 1. HERO RECHERCHE ============ */}
      <section className="job-search-hero" aria-labelledby="job-search-title">
        <div className="search-hero-sun" aria-hidden="true" />
        <div className="search-hero-cloud" aria-hidden="true" />
        <div className="container search-hero-inner">
          <span className="search-hero-eyebrow">LE BON EMPLOI. AU BON MOMENT.</span>
          <h1 id="job-search-title">
            <span>{jobCount === null ? 'Des' : new Intl.NumberFormat('fr-FR').format(jobCount)} offres d’emploi</span>
            en Guinée et en<br className="search-hero-break" /> Afrique de l’Ouest
          </h1>
          <p>Votre job de rêve vous attend… trouvez l’opportunité qui vous ressemble !</p>
          <form className="hero-search-bar" onSubmit={search} role="search" aria-label="Rechercher une offre d’emploi">
            <label className="hero-search-field">
              <Icon name="search" size={26} />
              <span className="sr-only">Poste ou mot-clé</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Quel job vous fait vibrer ?" />
            </label>
            <label className="hero-search-field hero-search-city">
              <Icon name="pin" size={26} />
              <span className="sr-only">Ville recherchée</span>
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Où voulez-vous travailler ?</option>
                {cities.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <button type="submit" className="btn hero-search-submit">Rechercher <span aria-hidden="true">↗</span></button>
          </form>
          <div className="search-hero-bottom">
            <span>À découvrir :</span>
            {['Administration', 'Informatique', 'Logistique'].map((term) => (
              <Link key={term} to={`/jobs?search=${encodeURIComponent(term)}`}>{term}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 2. BANDEAU ENTREPRISES ============ */}
      <section className="recruiters-strip" aria-labelledby="recruiters-title">
        <div className="container">
          <h2 id="recruiters-title">Ils recrutent sur Job by <span>blaise</span></h2>
          <p className="recruiters-caption">Des entreprises d’ici. Des opportunités pour vous.</p>
          <div className="recruiters-rail" tabIndex={0} role="region" aria-label="Entreprises qui recrutent, défilement horizontal">
            {companies.map((c) => (
              <Link key={c.id} to={`/entreprises/${c.id}`} className="recruiter-tile" style={{ '--company-color': c.color }}>
                <span className="recruiter-monogram" aria-hidden="true">{c.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                <span className="recruiter-name">{c.name}</span>
              </Link>
            ))}
            {!companies.length && (
              <p className="muted" role="status">
                {companiesStatus === 'loading' ? 'Chargement des entreprises…'
                  : companiesStatus === 'error' ? 'Les entreprises sont momentanément indisponibles. Réessayez plus tard.'
                  : 'De nouvelles entreprises arrivent bientôt.'}
              </p>
            )}
          </div>
          <Link to="/jobs" className="btn btn-primary recruiters-cta">Voir toutes les offres <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      {/* ============ 3. ENTREPRISES À DÉCOUVRIR ============ */}
      <section className="featured-companies" aria-labelledby="featured-companies-title">
        <div className="container">
          <h2 className="sr-only" id="featured-companies-title">Découvrez les entreprises qui recrutent</h2>
          <div className="featured-companies-grid">
            {companies.slice(0, 3).map((company) => <FeaturedCompanyCard key={company.id} company={company} />)}
          </div>
          {!companies.length && <p className="muted featured-companies-empty" role="status">
            {companiesStatus === 'loading' ? 'Chargement des entreprises…'
              : companiesStatus === 'error' ? 'Les entreprises sont momentanément indisponibles. Réessayez plus tard.'
              : 'De nouvelles entreprises arrivent bientôt.'}
          </p>}
        </div>
      </section>

      {/* ============ 4. CV EN 3 CLICS ============ */}
      <section className="section">
        <div className="container split">
          <div className="split-visual reveal"><CvIllustration /></div>
          <div className="split-copy reveal d1">
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
          <div className="split-copy reveal d1">
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
          <div className="split-visual reveal"><SearchIllustration /></div>
        </div>
      </section>

      {/* ============ 6. REJOIGNEZ L'AVENTURE ============ */}
      <section className="section">
        <div className="container">
          <div className="section-head center reveal">
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
            <div className="join-steps reveal stagger">
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
            <div className="join-visual reveal d2"><CvBuilderMock /></div>
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="section final-cta">
        <div className="container final-cta-inner reveal">
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
