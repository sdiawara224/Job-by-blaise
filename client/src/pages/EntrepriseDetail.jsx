import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import JobCard from '../components/JobCard.jsx';
import { Stars } from '../components/CompanyCard.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../api.js';

export default function EntrepriseDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api(`/companies/${id}`)
      .then((d) => {
        setData(d);
        if (d?.company) document.title = `${d.company.name} — offres d'emploi | Job by blaise`;
      })
      .catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <div className="page-loader">{err}</div>;
  if (!data) return <div className="page-loader">Chargement de l'entreprise…</div>;

  const { company, jobs } = data;
  const initials = company.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="page">
      <Navbar />
      <main className="container section-tight">
        <div className="crumbs">
          <Link to="/entreprises">← Toutes les entreprises</Link>
        </div>

        <header
          className="company-hero"
          style={{ background: `linear-gradient(120deg, ${company.color} 0%, ${company.color}dd 45%, #0a1b4d 130%)` }}
        >
          <div className="company-hero-logo" style={{ background: company.color }}>{initials}</div>
          <div className="company-hero-copy">
            <span className="company-hero-sector">{company.sector}</span>
            <h1>{company.name}</h1>
            <div className="company-hero-meta">
              <span><Icon name="pin" size={14} /> {company.city}</span>
              <span>Crée en {company.foundedYear}</span>
              <span>{company.staffSize}</span>
              <Stars rating={company.rating} size={15} />
            </div>
          </div>
          <div className="company-hero-jobs">
            <b>{company.jobCount}</b>
            <span>offre{company.jobCount > 1 ? 's' : ''}</span>
          </div>
        </header>

        <section className="card company-desc">
          <h2>À propos</h2>
          <p>{company.description}</p>
        </section>

        <section className="dash-block" style={{ marginTop: 26 }}>
          <div className="block-head">
            <h2><Icon name="jobs" size={18} /> Offres ouvertes chez {company.name}</h2>
            <Link to="/jobs" className="link-btn">Toutes les offres →</Link>
          </div>
          <div className="jobs-grid">
            {jobs.map((j) => <JobCard key={j.id} job={j} />)}
            {!jobs.length && (
              <div className="empty">
                <b>Aucune offre ouverte pour le moment</b>
                <p>Reviens bientôt ou active tes alertes SMS pour être prévenu.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer footer-slim">
        <div className="container footer-bottom">
          <span>© 2026 Job by blaise — Le bon emploi. Au bon moment.</span>
          <span>www.jobbyblaise.com/jobs</span>
        </div>
      </footer>
    </div>
  );
}
