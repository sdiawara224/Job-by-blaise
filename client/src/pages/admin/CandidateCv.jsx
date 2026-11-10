import Icon from '../../components/Icon.jsx';

const text = (v) => ['string', 'number'].includes(typeof v) ? String(v) : '';
const parse = (v, fallback) => { try { return typeof v === 'string' ? JSON.parse(v) : v ?? fallback; } catch { return fallback; } };
const entries = (v) => Array.isArray(v) ? v.filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry)) : [];

export default function CandidateCv({ record }) {
  const raw = parse(record.cv, {});
  const cv = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const experiences = entries(cv.experiences).filter((v) => ['role', 'org', 'period', 'detail'].some((key) => text(v[key]).trim()));
  const education = entries(cv.education).filter((v) => ['level', 'org', 'period'].some((key) => text(v[key]).trim()));
  const skills = parse(record.skills, []);
  const hasCv = text(cv.summary).trim() || experiences.length || education.length;
  return <section className="adm-cv" aria-label="CV enregistré du candidat">
    <div className="adm-cv-readonly"><Icon name="lock" size={14} /><span>CV enregistré · lecture seule</span></div>
    <header className="adm-cv-header"><span className="adm-cv-avatar"><Icon name="profile" size={29} /></span><h3>{record.full_name}</h3>{record.title && <p>{record.title}</p>}<div>{[record.city, record.email, record.phone].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}</div></header>
    {!hasCv && <div className="adm-cv-empty"><Icon name="apps" size={28} /><h4>Le CV reste à compléter.</h4><p>Ce candidat n’a pas encore renseigné de résumé, d’expérience ou de formation dans son CV.</p></div>}
    {text(cv.summary).trim() && <section className="adm-cv-section"><h4><Icon name="profile" size={16} />Résumé professionnel</h4><p className="adm-prewrap">{text(cv.summary)}</p></section>}
    {experiences.length > 0 && <section className="adm-cv-section"><h4><Icon name="briefcase" size={16} />Expériences professionnelles</h4><ol>{experiences.map((v, i) => <li key={i}><div><h5>{text(v.role) || 'Expérience professionnelle'}</h5>{text(v.period) && <span>{text(v.period)}</span>}</div>{text(v.org) && <b>{text(v.org)}</b>}{text(v.detail) && <p className="adm-prewrap">{text(v.detail)}</p>}</li>)}</ol></section>}
    {education.length > 0 && <section className="adm-cv-section"><h4><Icon name="advice" size={16} />Formation</h4><ol>{education.map((v, i) => <li key={i}><div><h5>{text(v.level) || 'Formation'}</h5>{text(v.period) && <span>{text(v.period)}</span>}</div>{text(v.org) && <b>{text(v.org)}</b>}</li>)}</ol></section>}
    {Array.isArray(skills) && skills.some((s) => text(s).trim()) && <section className="adm-cv-section"><h4><Icon name="star" size={16} />Compétences du profil</h4><div className="adm-cv-skills">{skills.filter((s) => text(s).trim()).map((s, i) => <span key={i}>{text(s)}</span>)}</div></section>}
    <p className="adm-cv-footer">Les expériences et formations sont renseignées par le candidat dans son espace personnel.</p>
  </section>;
}
