import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../api.js';

// Petit rendu markdown léger : **gras**, listes, titres numérotés, paragraphes
function renderContent(text) {
  const lines = String(text || '').split('\n');
  return lines.map((line, i) => {
    const html = line
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    if (!html.trim()) return <div key={i} className="art-gap" />;
    if (/^\d+\.\s/.test(html)) return <p key={i} className="art-li" dangerouslySetInnerHTML={{ __html: html }} />;
    if (html.startsWith('- ')) return <p key={i} className="art-li dash" dangerouslySetInnerHTML={{ __html: html }} />;
    if (html.includes(':') && html.length < 90 && !html.startsWith('<b>')) {
      return <p key={i} className="art-p" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return <p key={i} className="art-p" dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

export default function AdviceDetail({ inApp = false }) {
  const { id } = useParams();
  const [art, setArt] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api(`/advice/${id}`).then((d) => setArt(d.article)).catch((e) => setErr(e.message));
  }, [id]);

  useEffect(() => {
    if (art) document.title = `${art.title} | CarrièreOS`;
  }, [art]);

  if (err) return <div className="page-loader">{err}</div>;
  if (!art) return <div className="page-loader">Chargement…</div>;

  const back = inApp ? '/app/conseils' : '/conseils';

  return (
    <div className="page">
      {!inApp && <Navbar />}
      <main className={`container section-tight ${inApp ? 'in-app-main' : ''}`}>
        <div className="crumbs">
          <Link to={back}>← Tous les conseils</Link>
        </div>
        <article className="article card">
          <span className="advice-cat" style={{ background: `${art.color}1a`, color: art.color }}>{art.category}</span>
          <h1>{art.title}</h1>
          <div className="article-meta">
            <span><Icon name="clock" size={14} /> {art.minutes} min de lecture</span>
            <span>· CarrièreOS Équipe</span>
          </div>
          <div className="article-body">
            {renderContent(art.content)}
          </div>
          <div className="article-cta">
            <div>
              <b>Prêt(e) à passer à l’action ?</b>
              <p>Active tes alertes 7h00 et postule aux offres à fort matching.</p>
            </div>
            <Link to="/app/alertes" className="btn btn-primary">Activer mes alertes →</Link>
          </div>
        </article>
      </main>
      {!inApp && (
        <footer className="footer footer-slim">
          <div className="container footer-bottom">
            <span>© 2026 CarrièreOS — Le bon emploi. Au bon moment.</span>
            <span>www.carriereOS.com/jobs</span>
          </div>
        </footer>
      )}
    </div>
  );
}
