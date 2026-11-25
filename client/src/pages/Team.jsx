import { useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import TeamCard from '../components/TeamCard.jsx';
import useApiResource from '../hooks/useApiResource.js';
import ResourceError from '../components/ResourceError.jsx';
import Icon from '../components/Icon.jsx';

export default function Team() {
  const { data, loading, error, reload } = useApiResource('/team');
  const members = data?.members || [];
  useEffect(() => { document.title = 'Notre équipe | Job by blaise'; }, []);

  return (
    <div className="page team-page">
      <Navbar />
      <main className="container team-section">
        <header className="team-heading">
          <span className="team-eyebrow">Notre équipe</span>
          <h1>Les visages derrière Job by blaise</h1>
          <p>Découvrez les personnes qui font vivre votre plateforme d’emploi.</p>
        </header>
        {loading ? <div className="empty" role="status">Chargement de l’équipe…</div> : error ? <ResourceError message={error} retry={reload} /> : members.length ? (
          <div className="team-grid">{members.map(member => <TeamCard key={member.id} member={member} />)}</div>
        ) : (
          <>
            <p className="team-empty" role="status">La présentation de notre équipe sera disponible prochainement.</p>
            <div className="team-grid" aria-label="Présentation de l’équipe à venir">
              {[1, 2, 3].map(number => <article className="team-card team-card-upcoming" key={number}>
                <div className="team-card-photo"><div className="team-photo-placeholder"><Icon name="profile" size={56} /><span>Photo à venir</span></div></div>
                <div className="team-card-copy"><h2>Présentation à venir</h2><p>Les profils seront ajoutés prochainement.</p></div>
              </article>)}
            </div>
          </>
        )}
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
