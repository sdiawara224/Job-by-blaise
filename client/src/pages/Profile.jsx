import { useEffect, useState } from 'react';
import MatchRing from '../components/MatchRing.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const EDU = ['Sans diplôme', 'BEPC', 'Bac', 'Bac+1', 'Bac+2', 'Bac+3', 'Bac+5', 'Doctorat'];
const CONTRACTS = ['Temps plein', 'Temps partiel', 'CDD', 'Stage', 'Freelance'];

const emptyCv = { summary: '', experiences: [], education: [] };

export default function Profile() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [meta, setMeta] = useState({ skills: [], allCities: [] });
  const [tab, setTab] = useState('infos');
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const load = () => {
    api('/profile').then((d) => {
      setProfile(d.profile);
      setCompletion(d.completion);
    }).catch((e) => setErr(e.message));
    api('/jobs/meta').then(setMeta).catch(() => {});
  };
  useEffect(load, []);

  if (!profile) return <div className="page-loader">Chargement du profil…</div>;

  const set = (k) => (e) => setProfile({ ...profile, [k]: e.target.value });
  const cv = profile.cv && Object.keys(profile.cv).length ? profile.cv : emptyCv;

  const setCv = (patch) => setProfile({ ...profile, cv: { ...cv, ...patch } });

  const save = async () => {
    setBusy(true); setMsg(null); setErr('');
    try {
      const d = await api('/profile', { method: 'PUT', body: profile });
      setProfile(d.profile);
      setCompletion(d.completion);
      updateUser(d.profile);
      setMsg('Profil enregistré ✓ — ton score de match vient d’être recalculé.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const addSkill = (s) => {
    const v = String(s || '').trim();
    if (!v || profile.skills.includes(v)) return;
    setProfile({ ...profile, skills: [...profile.skills, v] });
    setSkillInput('');
  };
  const removeSkill = (s) => setProfile({ ...profile, skills: profile.skills.filter((x) => x !== s) });

  const toggle = (key, value) => {
    const list = profile[key] || [];
    setProfile({
      ...profile,
      [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
    });
  };

  const exp = Array.isArray(cv.experiences) ? cv.experiences : [];
  const edu = Array.isArray(cv.education) ? cv.education : [];

  return (
    <div className="dash">
      <div className="page-title-row">
        <div>
          <h1>Mon profil</h1>
          <p className="muted">Un profil complet = plus de matchs et des alertes plus précises.</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </div>

      {msg && <div className="form-success">{msg}</div>}
      {err && <div className="form-error">{err}</div>}

      <div className="profile-layout">
        <div className="profile-main">
          <div className="tabs">
            <button className={`tab ${tab === 'infos' ? 'active' : ''}`} onClick={() => setTab('infos')}>Informations</button>
            <button className={`tab ${tab === 'skills' ? 'active' : ''}`} onClick={() => setTab('skills')}>Compétences & préférences</button>
            <button className={`tab ${tab === 'cv' ? 'active' : ''}`} onClick={() => setTab('cv')}>Mon CV</button>
          </div>

          {tab === 'infos' && (
            <div className="card form-card">
              <h2>Informations personnelles</h2>
              <div className="form-row">
                <div>
                  <label>Nom complet</label>
                  <input value={profile.fullName} onChange={set('fullName')} />
                </div>
                <div>
                  <label>Téléphone</label>
                  <input value={profile.phone} onChange={set('phone')} placeholder="+224 6XX XXX XXX" />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Ville</label>
                  <select value={profile.city} onChange={set('city')}>
                    {(meta.allCities.length ? meta.allCities : [profile.city]).map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label>Titre professionnel</label>
                  <input value={profile.title} onChange={set('title')} placeholder="Ex. Assistant Administratif" />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Niveau d’études</label>
                  <select value={profile.education} onChange={set('education')}>
                    <option value="">— Choisir —</option>
                    {EDU.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label>Années d’expérience</label>
                  <input type="number" min="0" max="40" value={profile.experienceYears} onChange={set('experienceYears')} />
                </div>
              </div>
              <div>
                <label>À propos de moi</label>
                <textarea rows={4} value={profile.bio} onChange={set('bio')} placeholder="Décrivez votre parcours en quelques lignes…" />
              </div>
            </div>
          )}

          {tab === 'skills' && (
            <>
              <div className="card form-card">
                <h2>Compétences <small className="muted">({profile.skills.length})</small></h2>
                <div className="chip-row">
                  {profile.skills.map((s) => (
                    <span className="chip chip-skill removable" key={s}>
                      {s} <button type="button" onClick={() => removeSkill(s)} aria-label={`Retirer ${s}`}>×</button>
                    </span>
                  ))}
                  {!profile.skills.length && <span className="muted">Aucune compétence — ajoute au moins 3 pour un profil optimal.</span>}
                </div>
                <div className="skill-add">
                  <input
                    list="skills-list" value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                    placeholder="Ajouter une compétence (ex. Excel)…"
                  />
                  <datalist id="skills-list">
                    {meta.skills.map((s) => <option key={s} value={s} />)}
                  </datalist>
                  <button className="btn btn-outline" type="button" onClick={() => addSkill(skillInput)}>
                    <Icon name="plus" size={15} /> Ajouter
                  </button>
                </div>
                <div className="suggest-row">
                  {meta.skills.filter((s) => !profile.skills.includes(s)).slice(0, 8).map((s) => (
                    <button key={s} type="button" className="suggest" onClick={() => addSkill(s)}>+ {s}</button>
                  ))}
                </div>
              </div>

              <div className="card form-card">
                <h2>Préférences de poste</h2>
                <label className="lbl">Types de contrat recherchés</label>
                <div className="chip-row">
                  {CONTRACTS.map((c) => (
                    <button
                      type="button" key={c}
                      className={`pick ${profile.jobTypes.includes(c) ? 'on' : ''}`}
                      onClick={() => toggle('jobTypes', c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <label className="lbl">Villes préférées <small className="muted">(pour les alertes & le match)</small></label>
                <div className="chip-row">
                  {(meta.allCities.length ? meta.allCities : ['Conakry']).map((c) => (
                    <button
                      type="button" key={c}
                      className={`pick ${profile.preferredCities.includes(c) ? 'on' : ''}`}
                      onClick={() => toggle('preferredCities', c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'cv' && (
            <div className="card form-card">
              <h2>Mon CV <small className="muted">— joint automatiquement à tes candidatures</small></h2>

              <label className="lbl">Résumé professionnel</label>
              <textarea
                rows={4} value={cv.summary || ''}
                onChange={(e) => setCv({ summary: e.target.value })}
                placeholder="Assistant administratif organisé, 4 ans d’expérience en PME…"
              />

              <label className="lbl">Expériences</label>
              {exp.map((x, i) => (
                <div className="cv-item" key={i}>
                  <div className="form-row three">
                    <input value={x.role} placeholder="Poste"
                      onChange={(e) => setCv({ experiences: exp.map((y, j) => j === i ? { ...y, role: e.target.value } : y) })} />
                    <input value={x.org} placeholder="Entreprise"
                      onChange={(e) => setCv({ experiences: exp.map((y, j) => j === i ? { ...y, org: e.target.value } : y) })} />
                    <input value={x.period} placeholder="2022 – 2025"
                      onChange={(e) => setCv({ experiences: exp.map((y, j) => j === i ? { ...y, period: e.target.value } : y) })} />
                  </div>
                  <textarea rows={2} value={x.detail} placeholder="Missions et résultats chiffrés…"
                    onChange={(e) => setCv({ experiences: exp.map((y, j) => j === i ? { ...y, detail: e.target.value } : y) })} />
                  <button type="button" className="link-btn danger" onClick={() => setCv({ experiences: exp.filter((_, j) => j !== i) })}>
                    Supprimer cette expérience
                  </button>
                </div>
              ))}
              <button
                type="button" className="btn btn-outline btn-sm"
                onClick={() => setCv({ experiences: [...exp, { role: '', org: '', period: '', detail: '' }] })}
              >
                <Icon name="plus" size={14} /> Ajouter une expérience
              </button>

              <label className="lbl">Formation</label>
              {edu.map((x, i) => (
                <div className="cv-item" key={i}>
                  <div className="form-row three">
                    <input value={x.level} placeholder="Diplôme"
                      onChange={(e) => setCv({ education: edu.map((y, j) => j === i ? { ...y, level: e.target.value } : y) })} />
                    <input value={x.org} placeholder="Établissement"
                      onChange={(e) => setCv({ education: edu.map((y, j) => j === i ? { ...y, org: e.target.value } : y) })} />
                    <input value={x.period} placeholder="2019 – 2021"
                      onChange={(e) => setCv({ education: edu.map((y, j) => j === i ? { ...y, period: e.target.value } : y) })} />
                  </div>
                  <button type="button" className="link-btn danger" onClick={() => setCv({ education: edu.filter((_, j) => j !== i) })}>
                    Supprimer cette formation
                  </button>
                </div>
              ))}
              <button
                type="button" className="btn btn-outline btn-sm"
                onClick={() => setCv({ education: [...edu, { level: '', org: '', period: '' }] })}
              >
                <Icon name="plus" size={14} /> Ajouter une formation
              </button>
            </div>
          )}
        </div>

        <aside className="profile-aside">
          <div className="card profile-score-card sticky">
            <div className="profile-score-top">
              <MatchRing score={completion.percent} size={92} stroke={7} />
              <div>
                <b>Profil à {completion.percent}%</b>
                <p>{completion.percent >= 85 ? 'Excellent ! Tes candidatures sont bien positionnées.' : 'Complète les points ci-dessous.'}</p>
              </div>
            </div>
            <ul className="checklist">
              {completion.checks.map((c) => (
                <li key={c.id} className={c.done ? 'done' : 'todo'}>
                  <span className="check-ic">{c.done ? '✓' : '○'}</span> {c.label}
                </li>
              ))}
            </ul>
            <button className="btn btn-primary btn-block" onClick={save} disabled={busy}>
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
