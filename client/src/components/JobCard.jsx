import { Link } from 'react-router-dom';
import MatchRing from './MatchRing.jsx';
import Icon from './Icon.jsx';
import { fmtSalary, fmtDate } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function JobCard({ job, to }) {
  const { user } = useAuth();
  const href = to || `/jobs/${job.id}`;
  const c = job.company || {};
  return (
    <article className="job-card">
      <div className="job-card-head">
        <div className="company-avatar" style={{ background: c.color || '#2E6BFF' }}>
          {(c.name || '?').slice(0, 2).toUpperCase()}
        </div>
        <div className="job-card-head-text">
          <Link to={href} className="job-card-title">{job.title}</Link>
          <div className="job-card-company">{c.name} · {job.city}, {job.country}</div>
        </div>
        {user && job.match ? (
          <MatchRing score={job.match.score} size={56} stroke={5} label={false} />
        ) : (
          <span className="job-card-date">{fmtDate(job.postedAt)}</span>
        )}
      </div>

      <div className="chip-row">
        <span className="chip"><Icon name="briefcase" size={13} /> {job.contract}</span>
        <span className="chip"><Icon name="pin" size={13} /> {job.city}</span>
        <span className="chip chip-domain">{job.domain}</span>
        {job.educationMin && <span className="chip">{job.educationMin}</span>}
      </div>

      <p className="job-card-desc">{String(job.description || '').split('\n')[0]}</p>

      <div className="job-card-foot">
        <span className="job-salary">{fmtSalary(job.salaryMin, job.salaryMax)}</span>
        <Link to={href} className="btn btn-ghost btn-sm">
          Voir l'offre <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
