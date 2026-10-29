import { useEffect, useState, Link } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import JobCard from '../components/JobCard.jsx';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import MatchRing from '../components/MatchRing.jsx';
import { api } from '../api.js';

const FEATURES = [
  { icon: 'briefcase', title: 'Emplois', text: 'Des opportunités en Guinée' },
  { icon: 'apps', title: 'CV', text: 'Un CV qui fait la différence' },
  { icon: 'star', title: 'Matching', text: 'Des offres adaptées à ton profil' },
  { icon: 'bell', title: 'Alertes SMS', text: 'Chaque matin, directement sur ton téléphone' },
];

const TRUST = [
  { icon: 'jobs', text: 'Des centaines d’offres en Guinée' },
  { icon: 'profile', text: 'Un accompagnement pour progresser' },
  { icon: 'search', text: 'Une recherche d’emploi plus efficace' },
];

const STEPS = [
  { n: '1', title: 'Crée ton profil', text: 'Compétences, formation, préférences : 5 minutes suffisent pour un profil complet.' },
  { n: '2', title: 'Reçois tes alertes SMS', text: 'Chaque matin à 7h00, les offres qui te correspondent arrivent sur ton téléphone.' },
  { n: '3', title: 'Postule en un clic', text: 'Ton CV et ta lettre partent avec ta candidature. Suis tout depuis ton espace.' },
];

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
      <div className="mk-brand"><span className="mk-dot" /> Carrière<span>OS</span></div>
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
            <span className="mock-notif-icon" aria-hidden="true">C</span>
            <b>CarrièreOS</b> <span>maintenant</span>
          </div>
            <strong>Alerte SMS – 7h00</strong>
          <p>3 nouvelles offres correspondent à votre profil.</p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [advice, setAdvice] = useState([]);
  const [q, setQ] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    api('/jobs').then((d) => setJobs(d.jobs.slice(0, 6))).catch(() => {});
    api('/stats').then(setStats).catch(() => {});
    api('/advice').then((d) => setAdvice(d.advice.slice(0, 3))).catch(() => {});
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    nav(`/jobs${q ? `?search=${encodeURIComponent(q)}` : ''}`);
  };

  return (
    <div className="landing">
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="hero-badge-tag">EMPLOIS · COMPÉTENCES · OPPORTUNITÉS</span>
              <span>POUR LA GUINÉE</span>
            </div>
            <h1>
              Trouve les offres<br />
              <span className="hero-accent">qui te correspondent.</span>
            </h1>
            <p className="hero-sub">
              Reçois des <b className="blue">alertes SMS</b> chaque matin et postule plus intelligemment.
            </p>

            <div className="feature-grid">
              {FEATURES.map((f) => (
                <div className="feature-card" key={f.title}>
                  <span className="feature-icon"><Icon name={f.icon} size={22} /></span>
                  <div>
                    <b>{f.title}</b>
                    <p>{f.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="trust-bar">
              {TRUST.map((t) => (
                <span key={t.text} className="trust-chip"><Icon name={t.icon} size={15} /> {t.text}</span>
              ))}
            </div>

            <div className="hero-cta">
              <Link to="/jobs" className="btn btn-primary btn-xl">Découvrir les offres <span aria-hidden="true">→</span></Link>
              <form className="hero-search" onSubmit={submitSearch}>
                <Icon name="search" size={16} />
                <input
                  value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Métier, mot-clé…" aria-label="Rechercher un emploi"
                />
              </form>
            </div>

            <div className="hero-url">
              <b>www.carriereOS.com/jobs</b>
              <span>Plateforme complète : <u>www.carriereOS.com</u></span>
            </div>
          </div>

          <div className="hero-visual">
            <DashboardMockup />
            <span className="hero-scribble">Le bon emploi.<br />Au bon moment.</span>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="stats-strip">
        <div className="container stats-inner">
          <div><strong>{stats ? `${stats.jobs}+` : '299+'}</strong><span>offres d’emploi</span></div>
          <div><strong>{stats ? stats.companies : '18'}+</strong><span>entreprises partenaires</span></div>
          <div><strong>{stats ? stats.cities : '12'}+</strong><span>villes couvertes</span></div>
          <div><strong>7h00</strong><span>alerte SMS chaque matin</span></div>
        </div>
      </section>

      {/* ============ OFFRES ============ */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="kicker">Offres d'emploi</span>
              <h2>Des centaines d’opportunités en Guinée & Afrique de l’Ouest</h2>
            </div>
            <Link to="/jobs" className="btn btn-outline">Voir toutes les offres →</Link>
          </div>
          <form className="jobs-search-hero" onSubmit={submitSearch}>
            <Icon name="search" size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un emploi, une entreprise…" />
            <button className="btn btn-primary" type="submit">Rechercher</button>
          </form>
          <div className="jobs-grid">
            {jobs.map((j) => <JobCard key={j.id} job={j} />)}
            {!jobs.length && <div className="empty">Chargement des offres…</div>}
          </div>
        </div>
      </section>

      {/* ============ MATCHING BANDE ============ */}
      <section className="section band">
        <div className="container band-inner">
          <div className="band-copy">
            <span className="kicker kicker-light">Matching intelligent</span>
            <h2>Chaque offre notée pour toi :<br />de 0 à 100 % de compatibilité</h2>
            <p>
              Notre moteur compare tes compétences, ta ville, ton niveau d’études et tes préférences
              à chaque offre. Au-delà de 80 %, postule les yeux fermés.
            </p>
            <ul className="band-list">
              <li><Icon name="check" size={16} /> Score de match affiché sur chaque offre</li>
              <li><Icon name="check" size={16} /> Détail du calcul : compétences, localisation, diplôme…</li>
              <li><Icon name="check" size={16} /> Alertes SMS limitées à tes meilleurs matchs</li>
            </ul>
            <Link to="/inscription" className="btn btn-white btn-xl">Créer mon profil gratuitement</Link>
          </div>
          <div className="band-visual">
            <div className="band-card">
              <div className="band-card-row">
                <div>
                  <b>Assistant Administratif</b>
                  <p>Conakry · Temps plein · Bac+2</p>
                </div>
                <MatchRing score={91} size={64} />
              </div>
              <div className="band-bars">
                {[['Compétences', 95], ['Localisation', 100], ['Type de contrat', 100], ['Niveau d’études', 78], ['Expérience', 82]].map(([l, v]) => (
                  <div className="band-bar" key={l}>
                    <span>{l}</span>
                    <div className="bar"><i style={{ width: `${v}%` }} /></div>
                    <b>{v}%</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ÉTAPES ============ */}
      <section className="section">
        <div className="container">
          <div className="section-head center">
            <div>
              <span className="kicker">Comment ça marche</span>
              <h2>Trois étapes pour trouver le bon emploi</h2>
            </div>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <div className="step" key={s.n}>
                <span className="step-num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SMS ============ */}
      <section className="section sms-section">
        <div className="container sms-inner">
          <div className="sms-copy">
            <span className="kicker">Alertes SMS</span>
            <h2>Le matin, ton emploi t’attend<br />sur ton téléphone</h2>
            <p>
              Pas besoin d’ouvrir un onglet : à 7h00, reçois directement par SMS les offres
              qui collent à ton profil. Active l’alerte depuis ton espace, en deux clics.
            </p>
            <Link to="/inscription" className="btn btn-primary btn-xl">Activer mes alertes →</Link>
          </div>
          <div className="sms-phone">
            <div className="sms-phone-head"><span>07:00</span><span>CarrièreOS</span></div>
            <div className="sms-bubble in">
              CarrièreOS: Bonjour Mamadou, <b>3 nouvelles offres</b> correspondent à votre profil
              (Conakry, Temps plein). Postulez → carriereOS.com/jobs
            </div>
            <div className="sms-bubble in">
              CarrièreOS: Alerte 7h00 — Assistant Administratif à Conakry, <b>match 91%</b>.
              Postulez → carriereOS.com/jobs
            </div>
            <div className="sms-bubble out">Je postule ce matin 💪</div>
          </div>
        </div>
      </section>

      {/* ============ CONSEILS ============ */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="kicker">Conseils carrière</span>
              <h2>Progresse grâce à nos conseils</h2>
            </div>
            <Link to="/conseils" className="btn btn-outline">Tous les conseils →</Link>
          </div>
          <div className="advice-grid">
            {advice.map((a) => (
              <Link to={`/conseils/${a.id}`} className="advice-card" key={a.id}>
                <span className="advice-cat" style={{ background: `${a.color}1a`, color: a.color }}>{a.category}</span>
                <h3>{a.title}</h3>
                <p>{a.excerpt}</p>
                <span className="advice-more" style={{ color: a.color }}>{a.minutes} min de lecture →</span>
              </Link>
            ))}
            {!advice.length && <div className="empty">Chargement…</div>}
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="section final-cta">
        <div className="container final-cta-inner">
          <h2>Prêt(e) à trouver le bon emploi ?</h2>
          <p>Rejoins les candidats qui reçoivent chaque matin les offres faites pour eux.</p>
          <div className="final-cta-actions">
            <Link to="/inscription" className="btn btn-white btn-xl">Créer mon compte</Link>
            <Link to="/jobs" className="btn btn-ghost-light btn-xl">Découvrir les offres →</Link>
          </div>
          <div className="hero-url light">
            <b>www.carriereOS.com/jobs</b>
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
            <p className="footer-muted">Plateforme d’emploi — Guinée & Afrique de l’Ouest</p>
          </div>
          <div className="footer-cols">
            <div>
              <b>Plateforme</b>
              <Link to="/jobs">Offres d’emploi</Link>
              <Link to="/conseils">Conseils carrière</Link>
              <Link to="/inscription">Alertes SMS</Link>
            </div>
            <div>
              <b>Candidat</b>
              <Link to="/connexion">Connexion</Link>
              <Link to="/inscription">Créer un compte</Link>
              <Link to="/app/profil">Mon profil</Link>
            </div>
            <div>
              <b>Contact</b>
              <span>www.carriereOS.com</span>
              <span>Conakry, Guinée</span>
              <span>contact@carriereos.com</span>
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 CarrièreOS — Tous droits réservés.</span>
          <span>Fait avec ❤ en Guinée 🇬🇳</span>
        </div>
      </footer>
    </div>
  );
}
