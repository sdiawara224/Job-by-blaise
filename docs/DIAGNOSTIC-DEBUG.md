# Diagnostic technique — Job by blaise

## Périmètre

Revue du code API/authentification/stockage, tests automatisés sur bases temporaires, compilation de production et contrôles navigateur avec données simulées. Aucun compte, profil, candidature ou contenu de production modifié. Ce contrôle n’est pas un audit de sécurité exhaustif ni une validation de tous les parcours sur la base réelle.

## Problèmes corrigés

### 1. Réponses HTML sur les erreurs API

**Reproduit** : un JSON tronqué envoyé à `/api/auth/login` renvoyait `text/html`, et non le JSON attendu par le client. Cela masquait le message utile derrière « Erreur 400 » et pouvait exposer des détails internes avec le gestionnaire Express par défaut.

**Correction** : gestionnaire global pour les erreurs JSON, limites de taille, adresses mal encodées et erreurs inattendues ; réponse JSON 404 pour les routes API inconnues ; erreurs internes non exposées ; cache désactivé également sur les erreurs du parseur. La limite JSON reste de 1 Mo, celle des portraits de 3 Mo.

### 2. Filtres de recherche non textuels

Les paramètres répétés ou structurés (`city[x]=Conakry`, `city=Conakry&city=Kindia`) pouvaient atteindre le moteur SQL avec un type incorrect. Les filtres sont désormais validés comme textes de 200 caractères maximum et refusés en HTTP 400 sinon. Les recherches ordinaires et les requêtes paramétrées sont conservées.

### 3. Dépendances avec alertes de sécurité

Mises à jour verrouillées dans le manifeste et le lockfile :

- Express : 4.19.2 → 4.22.3.
- React Router DOM : 6.26.2 → 6.30.6, sans migration majeure de l’application.
- Sharp : 0.34.5 → 0.35.5 (bibliothèques natives de traitement d’images).
- Vite : 5.4.8 → 6.4.6 ; plugin React : 4.3.1 → 4.7.0 ; esbuild : 0.21.5 → 0.28.2.

Après mises à jour, `npm audit` sur le projet verrouillé ne signale plus d’alerte élevée ou critique. Il reste **deux entrées modérées** (`react-router` et `react-router-dom`, dépendances liées). Les avis portent notamment sur des redirections et l’hydratation SSR. Le projet utilise un rendu client et des destinations internes construites dans le code ; cela ne constitue pas une preuve d’absence d’exploitabilité. Une migration majeure vers React Router 7 corrigé doit faire l’objet d’une validation dédiée, plutôt qu’un `npm audit fix --force` aveugle.

L’allowlist du serveur de développement autorise le suffixe de prévisualisation `.e2b.app`, sans désactiver globalement la vérification des hôtes.

## Vérifications réalisées

- `npm test` : **96 tests réussis**, aucune erreur. Couverture notamment des autorisations admin/candidat, validations des formulaires, publication, notifications et import des portraits.
- Nouveau test de régression : JSON tronqué, JSON trop volumineux, URL mal encodée, route inexistante et filtres structurés/répétés/trop longs. Vérifie les statuts, le JSON, l’absence de traces et le cache.
- `NO_MINIFY=1 npm run build` : compilation réussie, réglage de débogage existant conservé.
- `git diff --check` : réussi.
- Navigateur réel, données simulées : équipe sur 8 largeurs avec deux tailles de texte ; offres sur 7 largeurs avec filtres, état vide et reprise après erreur ; cartes entreprises sur 10 largeurs avec deux tailles de texte. Aucun débordement ou erreur JavaScript détecté par ces contrôles.

## Points identifiés, non corrigés dans cette passe

### Priorité fonctionnelle — Les SMS ne sont pas réellement expédiés

`sendAlertToUser` dans `server/routes.js` insère le message dans `sms_messages` et met à jour `last_sent_on`, mais ne contacte aucun fournisseur télécom. Un message affiché dans l’historique ne prouve donc pas sa livraison sur téléphone.

Le planificateur de `server/index.js` repose sur `setInterval`, qui n’est pas une planification fiable dans une fonction serverless. Le cron actuel de `vercel.json` appelle uniquement `/api/health` chaque jour, pas le traitement des alertes. **Recommandation** : choisir un prestataire SMS, définir le consentement/coût et mettre en place une tâche authentifiée avec reprise et déduplication. Aucun envoi ni changement de configuration effectué.

### Performance — Bundle de débogage volumineux

La compilation existante avec `NO_MINIFY=1` génère un bundle JavaScript d’environ **4,53 Mo**, soit **1,04 Mo gzip**, avec React en mode développement et une source map intégrée. Cela peut ralentir le chargement sur mobile. Ce réglage a été conservé volontairement, car il sert au diagnostic des anciennes pages blanches. **Recommandation** : valider séparément un build production optimisé, puis changer le réglage de déploiement après tests des parcours critiques.

### Sécurité — Limitation des tentatives de connexion

Aucun mécanisme explicite de limitation des tentatives n’a été trouvé dans les handlers de connexion Express. Ce constat ne couvre pas les éventuelles protections de la plateforme. **Recommandation** : protection persistante adaptée au serverless, sans simple compteur mémoire local.

### Outil de smoke test historique

`smoke-test.mjs` utilise encore des identifiants de démonstration et effectue des mutations (création d’un compte, modification du profil, candidature, alerte). **Ne pas le lancer sur la production.** Il n’a pas été exécuté pendant ce diagnostic. Les tests isolés remplacent ce script pour cette passe.

## Limites

Les tests navigateur utilisent des API simulées, pas un parcours d’écriture de production. Aucun SMS réel envoyé, aucun test de charge, aucun test d’intrusion, aucun nettoyage de stockage. Les deux alertes modérées restantes doivent être suivies ; une suite verte ne signifie pas qu’aucun autre défaut n’existe.
