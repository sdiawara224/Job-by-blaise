import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { api } from '../../api.js';
import { CONTENT_FIELDS } from '../../siteContent.js';

export const CONTENT_GROUPS = [
  { id: 'hero', label: 'Accueil', icon: 'home', title: 'La première impression compte.', hint: 'Une promesse claire pour donner envie de trouver le bon emploi.', keys: ['heroEyebrow', 'heroRegion', 'heroSubtitle'] },
  { id: 'companies', label: 'Entreprises', icon: 'briefcase', title: 'Les recruteurs à l’honneur.', hint: 'Présentez les entreprises qui donnent des perspectives à votre communauté.', keys: ['recruitersCaption'] },
  { id: 'cv', label: 'CV', icon: 'profile', title: 'Un profil qui ouvre des portes.', hint: 'Expliquez la valeur du CV et invitez les candidats à se lancer.', keys: ['cvTitle', 'cvText', 'cvStrong', 'cvButton'] },
  { id: 'matching', label: 'Matching', icon: 'search', title: 'La bonne rencontre professionnelle.', hint: 'Mettez en mots la promesse de votre moteur de recherche.', keys: ['matchTitle', 'matchText', 'matchHint'] },
  { id: 'journey', label: 'Parcours', icon: 'apps', title: 'Trois étapes, un nouveau départ.', hint: 'Rendez le parcours candidat simple et rassurant.', keys: ['joinTitle', 'joinText', 'step1Title', 'step1Text', 'step2Title', 'step2Text', 'step3Title', 'step3Text'] },
  { id: 'invitation', label: 'Invitation', icon: 'external', title: 'Donnez envie de passer à l’action.', hint: 'Une dernière invitation avant de rejoindre la plateforme.', keys: ['finalTitle', 'finalText'] },
  { id: 'footer', label: 'Pied de page', icon: 'layout', title: 'Gardez le lien avec vos visiteurs.', hint: 'Votre signature et vos informations de contact, toujours à jour.', keys: ['footerTag', 'footerDescription', 'contactLocation', 'contactEmail'] },
];

export function ContentPreview({ group, content: c, jobCount }) {
  return <div className={`adm-copy-preview adm-preview-${group}`} aria-label="Aperçu des textes non enregistrés">
    {group === 'hero' && <><span className="adm-preview-eyebrow">{c.heroEyebrow}</span><h3><strong>{jobCount ?? 'Des'} offres d’emploi</strong> {c.heroRegion}</h3><p>{c.heroSubtitle}</p><div className="adm-preview-search"><Icon name="search" size={18} /><span>Poste ou mot-clé</span><b>Rechercher ↗</b></div></>}
    {group === 'companies' && <><span className="adm-preview-symbol"><Icon name="briefcase" size={26} /></span><h3>Ils recrutent sur Job by blaise</h3><p>{c.recruitersCaption}</p><div className="adm-preview-skeleton" aria-hidden="true"><i /><i /><i /></div></>}
    {group === 'cv' && <><span className="adm-preview-eyebrow">CV</span><h3>{c.cvTitle}</h3><p>{c.cvText}</p><p><b>{c.cvStrong}</b></p><span className="adm-preview-cta">{c.cvButton} ↗</span></>}
    {group === 'matching' && <><span className="adm-preview-eyebrow">MATCHING</span><h3>{c.matchTitle}</h3><p>{c.matchText}</p><p><b>{c.matchHint}</b></p><div className="adm-preview-search"><Icon name="search" size={18} /><span>Poste recherché…</span></div></>}
    {group === 'journey' && <><span className="adm-preview-eyebrow">3 ÉTAPES</span><h3>{c.joinTitle}</h3><p>{c.joinText}</p><ol className="adm-preview-steps">{[1, 2, 3].map((i) => <li key={i}><span>{i}</span><div><h4>{c[`step${i}Title`]}</h4><p>{c[`step${i}Text`]}</p></div></li>)}</ol></>}
    {group === 'invitation' && <><span className="adm-preview-symbol"><Icon name="external" size={26} /></span><h3>{c.finalTitle}</h3><p>{c.finalText}</p><span className="adm-preview-cta">Créer mon compte ↗</span></>}
    {group === 'footer' && <><div className="adm-preview-brand"><span>J</span><b>Job by blaise</b></div><h3>{c.footerTag}</h3><p>{c.footerDescription}</p><hr /><p><Icon name="pin" size={15} />{c.contactLocation}</p><p><Icon name="sms" size={15} />{c.contactEmail}</p></>}
  </div>;
}

