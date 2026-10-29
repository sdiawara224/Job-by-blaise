# Job by blaise 🇬🇳

> **Le bon emploi. Au bon moment.**
> Plateforme d'emploi française pour la Guinée et l'Afrique de l'Ouest : offres, matching, CV, alertes SMS matinales.

![stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20SQLite-blue) ![license](https://img.shields.io/badge/licence-MIT-green)

---

## ✨ Fonctionnalités

- **Landing page** structurée en 7 sections : hero + maquette dashboard + bandeau de stats, dernières offres, entreprises, « CV en 3 clics », recherche poste+ville, 3 étapes + builder CV, CTA final & footer.
- **Recherche d'emploi** `/jobs` : filtres ville / contrat / domaine, tri récent ou salaire, et **% de match** calculé pour chaque profil.
- **Fiches offres** `/jobs/:id` : description, compétences, bandeau détaillé du matching (score global + détail par dimension), candidature en un clic avec lettre de motivation.
- **Entreprises** `/entreprises` + fiches : note, secteur, ville, historique de fondation, offres ouvertes.
- **Conseils carrière** `/conseils` : articles CV / entretien / SMS / carrière (6 fiches réelles).
- **Espace candidat** `/app` : dashboard personnalisé (score de profil, recommandations, dernière alerte SMS), offres notées, profil + **CV éditable** (résumé, expériences, formations, compétences), candidatures (statuts), **alertes SMS** (fréquence, heure d'envoi 7h00, mots-clés, villes, contrats) avec **frame téléphone** et SMS de test.
- **Alertes SMS 7h00** : moteur de génération simulant l'envoi quotidien — `POST /api/alerts/test` pour déclencher une alerte instantanément.
- **Auth** scrypt + JWT, compte de démo pré-rempli.

## 🧱 Stack

| Couche | Choix |
|---|---|
| Frontend | React 18 + React Router, Vite 5 |
| Backend | Node.js + Express 4 |
| Base | SQLite (`node:sqlite`, natif Node 22) |
| Contenu | Seed script (18 entreprises, 60 offres, 6 conseils) |

## 🚀 Démarrage

```bash
npm install
npm run dev        # client (5173) + API proxy → 3001
```

Démo (un clic sur la page de connexion) :

```
mamadou@jobbyblaise.com
demo1234
```

## 📦 Build de production

```bash
npm run build      # → dist/
npm start          # serveur sur 0.0.0.0:3001 (SPA + API)
```

Au premier démarrage, la base `database/jobbyblaise.db` est **créée et seedée automatiquement** (si aucun fichier n'existe). Pour repartir de zéro : `rm -rf database && npm run seed`.

## 🗂️ Structure

```
├── client/            # SPA React
│   └── src/
│       ├── components/  # Icon, Logo, Navbar, JobCard, JobsBoard, CompanyCard, MatchRing
│       ├── pages/       # Landing, Jobs, Entreprises, Conseils, App (dashboard, profil…)
│       └── styles.css   # design system (bleu #2E6BFF, navy, vert #00A868, ambre #F5A524)
├── server/
│   ├── db.js          # schéma + migrations + seed check
│   ├── seed.js        # 18 entreprises, 60 offres, 6 conseils, compte démo
│   ├── auth.js        # scrypt + JWT (HS256)
│   ├── match.js       # moteur de matching pondéré (contrat, ville, compétences, diplôme, expérience)
│   ├── routes.js      # REST API
│   └── index.js       # serveur HTTP (SPA dist + API) + scheduler d'alertes 7h00
├── database/          # SQLite (auto-seed, ignoré par git)
└── smoke-test.mjs     # test des endpoints critiques
```

## 🔌 API

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | inscription |
| POST | `/api/auth/login` | connexion |
| GET | `/api/auth/me` | profil utilisateur (JWT) |
| GET/PUT | `/api/profile` | profil + CV + préférences |
| GET | `/api/jobs` | offres (`search`, `city`, `contract`, `domain`, `sort`) |
| GET | `/api/jobs/meta` | villes, contrats, domaines, compétences |
| GET | `/api/jobs/:id` | fiche offre (+ breakdown de match si JWT) |
| GET | `/api/jobs/recommended` | offres triées par score |
| GET | `/api/companies` · `/api/companies/:id` | annuaire entreprises |
| GET/POST | `/api/applications` | candidatures |
| GET/PUT | `/api/alerts` | préférences d'alerte SMS |
| POST | `/api/alerts/test` | génère & « envoie » une alerte |
| GET | `/api/advice` · `/api/advice/:id` | conseils carrière |
| GET | `/api/dashboard` | données de l'espace candidat |
| GET | `/api/stats` | statistiques publiques |

## 🧪 Tests

```bash
npm run seed        # (re)crée la base
npm start &         # serveur sur :3001
npm run test:smoke  # 16 endpoints critiques
```

## 🎨 Design system

- **Bleu primaire** `#2E6BFF` · **Navy** `#0A1B4D` · **Vert** `#00A868` · **Ambre** `#F5A524`
- Wordmark « Job by **blaise** » + monogramme **J** bleu (favicon)
- Illustrations SVG inline (CV, recherche) — aucune dépendance d'images externes
- Alertes simulées « Job by blaise: … » sur le canal `/api/alerts`

## 📄 Licence

MIT — © 2026 Job by blaise (www.jobbyblaise.com)
