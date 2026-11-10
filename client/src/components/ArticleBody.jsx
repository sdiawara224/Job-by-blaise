// Rendu partagé entre l'article public et son aperçu d'administration.
// Aucun HTML injecté : React échappe le texte, y compris à l'intérieur du gras.
export default function ArticleBody({ text }) {
  return String(text || '').split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="art-gap" />;
    const className = /^\d+\.\s/.test(line) ? 'art-li numbered' : line.startsWith('- ') ? 'art-li dash' : 'art-p';
    const content = line.startsWith('- ') ? line.slice(2) : line;
    return <p className={className} key={i}>{content.split(/(\*\*.+?\*\*)/g).map((part, j) => part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <b key={j}>{part.slice(2, -2)}</b> : part)}</p>;
  });
}
