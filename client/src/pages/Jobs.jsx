import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import JobsBoard from '../components/JobsBoard.jsx';
import { useAuth } from '../auth.jsx';

export default function Jobs() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const search = params.get('search') || '';

  useEffect(() => {
    document.title = search ? `${search} — Offres d'emploi | Job by blaise` : 'Offres d’emploi en Guinée | Job by blaise';
  }, [search]);

  return (
    <div className="page">
      <Navbar />
      <section className="page-hero">
        <div className="container reveal">
          <span className="kicker">Emplois · Guinée & Afrique de l’Ouest</span>
          <h1>{search ? `« ${search} »` : 'Trouve les offres qui te correspondent'}</h1>
          <p>{user ? 'Les taux de match sont calculés pour ton profil.' : 'Des centaines d’offres, un matching intelligent, des alertes SMS chaque matin.'}</p>
        </div>
      </section>
      <main className="container section-tight">
        <JobsBoard />
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
