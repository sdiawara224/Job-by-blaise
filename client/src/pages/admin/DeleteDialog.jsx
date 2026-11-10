import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';

export default function DeleteDialog({ section, record, onClose, onConfirm, onEdit }) {
  const dialog = useRef(null), cancel = useRef(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [conflict, setConflict] = useState(false);
  const title = section === 'sms' ? `Message #${record.id} · ${record.full_name}` : record.title || record.name || record.full_name || `Enregistrement #${record.id}`;
  useEffect(() => { dialog.current.showModal(); cancel.current?.focus(); return () => dialog.current?.close(); }, []);
  const confirm = async () => {
    setBusy(true); setError('');
    try { await onConfirm(record); } catch (err) { setError(err.message); setConflict(err.status === 409); } finally { setBusy(false); }
  };
  return <dialog ref={dialog} className="adm-confirm-dialog" role="alertdialog" aria-labelledby="adm-delete-title" aria-describedby="adm-delete-description" onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }}>
    <span className="adm-confirm-icon"><Icon name="trash" size={24} /></span>
    <h2 id="adm-delete-title">Supprimer ce contenu ?</h2>
    <p id="adm-delete-description">Vous allez supprimer définitivement cet enregistrement. Cette action ne peut pas être annulée.</p>
    <div className="adm-confirm-record"><b>{title}</b><span>Identifiant #{record.id}</span></div>
    {section === 'jobs' && <p className="adm-confirm-hint">Pour retirer une offre du site sans perdre son historique, choisissez plutôt « Non publiée / archivée » dans son formulaire.</p>}
    {error && <div className="adm-error" role="alert">{error}</div>}
    <div className="adm-confirm-actions"><button ref={cancel} className="adm-btn" disabled={busy} onClick={onClose}>Conserver</button>{conflict && section === 'jobs' && <button className="adm-btn" disabled={busy} onClick={() => onEdit(record)}>Modifier l’offre</button>}<button className="adm-btn destructive" disabled={busy} onClick={confirm}>{busy ? 'Suppression…' : 'Supprimer définitivement'}</button></div>
  </dialog>;
}
