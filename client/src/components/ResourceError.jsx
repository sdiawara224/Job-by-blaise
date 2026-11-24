import { Link } from 'react-router-dom';

export default function ResourceError({ message, retry, backTo, backLabel }) {
  return <div className="empty empty-lg" role="alert">
    <b>Impossible de charger ce contenu</b>
    <p>{message}</p>
    <button className="btn btn-outline" onClick={retry}>Réessayer</button>
    {backTo && <Link to={backTo} className="link-btn">{backLabel || 'Retour'}</Link>}
  </div>;
}
