import { Link } from 'react-router-dom';

export function Stars({ rating = 4.5, size = 14 }) {
  const full = Math.round(rating);
  return (
    <span className="stars" style={{ fontSize: size }} title={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= full ? 'star on' : 'star'}>★</span>
      ))}
      <em>{Number(rating).toFixed(1)}</em>
    </span>
  );
}

export default function CompanyCard({ company }) {
  const initials = (company.name || '?')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <Link to={`/entreprises/${company.id}`} className="company-card">
      <div
        className="company-cover"
        style={{
          background: `linear-gradient(135deg, ${company.color} 0%, ${company.color}cc 55%, #0a1b4dee 130%)`,
        }}
      >
        <span className="company-cover-sector">{company.sector}</span>
        <span className="company-cover-blob" />
      </div>
      <div className="company-card-logo" style={{ background: company.color }}>
        {initials}
      </div>
      <div className="company-card-body">
        <b>{company.name}</b>
        <span className="company-card-city">📍 {company.city}</span>
        <div className="company-card-meta">
          <span>Crée en {company.foundedYear}</span>
          <span>·</span>
          <span>{company.staffSize}</span>
        </div>
        <Stars rating={company.rating} />
        <span className="company-card-jobs">
          {company.jobCount} offre{company.jobCount > 1 ? 's' : ''} d'emploi disponible{company.jobCount > 1 ? 's' : ''}
        </span>
      </div>
    </Link>
  );
}
