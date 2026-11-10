# Administration — Job by blaise

## Audit fonctionnel et couverture

L'application avait des pages publiques et un espace candidat, mais pas d'API de gestion de contenus ni de rôle administrateur. Le back-office réutilise les mêmes tables et la même identité visuelle, sans dupliquer les données.

| Module existant | Gestion dans `/admin` | Garde-fous |
| --- | --- | --- |
| Recherche, matching, fiches d'offres | Création, édition, publication/archivage, suppression, recherche, pagination | Entreprise existante obligatoire ; salaires cohérents ; offre archivée inaccessible publiquement ; suppression refusée si candidatures liées |
| Annuaire et fiches entreprises | Création, édition de toutes les informations de la fiche, couleur de marque, suppression | Suppression refusée si offres liées ; doublons refusés |
| Conseils et articles | Création, édition du titre, catégorie, résumé, article, couleur, durée ; suppression | Texte rendu avec échappement HTML par le lecteur existant ; doublons refusés |
| Profils, compétences, CV | Consultation, édition des coordonnées et informations professionnelles ; CV en lecture seule | Aucun hash/mot de passe renvoyé ; e-mail de connexion et droits non modifiables ; pas de suppression de comptes |
| Candidatures | Consultation du candidat, poste et lettre ; changement de statut ; suppression avec confirmation | États autorisés uniquement : En attente, En cours, Acceptée, Refusée |
| Alertes | Activation, téléphone, horaire, mots-clés, villes, contrats | Validation des heures et listes ; pas de création arbitraire d'abonnement |
| Historique SMS | Consultation complète, indicateur de lecture, suppression | Journal de **messages générés**, pas une preuve de livraison opérateur ; aucun envoi de masse ajouté |
| Accueil et pied de page | 25 champs éditoriaux persistés (hero, CV, matching, parcours, invitation, contact) | Schéma de champs fermé, textes requis et bornés, e-mail validé ; pas d'HTML arbitraire |
| Connexion / inscription | Connexion dédiée `/admin/connexion`, permissions côté serveur | Inscription publique refusée pour les e-mails réservés administrateurs |
| Tableau de bord | Comptages réels, offres actives/non publiées, dernières candidatures, raccourcis | Aucun KPI de croissance fictif |
| Infrastructure | Configuration en lecture seule : type de base, compte, règles d'accès | Aucun secret affiché ou modifiable dans le navigateur |

La navigation, les illustrations SVG, la structure des pages et les algorithmes de matching restent du code, pas des contenus éditoriaux. Pas de téléversement média, de changement de mot de passe, de gestion des rôles dans le navigateur, ni d'effacement de comptes personnels dans cette première version. Les URL des boutons restent volontairement fixes pour préserver les parcours.

## Accès et provisionnement

L'accès utilise une liste **serveur** `ADMIN_EMAILS` et les sessions HMAC existantes. Le serveur recalcule l'autorisation à chaque requête : le champ `isAdmin` du navigateur n'est jamais une source de droits.

1. Générer `JBB_SECRET` avec au moins 32 caractères aléatoires (48 octets recommandés). Le secret de développement par défaut n'autorise **aucun** administrateur. Changer ce secret invalide les anciennes sessions.
2. Pour créer un compte explicitement, fournir `ADMIN_CREATE_EMAIL` et `ADMIN_CREATE_PASSWORD` (au moins 12 caractères) au script `npm run admin:create`, connecté à la bonne base. Le script refuse d'écraser un compte existant ou son mot de passe. Fournir les valeurs via l'environnement, pas dans un fichier versionné.
3. Ajouter l'e-mail du compte existant à `ADMIN_EMAILS` (plusieurs adresses séparées par des virgules). Un compte existant connu peut être autorisé sans recréation. Ne pas autoriser le compte candidat de démonstration sur une base publique.
4. Relancer le serveur et ouvrir `/admin/connexion`.

En local, `npm start` et `npm run admin:create` lisent `.env.local`, ignoré par Git. `.env.example` documente les clés sans valeurs. Les accès temporaires de l'aperçu ne sont pas des accès de production.

## Base de données / déploiement

- **SQLite local** : la table `site_content` est créée par `initSchema`. Les clés étrangères sont activées. `JBB_DB_DIR` permet d'isoler les bases de test.
- **Supabase existant** : appliquer **uniquement** `supabase/admin-content.sql` avant le déploiement du nouveau code. Migration additive, idempotente, RLS activée, aucune modification de `public` ni des autres projets. La RPC de service existante réutilise son `search_path = jobbyblaise, public, pg_temp`.
- **Installation Supabase neuve** : `supabase/migration.sql` inclut également cette table.
- Configurer `JBB_SECRET` et `ADMIN_EMAILS` dans l'environnement de production. Conserver `SUPABASE_URL` et `SUPABASE_KEY` exclusivement côté serveur.
- Le nouveau back-office n'a pas été déployé automatiquement et ne nécessite aucune réinitialisation des données.

