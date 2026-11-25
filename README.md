# Job by blaise 🇬🇳

> **Le bon emploi. Au bon moment.**
> Plateforme d'emploi française pour la Guinée et l'Afrique de l'Ouest : offres, matching, CV, alertes SMS matinales.

![stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20SQLite%20%2F%20Supabase-blue) ![license](https://img.shields.io/badge/licence-MIT-green)

---

## ✨ Fonctionnalités

- **Landing page** : hero de recherche poste + ville avec compteur réel d’offres, bandeau horizontal d’entreprises juste en dessous, « CV en 3 clics », matching, 3 étapes + builder CV, CTA final et footer.
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
| Base | **Double backend** : SQLite local (`node:sqlite`, zéro dépendance) / **Supabase** (Postgres via RPC sécurisée `app_exec`) — repli automatique si Supabase est injoignable |
| Contenu | Seed script (18 entreprises, 60 offres, 6 conseils) |

## 🚀 Démarrage

```bash
npm install
npm run dev        # client (5173) + API proxy → 3001
```

Démo locale, après activation explicite de `JBB_SEED_DEMO=1` (SQLite uniquement, hors production) :

```
mamadou@jobbyblaise.com
demo1234
```

## 📦 Build de production

```bash
npm run build      # → dist/
npm start          # serveur sur 0.0.0.0:3001 (SPA + API)
```

Au premier démarrage, la base SQLite locale `database/jobbyblaise.db` est créée **vide**, sans injection automatique de démonstrations. Pour tester avec des données fictives, activer `JBB_SEED_DEMO=1` dans l’environnement du serveur local (ou utiliser `npm run seed`, qui réinitialise la base locale). Les offres de démonstration restent non publiées jusqu’à leur validation dans l’administration. Ne jamais utiliser le seed sur une base réelle : il est bloqué pour Supabase et en production.

## 🗂️ Structure

```
├── client/            # SPA React
│   └── src/
│       ├── components/  # Icon, Logo, Navbar, JobCard, JobsBoard, CompanyCard, MatchRing
│       ├── pages/       # Landing, Jobs, Entreprises, Conseils, App (dashboard, profil…)
│       └── styles.css   # design system (bleu #2E6BFF, navy, vert #00A868, ambre #F5A524)
├── server/
│   ├── db.js          # couche données double backend (SQLite / Supabase) + schéma
│   ├── seed.js        # 18 entreprises, 60 offres, 6 conseils, compte démo
│   ├── auth.js        # scrypt + JWT (HS256)
│   ├── match.js       # moteur de matching pondéré (contrat, ville, compétences, diplôme, expérience)
│   ├── routes.js      # REST API
│   └── index.js       # serveur HTTP (SPA dist + API) + scheduler d'alertes 7h00
├── supabase/          # migration.sql (7 tables schéma jobbyblaise + RPC app_exec)
├── database/          # SQLite local (ignoré par git)
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
| GET | `/api/health` | `{ ok, backend }` — `backend` = `sqlite` ou `supabase` |

## 🧪 Tests

```bash
npm run seed        # OPTIONNEL : réinitialise uniquement la base de démonstration locale
npm start &         # serveur sur :3001
WITH_TOKEN=1 npm run test:smoke  # 15 endpoints critiques
npm test            # régressions : dates SQLite/Postgres, landing, recherche, erreurs API
```

## ☁️ Production (Vercel + Supabase)

- **Vercel** sert le build (`dist/`) + l'API serverless (`api/index.js`). Variables d'env **côté serveur uniquement** :
  - `SUPABASE_URL` — ex. `https://<ref>.supabase.co`
  - `SUPABASE_KEY` — clé de service (`service_role`), jamais exposée au front (pas de préfixe `VITE_`)
- Configurer ces variables en production. Si Supabase est configuré mais indisponible, ou si la migration requise manque, le serveur refuse le démarrage sur Vercel/en production plutôt que de substituer une base locale. Aucun re-seed automatique n’a lieu.
- Sur Supabase, les tables vivent dans un schéma dédié **`jobbyblaise`** (le schéma `public` de l'hôte reste intact) ; toutes les requêtes passent par la RPC `public.app_exec` (SECURITY DEFINER, réservée aux rôles de service).
- **Cron quotidien** (`vercel.json`) : `GET /api/health` à 06:00 UTC — 2 appels DB qui empêchent la pause automatique de Supabase après 7 jours d'inactivité.

## Publication des offres et équipe

### Une seule source pour les offres publiques

- Créer une offre dans **Administration → Offres d’emploi**. Elle est en brouillon par défaut, côté interface et côté API.
- Choisir **« Publiée sur le site »** puis enregistrer. Le serveur administrateur pose `published_by_admin=1` ; ce champ ne peut pas être fourni dans le formulaire ou une requête publique.
- Le site n’expose que `is_active=1 AND published_by_admin=1` : liste/recherche, fiche, recommandations, alertes, compteurs, filtres et offres des entreprises. Archiver une offre la retire de ces accès sans effacer les candidatures historiques.
- Les anciennes offres, y compris les démonstrations, restent dans l’administration mais sont **non publiques tant qu’elles ne sont pas validées**. Aucun ancien enregistrement n’est approuvé automatiquement.

### Migration avant le prochain déploiement

1. Appliquer **`supabase/admin-job-publication.sql`** au schéma `jobbyblaise` du projet Supabase existant. Migration additive/idempotente : aucune suppression de ligne, aucun autre schéma touché. Pour une nouvelle installation, le schéma de base inclut également le champ.
2. Déployer ensuite le nouveau code Vercel. Le code précédent continue de fonctionner avec la colonne supplémentaire.
3. Au premier déploiement, le compteur public peut être à **zéro** : publier uniquement les offres vérifiées dans l’administration. Ne pas valider le jeu de démonstration en masse.
4. Vérifier une création en brouillon, une publication, une modification et un archivage. Les tests automatisés réalisent ce cycle sur une base temporaire, jamais en production.

### Notre équipe

- **Administration → Notre équipe** : noms, fonctions, présentations, liens HTTPS/chemins locaux des portraits, ordre et publication individuelle. Enregistrer applique les changements.
- Les profils sont des brouillons par défaut ; `GET /api/team` ne retourne que les profils publiés. Pas de faux noms ni de photos générées par défaut.
- Données enregistrées dans la ligne **2** de `site_content` ; la ligne **1** des textes de l’accueil reste indépendante. La migration `supabase/admin-content.sql` doit déjà être appliquée.
- La page publique `/notre-equipe` utilise trois colonnes sur ordinateur, deux sur tablette et une sur mobile, avec remplacement des photos absentes/cassées.
- Sans profil publié : emplacements « Présentation à venir » clairement identifiés. Ajouter les vrais profils et leurs photos avec l’accord des personnes concernées.

Tests supplémentaires : `node tests/team-layout.browser.mjs` et `node tests/jobs-layout.browser.mjs` (dépendances navigateur facultatives documentées dans ces fichiers).

## 🎨 Design system

- **Bleu primaire** `#2E6BFF` · **Navy** `#0A1B4D` · **Vert** `#00A868` · **Ambre** `#F5A524`
- Wordmark « Job by **blaise** » + monogramme **J** bleu (favicon)
- Illustrations SVG inline (CV, recherche) — aucune dépendance d'images externes
- Alertes simulées « Job by blaise: … » sur le canal `/api/alerts`

## 📄 Licence

MIT — © 2026 Job by blaise (www.jobbyblaise.com)

## Espace d'administration

Back-office disponible sur `/admin` (connexion `/admin/connexion`) : offres, entreprises, conseils, profils, candidatures, préférences d'alertes, journal SMS et textes de l'accueil. Les droits sont vérifiés côté serveur et restent fermés sans `ADMIN_EMAILS` et `JBB_SECRET` robuste.

Les boutons **Connexion** (`/connexion`) et **Créer un compte** (`/inscription`) concernent les clients / abonnés. Un compte réservé par `ADMIN_EMAILS` ne peut pas se connecter via `/auth/login`, ni utiliser les API candidat avec une ancienne session (403). Il utilise exclusivement `/admin/connexion` et `/auth/admin/login`. Une session administrative visitant `/app`, `/connexion` ou `/inscription` est redirigée vers `/admin`, y compris après expiration des droits : cette expiration ne transforme jamais le compte en candidat. L’onglet **Gestion des utilisateurs** (`/admin/users`) affiche la catégorie **Super administrateur** ou **Client / abonné**, calculée côté serveur ; le rôle et les identifiants ne sont pas modifiables depuis le formulaire de profil. Les droits complets restent soumis au secret serveur et à l’échéance configurée. Le stockage de session reste partagé (une seule session à la fois). Aucun mot de passe n’est stocké dans le dépôt.

Voir [l'audit fonctionnel, le provisionnement et le guide de déploiement](docs/ADMINISTRATION.md). Pour une base Supabase existante, appliquer la migration additive `supabase/admin-content.sql` avant de publier ce code. Aucun déploiement ni changement des secrets de production n'est effectué automatiquement.
