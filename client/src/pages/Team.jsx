import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Icon from '../components/Icon.jsx';

export default function Team() {
  useEffect(() => { document.title = 'Notre équipe | Job by blaise'; }, []);

  return (
    <div className="page">
      <Navbar />
      <section className="page-hero">
        <div className="container">
          <span className="kicker">Notre équipe</span>
          <h1>Les visages derrière Job by blaise</h1>
          <p>Découvrez prochainement les personnes qui font vivre le portail.</p>
        </div>
      </section>
      <main className="container section-tight">
        <section className="card team-introduction" aria-labelledby="team-introduction-title">
          <span className="team-introduction-icon"><Icon name="team" size={32} /></span>
          <h2 id="team-introduction-title">Faisons connaissance</h2>
          <p>La présentation des membres de notre équipe sera disponible prochainement : portraits, fonctions et parcours.</p>
          <p className="muted">En attendant, explorez les opportunités et les conseils de Job by blaise.</p>
          <div className="team-introduction-actions">
            <Link to="/jobs" className="btn btn-primary">Découvrir les offres</Link>
            <Link to="/conseils" className="btn btn-outline">Nos conseils carrière</Link>
          </div>
        </section>
      </main>
      <footer className="footer footer-slim">
        <div className="container footer-bottom">
          <span>© 2026 Job by blaise — Le bon emploi. Au bon moment.</span>
          <span>www.jobbyblaise.com</span>
        </div>
      </footer>
    </div>
  );
}
