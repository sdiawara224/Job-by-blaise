import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { TEAM_FIELDS, validateTeam } from '../../teamContent.js';
import TeamCard from '../../components/TeamCard.jsx';

export default function TeamEditor({ notify, onDirtyChange }) {
  const [members, setMembers] = useState(null), [saved, setSaved] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [retry, setRetry] = useState(0), [uploading, setUploading] = useState(null);
  const dirty = members !== null && JSON.stringify(members) !== saved;
  useEffect(() => {
    let active = true;
    setError('');
    api('/admin/team').then(data => { if (active) { setMembers(data.members); setSaved(JSON.stringify(data.members)); } }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => { onDirtyChange(dirty || !!uploading); return () => onDirtyChange(false); }, [dirty, uploading, onDirtyChange]);
  useEffect(() => {
    const handler = e => { if (dirty || uploading) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, uploading]);
  const change = (index, key, value) => setMembers(current => current.map((member, i) => i === index ? { ...member, [key]: value } : member));
  const uploadPhoto = async (id, file) => {
    if (!file || uploading || busy) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Choisissez une image JPEG, PNG ou WebP.'); return; }
    if (!file.size || file.size > 3 * 1024 * 1024) { setError('La photo doit peser entre 1 octet et 3 Mo.'); return; }
    setUploading(id);
    try {
      const { photoUrl } = await api('/admin/team/photo', { method: 'POST', body: file, raw: true });
      setMembers(current => current.map(item => item.id === id ? { ...item, photoUrl } : item));
    } catch (err) { setError(err.message); }
    finally { setUploading(null); }
  };
  const move = (index, offset) => setMembers(current => { const next = [...current]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; return next; });
  const save = async e => {
    e.preventDefault(); if (busy || uploading) return;
    setError('');
    let valid;
    try { valid = validateTeam(members); } catch (err) { setError(err.message); return; }
    setBusy(true);
    try {
      const data = await api('/admin/team', { method: 'PUT', body: { members: valid } });
      setMembers(data.members); setSaved(JSON.stringify(data.members)); notify('Équipe enregistrée. Seuls les profils publiés sont visibles sur le site.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  if (members === null) return <div className={error ? 'adm-error' : 'adm-empty'} role={error ? 'alert' : 'status'}>{error || 'Chargement de l’équipe…'}{error && <button className="adm-btn" onClick={() => setRetry(value => value + 1)}>Réessayer</button>}</div>;
  return <form className="adm-team-editor" onSubmit={save} aria-busy={busy || !!uploading}>
    <div className="adm-note"><b>Les vrais visages de Job by blaise.</b><p>Renseignez les noms, fonctions, présentations et photos avec l’accord des personnes concernées. Les profils sont en brouillon par défaut. L’ordre ci-dessous est celui du site.</p><Link to="/notre-equipe" target="_blank" rel="noreferrer">Voir la page publique ↗</Link></div>
    {error && <div className="adm-error" role="alert">{error}</div>}
    <fieldset disabled={busy || !!uploading} className="adm-team-fieldset">
      {!members.length && <p className="adm-empty">Aucun membre pour le moment. Ajoutez le premier profil.</p>}
      {members.map((member, index) => <section key={member.id} className="adm-panel adm-team-member" aria-label={`Membre ${index + 1}`}>
        <div className="adm-team-fields">
          <h2>Membre {index + 1}</h2>
          {TEAM_FIELDS.map(([key, label, max, required]) => <label key={key} className="adm-team-field" htmlFor={`${member.id}-${key}`}><span>{label}{required ? ' *' : ''}</span>{key === 'bio' ? <textarea id={`${member.id}-${key}`} required={required} maxLength={max} rows={4} value={member[key]} onChange={e => change(index, key, e.target.value)} /> : <input id={`${member.id}-${key}`} required={required} maxLength={max} value={member[key]} onChange={e => change(index, key, e.target.value)} />}</label>)}
          <div className="adm-team-upload">
            <label className="adm-team-field" htmlFor={`${member.id}-upload`}><span>Importer une photo depuis votre appareil</span><input id={`${member.id}-upload`} type="file" accept="image/jpeg,image/png,image/webp" aria-describedby={`${member.id}-photo-help`} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; uploadPhoto(member.id, file); }} /></label>
            <p className="muted small" id={`${member.id}-photo-help`}>JPEG, PNG ou WebP · 3 Mo maximum. La photo est optimisée et destinée au site public. Cliquez ensuite sur « Enregistrer l’équipe » pour l’associer au profil.</p>
            {uploading === member.id && <p role="status">Importation de la photo…</p>}
            {member.photoUrl && <button type="button" className="adm-btn" onClick={() => change(index, 'photoUrl', '')}>Retirer la photo</button>}
          </div>
          <label className="adm-team-publication"><input type="checkbox" checked={member.isPublished} onChange={e => change(index, 'isPublished', e.target.checked)} /> Publier ce profil</label>
          <div className="adm-team-controls">
            <button type="button" className="adm-btn" disabled={index === 0} onClick={() => move(index, -1)}>Monter</button>
            <button type="button" className="adm-btn" disabled={index === members.length - 1} onClick={() => move(index, 1)}>Descendre</button>
            <button type="button" className="adm-btn" onClick={() => { if (window.confirm('Retirer ce profil ? La suppression sera appliquée après enregistrement.')) setMembers(current => current.filter(item => item.id !== member.id)); }}>Retirer le profil</button>
          </div>
        </div>
        <aside className="adm-team-preview" aria-label={`Aperçu non enregistré du membre ${index + 1}`}><TeamCard member={{ ...member, name: member.name || 'Nom du membre', role: member.role || 'Fonction', bio: member.bio || 'Présentation du membre.' }} /></aside>
      </section>)}
      <div className="adm-team-controls">
        <button type="button" className="adm-btn" disabled={members.length >= 30} onClick={() => setMembers(current => [...current, { id: crypto.randomUUID(), name: '', role: '', bio: '', photoUrl: '', isPublished: false }])}>Ajouter un membre</button>
        <button type="submit" className="adm-btn primary" disabled={!dirty}>{busy ? 'Enregistrement…' : 'Enregistrer l’équipe'}</button>
        <span role="status">{dirty ? 'Modifications non enregistrées' : 'Version enregistrée'}</span>
      </div>
    </fieldset>
  </form>;
}
