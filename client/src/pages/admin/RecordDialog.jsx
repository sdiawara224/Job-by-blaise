import { useEffect, useRef, useState } from 'react';
import { api, fmtDate } from '../../api.js';
import Icon from '../../components/Icon.jsx';
import { SECTIONS, STATUSES } from '../adminConfig.js';
import CandidateCv from './CandidateCv.jsx';
import RecordPreview from './RecordPreview.jsx';
import { decodeList, fieldRules, validateRecord } from './recordValidation.js';

export default function RecordDialog({ section, record, companies, onClose, onSaved }) {
  const cfg = SECTIONS[section];
  const dialog = useRef(null), formElement = useRef(null), firstError = useRef(null);
  const [initial] = useState(() => Object.fromEntries(cfg.fields.map(([key, , type]) => [key, type === 'list' ? decodeList(record[key]).join(', ') : record[key] ?? ''])));
  const [form, setForm] = useState(initial), [busy, setBusy] = useState(false), [view, setView] = useState('edit'), [error, setError] = useState(''), [errors, setErrors] = useState({});
  const id = record.id ?? record.user_id;
  const dirty = cfg.fields.some(([key]) => String(form[key]) !== String(initial[key]));
  const canPreview = ['jobs', 'advice', 'companies'].includes(section);
  const canSave = !cfg.readOnly && view !== 'cv';
  const focusField = (key) => {
    const field = document.getElementById(`adm-record-${key}`);
    firstError.current = field ? null : key; setView('edit'); field?.focus();
  };
  useEffect(() => { dialog.current.showModal(); return () => dialog.current?.close(); }, []);
  useEffect(() => {
    if (view === 'edit' && firstError.current) { document.getElementById(`adm-record-${firstError.current}`)?.focus(); firstError.current = null; }
  }, [view, errors]);
  useEffect(() => {
    const handler = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  const close = () => {
    if (busy) return;
    if (dirty && !window.confirm('Quitter sans enregistrer vos modifications ?')) return;
    onClose();
  };
  const change = (key, value) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (Object.keys(errors).length) {
      const validated = validateRecord(section, cfg.fields, next, companies);
      setErrors((current) => Object.fromEntries(Object.keys(current).filter((k) => validated[k]).map((k) => [k, validated[k]])));
    }
  };
  const save = async (e) => {
    e.preventDefault(); if (busy || !canSave) return;
    setError('');
    const nextErrors = validateRecord(section, cfg.fields, form, companies);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { focusField(Object.keys(nextErrors)[0]); return; }
    setBusy(true);
    const body = Object.fromEntries(cfg.fields.map(([key, , type]) => [key, type === 'list' ? form[key].split(',').map((v) => v.trim()).filter(Boolean) : ['number', 'company', 'enabled', 'publication'].includes(type) ? Number(form[key]) : form[key]]));
    try {
      await api(`/admin/${section}${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body });
      onSaved(id ? 'Modifications enregistrées.' : 'Nouveau contenu créé.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <dialog ref={dialog} className="adm-dialog" aria-labelledby="adm-editor-title" onCancel={(e) => { e.preventDefault(); close(); }}>
    <form ref={formElement} onSubmit={save} noValidate aria-busy={busy} onKeyDown={(e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (canSave && !busy) formElement.current.requestSubmit(); }
    }}>
      <div className="adm-dialog-head"><div><span className="adm-eyebrow">{cfg.label}</span><h2 id="adm-editor-title">{view === 'cv' ? `CV de ${record.full_name}` : cfg.readOnly ? 'Consulter le message' : id ? 'Modifier les informations' : `Créer ${cfg.singular}`}</h2></div><button type="button" className="adm-icon-btn" aria-label="Fermer" onClick={close} disabled={busy}>×</button></div>
      <div className="adm-dialog-body">
        {!cfg.readOnly && <div className={`adm-record-state ${dirty ? 'is-dirty' : ''}`}><i /><span>{dirty ? 'Modifications non enregistrées' : id ? 'Version enregistrée' : 'Nouveau contenu'}</span>{canSave && <kbd>Ctrl / ⌘ + S</kbd>}</div>}
        {record.email && <div className="adm-note"><b>{record.email}</b><p>L’adresse de connexion et les droits d’accès ne sont pas modifiables ici.</p></div>}
        {record.cover_letter !== undefined && <div className="adm-note"><b>Lettre de motivation · {record.full_name}</b><p className="adm-prewrap">{record.cover_letter || 'Aucune lettre fournie.'}</p></div>}
        {cfg.readOnly && <div className="adm-note"><b>{record.full_name} · {fmtDate(record.sent_at)}</b><p className="adm-prewrap">{record.body}</p></div>}
        {canPreview && <div className="adm-record-tabs" role="group" aria-label="Vue du contenu"><button type="button" aria-pressed={view === 'edit'} onClick={() => setView('edit')}><Icon name="edit" size={16} />Édition</button><button type="button" aria-pressed={view === 'preview'} onClick={() => setView('preview')}><Icon name="eye" size={16} />Aperçu local</button></div>}
        {section === 'users' && <div className="adm-record-tabs" role="group" aria-label="Vue du candidat"><button type="button" aria-pressed={view === 'edit'} onClick={() => setView('edit')}><Icon name="profile" size={16} />Informations du profil</button><button type="button" aria-pressed={view === 'cv'} onClick={() => setView('cv')}><Icon name="apps" size={16} />CV enregistré</button></div>}
        {Object.keys(errors).length > 0 && <div className="adm-validation-summary" role="alert"><b>Quelques informations sont à vérifier.</b><ul>{cfg.fields.filter(([key]) => errors[key]).map(([key, label]) => <li key={key}><button type="button" onClick={() => focusField(key)}>{label} : {errors[key]}</button></li>)}</ul></div>}
        {view === 'preview' && <RecordPreview section={section} form={form} companies={companies} />}
        {view === 'cv' && <CandidateCv record={record} />}
        {view === 'edit' && <fieldset className="adm-form-grid adm-record-fields" disabled={busy}><legend className="sr-only">Informations {cfg.label}</legend>{cfg.fields.map(([key, label, type, required]) => {
          const fieldId = `adm-record-${key}`, rules = fieldRules(section, key, type);
          const props = { id: fieldId, required, value: form[key], onChange: (e) => change(key, e.target.value), 'aria-invalid': errors[key] ? true : undefined, 'aria-describedby': errors[key] ? `${fieldId}-error` : undefined };
          return <label key={key} htmlFor={fieldId} className={['textarea', 'list'].includes(type) ? 'wide' : ''}><span>{label}{required && <em> *</em>}</span>
            {type === 'textarea' ? <textarea {...props} rows={key === 'content' ? 14 : 5} maxLength={rules.maxLength} />
              : ['company', 'status', 'enabled', 'publication'].includes(type) ? <select {...props}>{type === 'company' ? <><option value="">Sélectionner une entreprise</option>{companies.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</> : type === 'status' ? STATUSES.map((s) => <option key={s}>{s}</option>) : <><option value="0">{type === 'publication' ? 'Non publiée / archivée' : 'Désactivées'}</option><option value="1">{type === 'publication' ? 'Publiée sur le site' : 'Activées'}</option></>}</select>
              : <input {...props} {...rules} type={type === 'list' ? 'text' : type} />}
            {errors[key] && <small className="adm-field-error" id={`${fieldId}-error`}>{errors[key]}</small>}
            {type === 'textarea' && !errors[key] && <small className="adm-field-hint">{String(form[key]).length.toLocaleString('fr-FR')} / {rules.maxLength.toLocaleString('fr-FR')} caractères</small>}
          </label>;
        })}</fieldset>}
        {section === 'companies' && <div className="adm-publication-note"><Icon name="external" size={16} /><p>Après enregistrement, la fiche de cette entreprise sera visible dans l’annuaire public.</p></div>}
        {section === 'advice' && <div className="adm-publication-note"><Icon name="external" size={16} /><p><b>Publication immédiate.</b> Enregistrer cet article le rend visible sur le site public. L’aperçu seul ne l’enregistre pas.</p></div>}
        {section === 'jobs' && <div className="adm-publication-note"><Icon name={Number(form.is_active) ? 'external' : 'lock'} size={16} /><p>{Number(form.is_active) ? 'Après enregistrement, cette offre sera visible sur le site public.' : 'Après enregistrement, cette offre restera non publiée et pourra être publiée plus tard.'}</p></div>}
        {error && <div role="alert" className="adm-error">{error}</div>}
      </div>
      <div className="adm-dialog-foot"><span>{cfg.readOnly ? 'Journal de génération interne' : dirty ? 'Pensez à enregistrer' : '* Champs obligatoires'}</span>{view === 'preview' && <button className="adm-btn" type="button" onClick={() => setView('edit')} disabled={busy}>Revenir à l’édition</button>}<button className="adm-btn" type="button" onClick={close} disabled={busy}>{cfg.readOnly || view === 'cv' ? 'Fermer' : 'Annuler'}</button>{canSave && <button className="adm-btn primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>}</div>
    </form>
  </dialog>;
}
