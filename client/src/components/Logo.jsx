import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', to = '/' }) {
  return (
    <Link to={to} className={`logo logo-${size}`} aria-label="Job by blaise — accueil">
      <svg className="logo-mark" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="30" fill="#2E6BFF" />
        <path d="M43 17V37Q43 49 31 49Q23 49 19 44" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />
        <circle cx="46" cy="45" r="6" fill="#00A868" stroke="#fff" strokeWidth="3" />
      </svg>
      <span className="logo-word">
        Job by <span className="logo-os">blaise</span>
      </span>
    </Link>
  );
}