## API

Toutes les routes `/api/admin/*` nécessitent une session valide **et** une autorisation administrateur (401 sans session, 403 pour un candidat). Les réponses sont `no-store`.

- `GET /api/admin/summary` : indicateurs et cinq dernières candidatures.
- `GET /api/admin/options` : entreprises disponibles pour le formulaire d'offre.
- `GET /api/admin/:resource?q=&page=&status=` : pagination de 20 lignes, filtres liés, ressources autorisées : `jobs`, `companies`, `advice`, `users`, `applications`, `alerts`, `sms`.
- `POST /api/admin/:resource` : entreprises, offres et conseils seulement.
- `PUT /api/admin/:resource/:id` : champs explicitement autorisés ; journal SMS non réécrivable. Pour `alerts`, l'identifiant est `user_id`.
- `DELETE /api/admin/:resource/:id` : suppression confirmée dans l'interface ; interdite pour comptes et préférences ; dépendances vérifiées et contraintes SQL conservées.
- `GET/PUT /api/admin/content` : édition des champs éditoriaux de l'accueil.
- `GET /api/content` : textes publics uniquement, sans données personnelles, avec valeurs par défaut.

Les noms de tables et colonnes proviennent uniquement de définitions internes et toutes les valeurs sont liées. Les erreurs techniques de l'administration ne sont pas exposées au client.

## UX et vérifications

Sidebar dédiée, fil de navigation, états vides, filtres, pagination, notifications d'enregistrement, erreurs explicites, confirmations de suppression, brouillons d'offres non publiés par défaut côté formulaire, liens de prévisualisation. Formulaires en panneau latéral natif `<dialog>` avec focus piégé, fermeture Échap et restitution du focus. Menu mobile, tableaux défilants, labels de formulaire, focus visible, respect des animations réduites. Les textes non enregistrés déclenchent un avertissement avant fermeture de page ou clic sur un lien de navigation.

`npm test` couvre les régressions existantes et une API d'administration démarrée sur une base SQLite temporaire : autorisations en lecture/écriture, inscription réservée, CRUD, archivage public, dépendances, listes paginées, validation, absence de secrets, statuts et persistance des textes. Les tests ne touchent ni la base locale ni Supabase.

Parcours navigateur Chromium exécuté sur l'aperçu : connexion, tableau de bord, création/édition/publication/suppression d'une offre, édition du texte d'accueil et vérification sur la page publique, navigation et formulaire mobile à 390 px. Contrôle visuel à 1440 px et 390 px, sans erreur JavaScript ni débordement horizontal de la page. Les contenus créés par ce contrôle sont supprimés et le texte initial restauré.

Non vérifiés ici : CRUD sur PostgreSQL en production, délivrabilité SMS, audit d'accessibilité exhaustif et concurrence multi-administrateurs (pas de verrouillage éditorial). Un enregistrement simultané peut écraser un changement récent.

## Finitions du back-office (aperçu uniquement)

- **Éditeur d'accueil guidé** : les 25 champs sont répartis en sept onglets (accueil, entreprises, CV, matching, parcours, invitation, pied de page). Navigation clavier avec flèches gauche/droite, Home et End ; marqueurs des sections modifiées ; compteurs de caractères ; restauration d'une seule section ou de toutes les modifications vers leur version enregistrée.
- **Aperçu des textes** : rendu simplifié qui suit les saisies locales. Il n'exécute pas les boutons du site et ne publie rien. Le compteur d'offres vient des statistiques réelles, pas d'une valeur inventée. La publication des textes reste explicite par « Enregistrer les textes ». Le serveur reste responsable de la validation. Le client vérifie aussi les champs des onglets non affichés et ouvre la section en erreur.
- **CV lisible** : dans une fiche candidat, « CV enregistré » présente résumé, expériences, formations et compétences du profil. Les données restent en lecture seule et les contenus HTML sont échappés. Les CV absents ou malformés présentent un état vide ; aucune expérience n'est fabriquée.
- **Recherche relationnelle** : les offres peuvent être recherchées par entreprise ; les candidatures par candidat, e-mail, poste ou entreprise ; les alertes et messages par candidat ou e-mail. Les jointures servent au filtrage comme au comptage pour conserver une pagination cohérente.
- **Tri et filtres** : `sort=newest|oldest|az|za` (liste blanche SQL), filtres d'activation des alertes et de lecture SMS, puces de filtres et réinitialisation. « Plus récents » utilise la date disponible (publication d'offre, inscription, candidature, mise à jour des préférences ou génération SMS) ; entreprises et conseils sont classés par identifiant de création. Un numéro de page hors limites est ramené à la dernière page existante. Le changement de rubrique ou de filtres masque les anciennes lignes pendant le chargement.
- **Suppression explicite** : fenêtre native accessible `<dialog role="alertdialog">`, focus initial sur « Conserver », identité du contenu affichée, bouton destructif distinct et erreurs de dépendances dans la fenêtre. Une offre liée à des candidatures ne peut toujours pas être supprimée ; le bouton « Modifier l'offre » permet de rejoindre son formulaire pour l'archiver. Aucun nouveau droit ni suppression en cascade ajouté.

