import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', to = '/' }) {
  return (
    <Link to={to} className={`logo logo-${size}`} aria-label="CarrièreOS — accueil">
      <svg className="logo-mark" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="30" fill="#2E6BFF" />
        <path d="M45 25.5a13.5 13.5 0 1 0 0 13" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />
        <circle cx="46" cy="45" r="6" fill="#00A868" stroke="#fff" strokeWidth="3" />
      </svg>
      <span className="logo-word">
        Carrière<span className="logo-os">OS</span>
      </span>
    </Link>
  );
}
