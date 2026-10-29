import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';

const NAV = [
  { to: '/app', icon: 'home', label: 'Accueil', end: true },
  { to: '/app/offres', icon: 'jobs', label: 'Offres d’emploi' },
  { to: '/app/profil', icon: 'profile', label: 'Mon profil' },
  { to: '/app/candidatures', icon: 'apps', label: 'Mes candidatures' },
  { to: '/app/alertes', icon: 'bell', label: 'Mes alertes', badge: true },
  { to: '/app/conseils', icon: 'advice', label: 'Conseils carrière' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api('/alerts').then((d) => setUnread(d.unread || 0)).catch(() => {});
  }, []);

  const initials = (user?.fullName || 'U')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-head">
          <Logo to="/app" />
        </div>
        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="sidebar-link">
              <Icon name={n.icon} size={19} />
              <span>{n.label}</span>
              {n.badge && unread > 0 && <em className="sidebar-badge">{unread}</em>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <Link to="/jobs" className="sidebar-link subtle"><Icon name="search" size={18} /><span>Voir le site public</span></Link>
          <button className="sidebar-link subtle" onClick={() => { logout(); nav('/'); }}>
            <Icon name="logout" size={18} /><span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="app-body">
        <header className="app-topbar">
          <div className="app-topbar-search">
            <Icon name="search" size={16} />
            <Link to="/app/offres">Rechercher un emploi, une entreprise…</Link>
          </div>
          <div className="app-topbar-user">
            <Link to="/app/alertes" className="icon-btn" title="Alertes SMS">
              <Icon name="bell" size={19} />
              {unread > 0 && <em className="dot-badge" />}
            </Link>
            <Link to="/app/profil" className="user-chip">
              <span className="user-avatar">{initials}</span>
              <span className="user-chip-text">
                <b>{user?.fullName}</b>
                <small>{user?.city}, Guinée</small>
              </span>
            </Link>
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
