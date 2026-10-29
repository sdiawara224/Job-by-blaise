import { Link, NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../auth.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Logo />
        <nav className="navbar-links">
          <NavLink to="/jobs">Emplois</NavLink>
          <NavLink to="/entreprises">Entreprises</NavLink>
          <NavLink to="/conseils">Conseils carrière</NavLink>
        </nav>
        <div className="navbar-actions">
          {user ? (
            <>
              <Link to="/app" className="btn btn-ghost btn-sm">Mon espace</Link>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { logout(); nav('/'); }}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/connexion" className="btn btn-ghost btn-sm">Connexion</Link>
              <Link to="/inscription" className="btn btn-primary btn-sm">Créer un compte</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
