import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../auth.jsx';
import { CandidateActivityProvider, useCandidateActivity } from '../candidateActivity.jsx';

const NAV = [
  { to: '/app', icon: 'home', label: 'Accueil', end: true },
  { to: '/app/offres', icon: 'jobs', label: 'Offres d’emploi' },
  { to: '/app/profil', icon: 'profile', label: 'Mon profil' },
  { to: '/app/candidatures', icon: 'apps', label: 'Mes candidatures' },
  { to: '/app/notifications', icon: 'bell', label: 'Notifications', notifications: true },
  { to: '/app/alertes', icon: 'bell', label: 'Mes alertes', badge: true },
  { to: '/app/conseils', icon: 'advice', label: 'Conseils carrière' },
];

export default function AppLayout() {
  return <CandidateActivityProvider><AppShell /></CandidateActivityProvider>;
}

function AppShell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { data, error, refresh } = useCandidateActivity();
  const unread = data?.unreadSms || 0;
  const unreadNotifications = data?.unreadNotifications || 0;

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
              {(n.notifications ? unreadNotifications : n.badge ? unread : 0) > 0 && <em className="sidebar-badge">{n.notifications ? unreadNotifications : unread}</em>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          {user?.isAdmin && <Link to="/admin" className="sidebar-link"><Icon name="settings" size={18} /><span>Administration</span></Link>}
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
            <Link to="/app/notifications" className="icon-btn" title="Notifications de candidatures" aria-label={`Notifications : ${unreadNotifications} non lue${unreadNotifications > 1 ? 's' : ''}`}>
              <Icon name="bell" size={19} />
              {unreadNotifications > 0 && <em className="dot-badge" />}
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
          {error && <div className="form-error" role="alert">Actualisation des candidatures et notifications impossible : {error} <button className="link-btn" onClick={refresh}>Réessayer</button></div>}
          {unreadNotifications > 0 && <div className="candidate-notice" role="status"><Icon name="bell" size={18} /><Link to="/app/notifications">{unreadNotifications} notification{unreadNotifications > 1 ? 's' : ''} de candidature non lue{unreadNotifications > 1 ? 's' : ''} — Consulter</Link></div>}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