Vérifications : 26 tests automatisés (API SQLite isolée, UI JSDOM, régressions publiques). Parcours Chromium desktop à 1440 px et mobile à 390 px : brouillon non public, validation entre onglets, enregistrement et contrôle du site public, consultation du CV, recherche par e-mail, tri/filtres, annulation et suppression réelle d'une entreprise temporaire, conflit de suppression d'une offre puis retour au formulaire. Les contenus temporaires sont supprimés et les textes initiaux restaurés.

Aucune migration supplémentaire pour ces finitions, aucun appel d'écriture Supabase et aucun déploiement Vercel. Le guide de migration initial reste nécessaire pour mettre le back-office en production.

### Aperçus des fiches et validation des formulaires

Les formulaires d'offres, d'entreprises et de conseils disposent de deux vues, **Édition** et **Aperçu local**, conservant les mêmes saisies. L'aperçu utilise l'entreprise réellement sélectionnée et n'écrit jamais en base. Il présente les textes et métadonnées sans activer les liens, recommandations ou candidatures. Pour les articles, le composant `ArticleBody` est partagé avec la page publique : React échappe les textes et le gras ; aucune insertion d'HTML arbitraire. Les marqueurs de liste ne sont plus affichés en double.

La publication reste explicite lors de l'enregistrement. Une offre configurée « Non publiée / archivée » est bien enregistrée en base mais reste inaccessible publiquement. Les entreprises et articles deviennent visibles dès l'enregistrement, sans notion de brouillon persistant supplémentaire ; un avertissement le précise dans le formulaire. Aucun champ ou statut fictif ajouté au schéma.

Validation client des champs requis, longueurs, salaires min/max, entreprises, listes, entiers, années, heures et choix fermés. Messages en français sous les champs et synthèse cliquable ; focus sur le premier champ invalide, y compris après tentative d'enregistrement depuis l'aperçu. Les validations serveur restent actives ; un article vide est également refusé en mise à jour. Les formulaires sont verrouillés durant la requête d'enregistrement pour éviter de perdre des saisies concurrentes.

Une fiche modifiée déclenche l'avertissement natif avant fermeture/rechargement de page et avant abandon par Échap ou le bouton de fermeture. `Ctrl/⌘ + S` enregistre depuis une fiche éditable (y compris son aperçu). Il n'y a ni sauvegarde automatique ni persistance de brouillon local après fermeture volontaire de la fiche.

Vérifications supplémentaires : 32 tests automatisés au total, dont validation des formulaires, retour/focus depuis l'aperçu, blocage d'enregistrement invalide, garde de sortie, verrouillage pendant la requête et échappement de l'article. Parcours Chromium à 1440 px et 390 px : création d'une offre non publiée par raccourci clavier, contrôle de son absence publique, publication explicite, aperçu et rendu public d'article, refus d'abandon de saisie, aperçu entreprise mobile et conservation des champs au retour à l'édition. Offres et articles temporaires supprimés après essais ; aucune donnée de production touchée.

### Accès administrateur temporaire

`ADMIN_ACCESS_EXPIRES_AT` permet de limiter un accès administrateur à une échéance ISO UTC. Si cette variable est renseignée, le serveur refuse les droits dès l'échéance (ou si la date est invalide), même avec une session valide et un e-mail autorisé. Le navigateur affiche l'échéance et retire également la vue d'administration à expiration ; l'autorité reste le contrôle serveur. Sans cette variable, les droits suivent la liste `ADMIN_EMAILS` comme précédemment. Pour un accès permanent, utiliser un compte privé avec un mot de passe fort, jamais le compte de démonstration public.