export default function ContentEditor({ notify, onDirtyChange, jobCount }) {
  const [content, setContent] = useState(null), [saved, setSaved] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [groupId, setGroupId] = useState('hero'), [retry, setRetry] = useState(0), [invalid, setInvalid] = useState('');
  const tabs = useRef([]);
  const group = CONTENT_GROUPS.find((g) => g.id === groupId);
  const changed = content && saved ? CONTENT_FIELDS.filter(([key]) => content[key] !== saved[key]).map(([key]) => key) : [];
  const dirty = changed.length > 0;
  useEffect(() => {
    let active = true;
    setError('');
    api('/admin/content').then((d) => { if (active) { setContent(d.content); setSaved(d.content); } }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => { onDirtyChange(dirty); return () => onDirtyChange(false); }, [dirty, onDirtyChange]);
  useEffect(() => {
    const handler = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  useEffect(() => { if (invalid) document.getElementById(`adm-content-${invalid}`)?.focus(); }, [invalid, groupId]);
  const save = async (e) => {
    e.preventDefault(); setError(''); setInvalid('');
    const bad = CONTENT_FIELDS.find(([key]) => typeof content[key] !== 'string' || !content[key].trim() || content[key].length > 2000 || (key === 'contactEmail' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content[key])));
    if (bad) {
      setGroupId(CONTENT_GROUPS.find((g) => g.keys.includes(bad[0])).id); setInvalid(bad[0]);
      setError(`${bad[1]} : renseignez ${bad[0] === 'contactEmail' ? 'une adresse e-mail valide' : 'un texte de 1 à 2 000 caractères'}.`); return;
    }
    setBusy(true);
    try {
      const d = await api('/admin/content', { method: 'PUT', body: { content } });
      setContent(d.content); setSaved(d.content); notify('Page d’accueil mise à jour.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const keyTab = (e, index) => {
    const n = CONTENT_GROUPS.length;
    const next = e.key === 'ArrowRight' ? (index + 1) % n : e.key === 'ArrowLeft' ? (index + n - 1) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
    if (next === null) return;
    e.preventDefault(); setGroupId(CONTENT_GROUPS[next].id); tabs.current[next]?.focus();
  };
  if (!content) return <div className={error ? 'adm-error' : 'adm-empty'} role={error ? 'alert' : 'status'}>{error || 'Chargement des textes…'}{error && <button className="adm-btn" onClick={() => setRetry((v) => v + 1)}>Réessayer</button>}</div>;
  return <form onSubmit={save} className="adm-content-editor" noValidate>
    <div className="adm-editor-intro"><span className="adm-stat-icon blue"><Icon name="layout" size={23} /></span><div><b>Votre message, section par section.</b><p>L’aperçu reflète vos saisies. Seul l’enregistrement met à jour le site public.</p></div><span className={`adm-badge ${dirty ? 'amber' : 'green'}`}><i />{dirty ? 'Brouillon local' : 'Enregistré'}</span></div>
    <div className="adm-editor-tabs" role="tablist" aria-label="Sections de la page d’accueil">{CONTENT_GROUPS.map((g, index) => <button key={g.id} ref={(el) => { tabs.current[index] = el; }} id={`adm-tab-${g.id}`} type="button" role="tab" aria-selected={g.id === groupId} aria-controls="adm-content-panel" tabIndex={g.id === groupId ? 0 : -1} onKeyDown={(e) => keyTab(e, index)} onClick={() => setGroupId(g.id)}><Icon name={g.icon} size={16} />{g.label}{g.keys.some((key) => changed.includes(key)) && <i className="adm-unsaved-dot" aria-label="Modifications non enregistrées" />}</button>)}</div>
    {error && <div role="alert" className="adm-error">{error}</div>}
    <div className="adm-editor-split" id="adm-content-panel" role="tabpanel" aria-labelledby={`adm-tab-${groupId}`}>
      <section className="adm-panel adm-copy-fields"><div className="adm-panel-head"><div><span className="adm-eyebrow">{group.label}</span><h2>{group.title}</h2><p>{group.hint}</p></div></div>
        <fieldset disabled={busy} className="adm-form-grid"><legend className="sr-only">Textes de la section {group.label}</legend>{CONTENT_FIELDS.filter(([key]) => group.keys.includes(key)).map(([key, label, fallback]) => <label key={key} className="wide" htmlFor={`adm-content-${key}`}><span>{label}<em> *</em></span>{fallback.length > 65 ? <textarea id={`adm-content-${key}`} rows={3} maxLength={2000} required aria-invalid={invalid === key || undefined} value={content[key]} onChange={(e) => setContent({ ...content, [key]: e.target.value })} /> : <input id={`adm-content-${key}`} type={key === 'contactEmail' ? 'email' : 'text'} maxLength={2000} required aria-invalid={invalid === key || undefined} value={content[key]} onChange={(e) => setContent({ ...content, [key]: e.target.value })} />}<small className="adm-field-hint">{content[key].length.toLocaleString('fr-FR')} / 2 000 caractères{changed.includes(key) && <b>Modifié</b>}</small></label>)}</fieldset>
        <div className="adm-section-reset"><button className="adm-btn" type="button" disabled={busy || !group.keys.some((key) => changed.includes(key))} onClick={() => { if (window.confirm('Rétablir les textes enregistrés de cette section ?')) setContent((c) => ({ ...c, ...Object.fromEntries(group.keys.map((key) => [key, saved[key]])) })); }}>Rétablir cette section</button></div>
      </section>
      <aside className="adm-preview-panel"><div className="adm-preview-caption"><Icon name="eye" size={16} /><b>Aperçu en direct</b><span>Textes uniquement</span></div><ContentPreview group={groupId} content={content} jobCount={jobCount} /><p className="adm-preview-disclaimer">Composition simplifiée pour relire vos textes. Les illustrations, liens et mises en page du site sont conservés.</p></aside>
    </div>
    <div className="adm-savebar"><span className={dirty ? 'has-changes' : ''}>{dirty ? `${changed.length} texte${changed.length > 1 ? 's' : ''} non enregistré${changed.length > 1 ? 's' : ''}` : 'Tous les textes sont enregistrés'}</span><a className="adm-btn" href="/" target="_blank" rel="noreferrer">Site enregistré ↗</a><button type="button" className="adm-btn" disabled={!dirty || busy} onClick={() => { if (window.confirm('Annuler toutes les modifications ?')) { setContent({ ...saved }); setError(''); setInvalid(''); } }}>Tout annuler</button><button className="adm-btn primary" disabled={!dirty || busy}>{busy ? 'Enregistrement…' : 'Enregistrer les textes'}</button></div>
  </form>;
}
