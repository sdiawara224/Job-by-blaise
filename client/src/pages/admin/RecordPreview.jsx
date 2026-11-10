import Icon from '../../components/Icon.jsx';
import ArticleBody from '../../components/ArticleBody.jsx';
import { fmtSalary } from '../../api.js';

const Paragraphs = ({ text, placeholder }) => text?.trim() ? String(text).split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>) : <p className="adm-preview-placeholder">{placeholder}</p>;
export default function RecordPreview({ section, form, companies }) {
  const selected = companies.find((c) => String(c.id) === String(form.company_id));
  const color = /^#[a-f\d]{6}$/i.test(form.color) ? form.color : '#2E6BFF';
  const skills = String(form.skills || '').split(',').map((v) => v.trim()).filter(Boolean);
  return <section className="adm-record-preview" aria-label="Aperçu local du contenu">
    <div className="adm-local-preview-note"><Icon name="eye" size={17} /><div><b>Aperçu avant enregistrement</b><p>Vos saisies uniquement. Cette vue ne publie aucun contenu.</p></div></div>
    {section === 'jobs' && <article className="adm-job-preview">
      <div className="adm-preview-company"><span><Icon name="briefcase" size={23} /></span><div><b>{selected?.name || 'Entreprise à sélectionner'}</b><small>{form.domain || 'Domaine à renseigner'}</small></div><span className={`adm-badge ${Number(form.is_active) ? 'green' : 'gray'}`}>{Number(form.is_active) ? 'À publier' : 'Non publiée'}</span></div>
      <h3>{form.title || 'Intitulé du poste'}</h3>
      <div className="adm-job-preview-meta"><span><Icon name="pin" size={15} />{[form.city, form.country].filter(Boolean).join(', ') || 'Localisation à renseigner'}</span><span><Icon name="clock" size={15} />{form.contract || 'Contrat à renseigner'}</span></div>
      <div className="adm-preview-salary">{fmtSalary(Number(form.salary_min) || 0, Number(form.salary_max) || 0)}</div>
      <section><h4>À propos du poste</h4><Paragraphs text={form.description} placeholder="La description du poste apparaîtra ici." /></section>
      <section><h4>Profil recherché</h4><Paragraphs text={form.requirements} placeholder="Les prérequis apparaîtront ici." /></section>
      {(form.education_min || Number(form.experience_min) > 0) && <div className="adm-job-preview-meta">{form.education_min && <span>{form.education_min}</span>}{Number(form.experience_min) > 0 && <span>{form.experience_min} an{Number(form.experience_min) > 1 ? 's' : ''} d’expérience minimum</span>}</div>}
      {skills.length > 0 && <section><h4>Compétences</h4><div className="adm-cv-skills">{skills.map((s, i) => <span key={i}>{s}</span>)}</div></section>}
    </article>}
    {section === 'advice' && <article className="adm-article-preview"><span className="adm-article-category" style={{ color, background: `${color}15` }}>{form.category || 'Catégorie'}</span><h3>{form.title || 'Titre de votre article'}</h3><div className="adm-job-preview-meta"><span><Icon name="clock" size={15} />{form.minutes || '—'} min de lecture</span><span>L’équipe Job by blaise</span></div>{form.excerpt && <aside className="adm-article-excerpt"><small>RÉSUMÉ DANS LA LISTE DES CONSEILS</small><p>{form.excerpt}</p></aside>}<div className="article-body">{form.content?.trim() ? <ArticleBody text={form.content} /> : <p className="adm-preview-placeholder">Le texte de votre article apparaîtra ici. Utilisez **gras** et des listes avec des tirets.</p>}</div></article>}
    {section === 'companies' && <article className="adm-company-preview" style={{ '--preview-brand': color }}><div className="adm-company-cover"><Icon name="briefcase" size={42} /><span>{form.sector || 'Secteur d’activité'}</span></div><span className="adm-company-preview-logo">{String(form.name || 'J').split(' ').filter(Boolean).slice(0, 2).map((v) => v[0]).join('').toUpperCase()}</span><div className="adm-company-preview-copy"><h3>{form.name || 'Nom de l’entreprise'}</h3><div className="adm-job-preview-meta"><span><Icon name="pin" size={15} />{form.city || 'Ville à renseigner'}</span>{form.founded_year && <span>Créée en {form.founded_year}</span>}{form.staff_size && <span>{form.staff_size}</span>}</div><Paragraphs text={form.description} placeholder="La présentation de votre entreprise apparaîtra ici." /></div></article>}
    <p className="adm-preview-disclaimer">Composition simplifiée. Les liens, recommandations et actions du site public ne sont pas actifs dans cet aperçu.</p>
  </section>;
}
