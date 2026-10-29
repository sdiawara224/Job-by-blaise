import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import CompanyCard from '../components/CompanyCard.jsx';
import { api } from '../api.js';

export default function Entreprises() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    api('/companies').then((d) => setCompanies(d.companies)).catch(() => {});
    document.title = 'Entreprises qui recrutent | CarrièreOS';
  }, []);

  return (
    <div className="page">
      <Navbar />
      <section className="page-hero">
        <div className="container">
          <span className="kicker">Entreprises</span>
          <h1>Les entreprises qui recrutent</h1>
          <p>Explorez les entreprises qui recrutent et découvrez les opportunités qu'elles offrent en Guinée et en Afrique de l'Ouest.</p>
        </div>
      </section>

      <main className="container section-tight">
        <div className="company-grid">
          {companies.map((c) => <CompanyCard key={c.id} company={c} />)}
          {!companies.length && <div className="empty">Chargement des entreprises…</div>}
        </div>
      </main>

      <footer className="footer footer-slim">
        <div className="container footer-bottom">
          <span>© 2026 CarrièreOS — Le bon emploi. Au bon moment.</span>
          <span>www.carriereOS.com/jobs</span>
        </div>
      </footer>
    </div>
  );
}
