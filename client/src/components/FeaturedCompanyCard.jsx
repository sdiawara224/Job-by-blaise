import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

// Grandes cartes de la landing. Les données viennent du même annuaire que
// le bandeau : pas de partenaires ni de nombres d'offres inventés.
export default function FeaturedCompanyCard({ company }) {
  const initials = company.name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();
  const count = Number(company.jobCount || 0);
  return (
    <Link to={`/entreprises/${company.id}`} className="featured-company" style={{ '--company-color': company.color || '#2e6bff' }}>
      <div className="featured-company-cover">
        <span className="featured-company-sector">{company.sector}</span>
        <strong>Votre talent.<br />Leur prochain<br /><em>grand projet.</em></strong>
        <svg className="featured-company-art" viewBox="0 0 180 200" fill="none" aria-hidden="true">
          <circle cx="115" cy="90" r="75" fill="white" opacity=".1" />
          <path d="M30 200V100l38-20v120M75 200V58l47-23v165M131 200V115l30-15v100" fill="white" opacity=".18" />
          <path d="M88 79h8m9 0h5M88 99h8m9 0h5M88 119h8m9 0h5M43 118h10m-10 21h10m-10 21h10m88-26h8m-8 20h8" stroke="white" strokeWidth="5" opacity=".5" />
          <path d="m35 62 23-20 25 8 44-38m-23 0h23v23" stroke="#ffd477" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="featured-company-content">
        <span className="featured-company-logo" aria-hidden="true">{initials}</span>
        <h3>{company.name}</h3>
        <div className="featured-company-facts">
          <span><Icon name="pin" size={16} />{company.city}</span>
          {company.foundedYear && <span><Icon name="calendar" size={16} />Créée en {company.foundedYear}</span>}
          {company.staffSize && <span><Icon name="team" size={16} />{company.staffSize}</span>}
        </div>
        <div className="featured-company-bottom">
          <span>{count} offre{count !== 1 ? 's' : ''} d’emploi disponible{count !== 1 ? 's' : ''}</span>
          <span className="featured-company-arrow" aria-hidden="true">↗</span>
        </div>
      </div>
    </Link>
  );
}
