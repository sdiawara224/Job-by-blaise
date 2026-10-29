# Job by blaise 💼

> **Trouve les offres qui te correspondent.** — Plateforme d'emploi Guinée & Afrique de l'Ouest :
> offres d'emploi, CV, matching intelligent et **alertes SMS chaque matin à 7h00**.
> *Le bon emploi. Au bon moment.*

Application full-stack complète : **frontend React**, **backend Express API** et **base de données SQLite**.

---

## ✨ Fonctionnalités

### Espace candidat (`/app`)
| Module | Description |
|---|---|
| **Accueil** | Salutation personnalisée, barre de recherche, offres recommandées avec **score de match**, dernière alerte SMS, complétion du profil |
| **Offres d'emploi** | 60 offres réelles de démo — recherche plein texte, filtres ville / contrat / domaine, tri, **match % calculé pour ton profil** |
| **Mon profil** | Informations, compétences (tags), préférences (contrats, villes), **CV complet** (résumé, expériences, formations) + jauge de complétion |
| **Mes candidatures** | Suivi des statuts (En attente / En cours / Acceptée / Refusée), statistiques, retrait |
| **Mes alertes SMS** | Activation, numéro, heure d'envoi (07:00), mots-clés, villes, contrats + **boîte SMS** (simulation d'envoi quotidien + alerte test) |
| **Conseils carrière** | Articles pratiques : CV, entretien, négociation salariale, stratégie 30 jours… |

### Pages publiques
- **Landing** (`/`) — structure type Mansa Talents : hero « Transformez votre carrière »
  (CTA *Trouver un job* / *Créer mon CV*), **les dernières offres d'emploi**, **les
  entreprises qui recrutent** (note ★, ancienneté, effectif, nb d'offres), **CV en 3 clics**,
  **recherche poste + ville**, **3 étapes « Rejoignez l'aventure »** avec aperçu du CV builder.
- **`/jobs`** — annuaire d'offres, **`/jobs/:id`** — détail avec **analyse du match**
  (compétences, localisation, contrat, diplôme, expérience) et candidature en 1 clic.
- **`/entreprises`** + **`/entreprises/:id`** — annuaire et fiche entreprise avec ses offres.
- **`/conseils`** — bibliothèque de conseils carrière.

## 🧰 Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 + React Router 6 + Vite 5 (CSS maison, 0 dépendance UI) |
| Backend | Express 4 (Node 22) — API REST `/api/*` |
| Base de données | **SQLite** (`node:sqlite` natif) — fichier `database/jobbyblaise.db` |
| Auth | Hash **scrypt** + jetons **HMAC-SHA256** signés (7 jours), 0 dépendance |
| Matching | Moteur maison pondéré : compétences 40 % · localisation 15 % · contrat 15 % · diplôme 15 % · expérience 15 % (plafond 97 %) |
| SMS | Simulateur : planificateur quotidien à l'heure choisie + génération à la demande (`POST /api/alerts/test`) |

## 🚀 Démarrage rapide

```bash
npm install        # dépendances
npm run build      # build du front (client/ → dist/)
npm start          # serveur sur http://localhost:3001
```

**Compte de démonstration**
```
mamadou@jobbyblaise.com
demo1234
```

### Mode développement (hot-reload)

```bash
npm run dev:api    # API sur :3001 (auto-seed si base vide)
npm run dev        # Vite sur :5173 (proxy /api → :3001)
```

### Réinitialiser la base de démo

```bash
npm run seed       # recrée entreprises, 60 offres, conseils, compte Mamadou
```

### Tests de fumée (anti « page blanche »)

```bash
npm run build
node smoke-test.mjs            # vérifie la page /
node smoke-test.mjs /jobs      # vérifie n'importe quelle route
WITH_TOKEN=1 node smoke-test.mjs /app   # simule un utilisateur connecté
```

Le test charge le bundle dans **jsdom**, intercepte les erreurs React/runtime
et échoue si une page se rend vide. Toutes les routes du projet sont couvertes.

## 🗄️ Base de données (`database/jobbyblaise.db`)

```
users              profil candidat + CV JSON + préférences
companies          18 entreprises (Conakry, Kankan, Boké, Abidjan, Dakar…)
jobs               60 offres (salaire GNF, contrat, domaine, compétences JSON)
applications       candidatures (user ↔ job, statut, lettre)
alert_settings     alerte SMS : actif, numéro, heure, mots-clés, villes, contrats
sms_messages       boîte SMS reçue (simulée)
advice             conseils carrière (markdown léger)
```

## 🔌 API REST (extraits)

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` | Inscription / connexion → JWT |
| GET | `/api/jobs?search=&city=&contract=&domain=&sort=` | Offres filtrées (+ match si connecté) |
| GET | `/api/jobs/:id` | Détail offre + ventilation du score |
| GET | `/api/jobs/recommended` | Top offres pour le profil connecté |
| GET/PUT | `/api/profile` | Profil + taux de complétion |
| GET/POST/DELETE | `/api/applications` | Candidatures |
| GET/PUT | `/api/alerts` | Préférences + boîte SMS |
| POST | `/api/alerts/test` | Génère une alerte immédiatement |
| GET | `/api/dashboard` | Données de la page d'accueil candidat |
| GET | `/api/advice` · `/api/advice/:id` | Conseils carrière |
| GET | `/api/stats` | Chiffres pour la landing (offres, entreprises…) |

## 📁 Structure du projet

```
├── client/                 # Frontend React (Vite)
│   ├── index.html
│   └── src/
│       ├── pages/          # Landing, Jobs, JobDetail, Dashboard, Profile…
│       ├── components/     # Navbar, JobCard, MatchRing, JobsBoard…
│       ├── auth.jsx        # contexte d'authentification
│       ├── api.js          # client HTTP
│       └── styles.css      # design system Job by blaise
├── server/
│   ├── index.js            # serveur Express + planificateur SMS
│   ├── routes.js           # API REST
│   ├── db.js               # schéma SQLite + helpers
│   ├── match.js            # moteur de matching & complétion profil
│   ├── auth.js             # scrypt + tokens HMAC
│   └── seed.js             # données de démonstration
├── database/               # fichier SQLite (gitignoré)
└── dist/                   # front buildé (gitignoré)
```

---

© 2026 Job by blaise — *Plateforme complète : www.jobbyblaise.com*
