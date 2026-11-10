export const SECTIONS = {
  overview: { label: 'Vue d’ensemble', icon: 'home', description: 'Une vue claire sur votre plateforme, pour agir au bon endroit.' },
  jobs: { label: 'Offres d’emploi', icon: 'jobs', singular: 'une offre', description: 'Créez, publiez et archivez les opportunités de votre communauté.', columns: [['title', 'Offre'], ['company_name', 'Entreprise'], ['city', 'Ville'], ['is_active', 'Publication']], fields: [
    ['title', 'Intitulé du poste', 'text', true], ['company_id', 'Entreprise', 'company', true], ['city', 'Ville', 'text', true], ['country', 'Pays', 'text', true], ['contract', 'Type de contrat', 'text', true], ['domain', 'Domaine', 'text', true], ['salary_min', 'Salaire minimum (GNF)', 'number'], ['salary_max', 'Salaire maximum (GNF)', 'number'], ['experience_min', 'Expérience minimum (années)', 'number'], ['education_min', 'Niveau d’études', 'text'], ['skills', 'Compétences · séparées par des virgules', 'list'], ['description', 'Description du poste', 'textarea'], ['requirements', 'Prérequis', 'textarea'], ['is_active', 'Publication', 'publication'],
  ], defaults: { country: 'Guinée', city: 'Conakry', contract: 'Temps plein', domain: 'Administration', salary_min: 0, salary_max: 0, experience_min: 0, education_min: '', skills: [], description: '', requirements: '', is_active: 0 } },
  companies: { label: 'Entreprises', icon: 'briefcase', singular: 'une entreprise', description: 'Soignez les vitrines des entreprises qui recrutent sur votre plateforme.', columns: [['name', 'Entreprise'], ['sector', 'Secteur'], ['city', 'Ville'], ['staff_size', 'Effectif']], fields: [
    ['name', 'Nom de l’entreprise', 'text', true], ['sector', 'Secteur d’activité', 'text', true], ['city', 'Ville', 'text', true], ['founded_year', 'Année de création', 'number'], ['staff_size', 'Effectif', 'text'], ['color', 'Couleur de marque', 'color'], ['description', 'Présentation', 'textarea'],
  ], defaults: { city: 'Conakry', color: '#2E6BFF', founded_year: 2020, staff_size: '1 à 10 collaborateurs', description: '' } },
  advice: { label: 'Conseils carrière', icon: 'advice', singular: 'un conseil', description: 'Des contenus utiles pour accompagner chaque étape du parcours candidat.', columns: [['title', 'Article'], ['category', 'Catégorie'], ['minutes', 'Lecture (min)']], fields: [
    ['title', 'Titre de l’article', 'text', true], ['category', 'Catégorie', 'text', true], ['minutes', 'Temps de lecture (minutes)', 'number', true], ['color', 'Couleur', 'color'], ['excerpt', 'Résumé', 'textarea'], ['content', 'Article · **gras** et listes avec tirets', 'textarea', true],
  ], defaults: { category: 'Carrière', minutes: 4, color: '#2E6BFF', excerpt: '', content: '' } },
  users: { label: 'Candidats', icon: 'team', description: 'Retrouvez les profils et accompagnez vos candidats. Les mots de passe restent privés.', columns: [['full_name', 'Candidat'], ['email', 'E-mail'], ['city', 'Ville'], ['title', 'Poste recherché']], fields: [
    ['full_name', 'Nom complet', 'text', true], ['phone', 'Téléphone', 'text'], ['city', 'Ville', 'text', true], ['title', 'Poste recherché', 'text'], ['education', 'Niveau d’études', 'text'], ['experience_years', 'Expérience (années)', 'number'], ['skills', 'Compétences · séparées par des virgules', 'list'], ['bio', 'Présentation', 'textarea'],
  ], noCreate: true, noDelete: true },
  applications: { label: 'Candidatures', icon: 'apps', description: 'Faites avancer les candidatures, de la première prise de contact à la réponse.', columns: [['full_name', 'Candidat'], ['job_title', 'Offre'], ['status', 'Statut'], ['created_at', 'Date']], fields: [['status', 'Statut de la candidature', 'status', true]], noCreate: true },
  alerts: { label: 'Alertes & préférences', icon: 'bell', description: 'Gérez les préférences de matching et les horaires des alertes candidats.', columns: [['full_name', 'Candidat'], ['phone', 'Téléphone'], ['send_time', 'Horaire serveur'], ['enabled', 'Activation']], fields: [
    ['enabled', 'Alertes', 'enabled'], ['phone', 'Téléphone', 'text'], ['send_time', 'Heure d’envoi (heure du serveur)', 'time', true], ['keywords', 'Mots-clés · séparés par des virgules', 'list'], ['cities', 'Villes · séparées par des virgules', 'list'], ['contracts', 'Contrats · séparés par des virgules', 'list'],
  ], noCreate: true, noDelete: true },
  sms: { label: 'Journal SMS', icon: 'sms', description: 'Messages générés par l’application. Ce journal ne certifie pas une livraison par un opérateur SMS.', columns: [['full_name', 'Destinataire'], ['body', 'Message généré'], ['sent_at', 'Date'], ['is_read', 'Lecture']], fields: [], noCreate: true, readOnly: true },
  content: { label: 'Page d’accueil', icon: 'layout', description: 'Votre ton, vos mots. Modifiez les textes de l’accueil et du pied de page sans toucher au code.' },
  settings: { label: 'Configuration', icon: 'settings', description: 'Les informations techniques et les règles d’accès de votre espace.' },
};
export const STATUSES = ['En attente', 'En cours', 'Acceptée', 'Refusée'];

// Même vocabulaire pour les filtres visuels et les valeurs transmises à l'API.
export const LIST_FILTERS = {
  jobs: [['1', 'Publiées'], ['0', 'Non publiées']],
  applications: STATUSES.map((status) => [status, status]),
  alerts: [['1', 'Activées'], ['0', 'Désactivées']],
  sms: [['1', 'Lus'], ['0', 'Non lus']],
};
export const LIST_SORTS = [['newest', 'Plus récents'], ['oldest', 'Plus anciens'], ['az', 'A → Z'], ['za', 'Z → A']];
export const SEARCH_HINTS = {
  jobs: 'Poste, entreprise, ville…', companies: 'Nom, secteur, ville…', advice: 'Titre, catégorie, résumé…',
  users: 'Nom, e-mail, ville…', applications: 'Candidat, poste, entreprise…', alerts: 'Candidat, e-mail, téléphone…', sms: 'Candidat, e-mail, message…',
};
