import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { api, fmtDate } from '../api.js';
import { useAuth } from '../auth.jsx';

const CONTRACTS = ['Temps plein', 'Temps partiel', 'CDD', 'Stage', 'Freelance'];

export default function Alerts() {
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState(null);
  const [messages, setMessages] = useState([]);
  const [meta, setMeta] = useState({ allCities: [] });
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [keyword, setKeyword] = useState('');

  const load = () => {
    api('/alerts').then((d) => { setSettings(d.settings); setMessages(d.messages); }).catch((e) => setErr(e.message));
    api('/jobs/meta').then(setMeta).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (messages.some((m) => !m.isRead)) {
      const t = setTimeout(() => api('/alerts/read', { method: 'POST' }).catch(() => {}), 1500);
      return () => clearTimeout(t);
    }
  }, [messages]);

  if (!settings) return <div className="page-loader">Chargement des alertes…</div>;

  const save = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setBusy(true); setErr(''); setMsg(null);
    try {
      await api('/alerts', { method: 'PUT', body: next });
      if (patch.phone) updateUser({ phone: patch.phone });
      setMsg('Préférences enregistrées ✓');
    } catch (ex) {
      setErr(ex.message);
      load();
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true); setErr(''); setMsg(null);
    try {
      const d = await api('/alerts/test', { method: 'POST' });
      setMsg(`Alerte générée (${d.count} offre${d.count > 1 ? 's' : ''}) — regarde ta boîte SMS →`);
      load();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleList = (key, value) => {
    const list = settings[key] || [];
    save({ [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value] });
  };

  const addKeyword = () => {
    const v = keyword.trim();
    if (!v || settings.keywords.includes(v)) return;
    save({ keywords: [...settings.keywords, v] });
    setKeyword('');
  };

  return (
    <div className="dash">
      <div className="page-title-row">
        <div>
          <h1>Mes alertes SMS</h1>
          <p className="muted">Chaque matin à {settings.sendTime}, les offres faites pour toi arrivent sur ton téléphone.</p>
        </div>
        <button className="btn btn-primary" onClick={sendTest} disabled={busy}>
          <Icon name="sms" size={16} /> {busy ? 'Génération…' : 'Recevoir une alerte test'}
        </button>
      </div>

      {msg && <div className="form-success">{msg}</div>}
      {err && <div className="form-error">{err}</div>}

      <div className="alerts-layout">
        <div className="alerts-main">
          <div className="card form-card">
            <div className="switch-row">
              <div>
                <h2>Alerte quotidienne</h2>
                <p className="muted">Reçois un SMS dès que des offres correspondent à tes critères.</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox" checked={!!settings.enabled}
                  onChange={(e) => save({ enabled: e.target.checked })}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="form-row">
              <div>
                <label>Numéro de téléphone</label>
                <input
                  value={settings.phone} placeholder="+224 6XX XXX XXX"
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  onBlur={() => save({ phone: settings.phone })}
                />
              </div>
              <div>
                <label>Heure d’envoi</label>
                <input
                  type="time" value={settings.sendTime}
                  onChange={(e) => setSettings({ ...settings, sendTime: e.target.value })}
                  onBlur={() => save({ sendTime: settings.sendTime })}
                />
              </div>
            </div>

            <label className="lbl">Mots-clés (métiers, domaines…)</label>
            <div className="chip-row">
              {settings.keywords.map((k) => (
                <span className="chip chip-skill removable" key={k}>
                  {k} <button type="button" onClick={() => save({ keywords: settings.keywords.filter((x) => x !== k) })}>×</button>
                </span>
              ))}
              {!settings.keywords.length && <span className="muted">Aucun mot-clé — toutes les offres des villes choisies seront prises en compte.</span>}
            </div>
            <div className="skill-add">
              <input
                value={keyword} onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                placeholder="Ex. comptabilité, dev, logistique…"
              />
              <button className="btn btn-outline" type="button" onClick={addKeyword}>
                <Icon name="plus" size={15} /> Ajouter
              </button>
            </div>

            <label className="lbl">Villes</label>
            <div className="chip-row">
              {(meta.allCities.length ? meta.allCities : ['Conakry']).map((c) => (
                <button
                  type="button" key={c}
                  className={`pick ${settings.cities.includes(c) ? 'on' : ''}`}
                  onClick={() => toggleList('cities', c)}
                >
                  {c}
                </button>
              ))}
            </div>

            <label className="lbl">Types de contrat</label>
            <div className="chip-row">
              {CONTRACTS.map((c) => (
                <button
                  type="button" key={c}
                  className={`pick ${settings.contracts.includes(c) ? 'on' : ''}`}
                  onClick={() => toggleList('contracts', c)}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="form-foot">
              <button className="btn btn-primary" onClick={() => save({})} disabled={busy}>
                {busy ? 'Enregistrement…' : 'Enregistrer mes préférences'}
              </button>
              {settings.lastSentOn && <span className="muted small">Dernière alerte : {settings.lastSentOn}</span>}
            </div>
          </div>
        </div>

        <aside className="alerts-aside">
          <div className="phone-frame">
            <div className="phone-notch" />
            <div className="phone-head">
              <b>Messages</b>
              <span>{user?.phone || settings.phone || '—'}</span>
            </div>
            <div className="phone-thread">
              {messages.length ? messages.map((m) => (
                <div className={`thread-bubble ${m.isRead ? 'read' : 'unread'}`} key={m.id}>
                  <p>{m.body}</p>
                  <span>{fmtDate(m.sentAt)} {m.isRead ? '·' : '· ●'}</span>
                </div>
              )) : (
                <div className="thread-empty">
                  <Icon name="sms" size={30} />
                  <b>Aucun SMS pour l’instant</b>
                  <p>Active l’alerte puis lance un test : le message apparaîtra ici.</p>
                </div>
              )}
            </div>
          </div>
          <div className="sms-tip card">
            <Icon name="clock" size={17} />
            <p><b>Conseil :</b> garde l’heure à 07h00 — c’est le créneau où les recruteurs consultent les candidatures en premier.</p>
            <Link to="/app/conseils/3" className="link-btn">Lire le guide des alertes →</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
