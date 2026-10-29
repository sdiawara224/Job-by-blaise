// CarrièreOS — jeu de données de démonstration (entreprises, offres, conseils, utilisateur démo)
import { db, initSchema } from './db.js';
import { hashPassword } from './auth.js';

const D = (daysAgo) => {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

// [nom, secteur, ville, description, couleur, fondée en, taille]
export const COMPANIES = [
  ['Ghapia Logistics', 'Transport & Logistique', 'Conakry', 'Opérateur logistique multimodal basé au Port de Kaloum, spécialiste du fret ouest-africain.', '#2E6BFF', 2016, '51 à 200 collaborateurs'],
  ['FBC Télécom', 'Télécommunications', 'Conakry', 'Opérateur de services numériques et connectivité pour les entreprises de Guinée.', '#7C3AED', 2014, '201 à 500 collaborateurs'],
  ['Mining Resources Guinée', 'Industrie minière', 'Boké', 'Compagnie bauxitière engagée dans l’exploitation responsable et le développement local.', '#EA580C', 2011, '501 à 1000 collaborateurs'],
  ['Banque du Sahel Guinée', 'Banque & Finance', 'Conakry', 'Banque de détail et d’entreprise présente dans 6 pays d’Afrique de l’Ouest.', '#0F766E', 2010, '501 à 1000 collaborateurs'],
  ['Résidence Belmont', 'Hôtellerie & Tourisme', 'Conakry', 'Groupe hôtelier 4 étoiles : chambres, séminaires et restauration.', '#DB2777', 2013, '11 à 50 collaborateurs'],
  ['Enfance Avenir ONG', 'ONG & Développement', 'Conakry', 'ONG de terrain : éducation, santé communautaire et autonomisation des femmes.', '#16A34A', 2017, '11 à 50 collaborateurs'],
  ['Agro Guinée SARL', 'Agriculture & Agroalimentaire', 'Kankan', 'Transformation et commercialisation des produits vivriers de la haute Guinée.', '#65A30D', 2018, '11 à 50 collaborateurs'],
  ['Digital Conakry', 'Technologie & Numérique', 'Conakry', 'Studio produit web & mobile : applications pour les PME ouest-africaines.', '#2563EB', 2020, '1 à 10 collaborateurs'],
  ['Clinique La Providence', 'Santé', 'Conakry', 'Centre médical multimodal : consultations, urgences, maternité, imagerie.', '#DC2626', 2012, '51 à 200 collaborateurs'],
  ['Académie Numérique Guinée', 'Éducation & Formation', 'Conakry', 'Organisme de formation aux métiers du numérique et du multilinguisme.', '#0891B2', 2019, '11 à 50 collaborateurs'],
  ['Énergie Power Guinée', 'Énergie & Utilities', 'Labé', 'Production et distribution d’électricité hydro et solaire en région.', '#F59E0B', 2015, '51 à 200 collaborateurs'],
  ['Groupe Diallo Commerce', 'Distribution & Commerce', 'Nzérékoré', 'Réseau de distribution de biens de grande consommation en Guinée forestière.', '#9333EA', 2008, '201 à 500 collaborateurs'],
  ['SBX Bauxite Co', 'Industrie minière', 'Boké', 'JV international d’extraction de bauxite, logistique rail–port.', '#C2410C', 2009, '1000+ collaborateurs'],
  ['Lagune Digital', 'Technologie & Numérique', 'Abidjan', 'Agence produit Côte d’Ivoire : plateformes e-commerce et fintech.', '#4F46E5', 2018, '11 à 50 collaborateurs'],
  ['Bamako Logistique', 'Transport & Logistique', 'Bamako', 'Transport transfrontalier marchandises et gestion de dépôts au Mali.', '#0D9488', 2016, '51 à 200 collaborateurs'],
  ['Dakar Tech Hub', 'Technologie & Numérique', 'Dakar', 'Incubateur et accélérateur de startups sénégalaises.', '#E11D48', 2021, '1 à 10 collaborateurs'],
  ['Douala Industries', 'Industrie & BTP', 'Douala', 'Bâtiment industriel et maintenance d’ouvrages au Cameroun.', '#7C2D12', 2012, '201 à 500 collaborateurs'],
  ['Clinique du Fleuve', 'Santé', 'Kankan', 'Clinique privée de référence de la région de Kankan.', '#BE123C', 2017, '11 à 50 collaborateurs'],
];

const DOMAIN_DESC = {
  Administration: {
    desc: 'Vous intégrez l’équipe administrative de l’entreprise et assurez le bon fonctionnement quotidien des services : classement, suivis, réunions, coordination des services.',
    req: 'Bonne organisation, rigueur, maîtrise du pack Office, excellent relationnel et discrétion.',
  },
  Comptabilité: {
    desc: 'Vous prenez en charge la saisie comptable, le rapprochement des comptes et l’élaboration des états financiers sous le contrôle du responsable comptable.',
    req: 'Formation comptable, rigueur extrême, maîtrise d’un logiciel de comptabilité (Sage, QuickBooks ou équivalent).',
  },
  'Technologie & Numérique': {
    desc: 'Vous concevez et développez des solutions numériques en collaboration avec les designers et le product owner, dans une méthode agile.',
    req: 'Bases solides en programmation, goût du code propre, capacité à livrer vite et bien, anglais technique apprécié.',
  },
  Commercial: {
    desc: 'Vous développez le portefeuille clients, présentez les offres, négociez et suivez les objectifs de vente sur votre secteur.',
    req: 'Dynamisme, aisance relationnelle, esprit d’initiative et respect des objectifs.',
  },
  Logistique: {
    desc: 'Vous organisez les flux de marchandises : réception, stockage, préparation des expéditions et suivi des transporteurs.',
    req: 'Rigueur, maîtrise des outils bureautiques, connaissance des procédures douanières appréciée.',
  },
  Industrie: {
    desc: 'Vous participez à la production et à la maintenance des équipements dans le respect des normes HSE du site.',
    req: 'Formation technique, sens de la sécurité, aptitude au travail en équipe sur site.',
  },
  Santé: {
    desc: 'Vous assurez des soins de qualité aux patients dans le respect du protocole médical et de la déontologie.',
    req: 'Diplôme professionnel valide, sens du service, sang-froid et esprit d’équipe.',
  },
  Éducation: {
    desc: 'Vous concevez et animez des formations qualifiantes pour les jeunes et les professionnels en reconversion.',
    req: 'Pédagogie, maîtrise du sujet, capacité à évaluer les progrès des apprenants.',
  },
  ONG: {
    desc: 'Vous pilotez des interventions de terrain : planification, collecte de données, suivi-indicateurs et reporting bailleurs.',
    req: 'Expérience ONG appréciée, rédaction administrative solide, mobilité terrain.',
  },
  'Ressources humaines': {
    desc: 'Vous accompagnez le cycle de vie collaborateur : recrutement, intégration, paie et développement des compétences.',
    req: 'Connaissance du droit social, discrétion, excellent relationnel.',
  },
  Marketing: {
    desc: 'Vous construisez la visibilité de la marque : campagnes digitales, contenus, partenariats et analyse des performances.',
    req: 'Créativité, maîtrise des réseaux sociaux et des outils d’analyse.',
  },
  Énergie: {
    desc: 'Vous assurez la maintenance et l’exploitation des installations électriques selon les procédures techniques.',
    req: 'Formation en électrotechnique, rigueur sécurité, autonomie.',
  },
  Hôtellerie: {
    desc: 'Vous accueillez les clients, gérez les réservations et garantissez un séjour de qualité au standard de l’établissement.',
    req: 'Excellente présentation, maîtrise du français (anglais plus), sens du service.',
  },
  BTP: {
    desc: 'Vous suivez les chantiers : planification, contrôle des quantités, coordination des sous-traitants et respect des délais.',
    req: 'Maîtrise d’AutoCAD ou équivalent, sens de l’observation, rigueur.',
  },
};

const JOBS = [
  // title, companyIdx, city, country, contract, salMin, salMax (GNF), expMin, edu, domain, skills, daysAgo
  ['Assistant Administratif', 0, 'Conakry', 'Guinée', 'Temps plein', 3500000, 5000000, 1, 'Bac+2', 'Administration', ['Excel', 'Communication', 'Organisation', 'PowerPoint'], 1],
  ['Chargé de Recrutement', 4, 'Conakry', 'Guinée', 'Temps plein', 5000000, 7000000, 2, 'Bac+3', 'Ressources humaines', ['Recrutement', 'Ressources humaines', 'Communication'], 3],
  ['Comptable Général', 3, 'Conakry', 'Guinée', 'Temps plein', 6000000, 8500000, 3, 'Bac+3', 'Comptabilité', ['Comptabilité', 'Sage', 'Excel', 'SQL'], 2],
  ['Développeur Full-Stack (React/Node)', 7, 'Conakry', 'Guinée', 'Temps plein', 9000000, 14000000, 2, 'Bac+3', 'Technologie & Numérique', ['JavaScript', 'React', 'SQL', 'Python'], 0],
  ['Responsable Commercial Terrain', 11, 'Nzérékoré', 'Guinée', 'Temps plein', 5500000, 9000000, 3, 'Bac', 'Commercial', ['Vente', 'Négociation', 'Communication'], 4],
  ['Agent de Logistique Portuaire', 0, 'Conakry', 'Guinée', 'Temps plein', 3800000, 5200000, 1, 'Bac', 'Logistique', ['Logistique', 'Transport', 'Excel'], 5],
  ['Technicien de Maintenance Industrielle', 2, 'Boké', 'Guinée', 'Temps plein', 5000000, 7500000, 2, 'Bac+2', 'Industrie', ['Maintenance', 'Électricité', 'Mécanique'], 6],
  ['Infirmier(ère) Hôpital de Jour', 8, 'Conakry', 'Guinée', 'Temps plein', 4500000, 6000000, 1, 'Bac+3', 'Santé', ['Soins infirmiers', 'Sécurité', 'Communication'], 2],
  ['Formateur(ice) Développement Web', 9, 'Conakry', 'Guinée', 'CDD', 5500000, 7000000, 2, 'Bac+3', 'Éducation', ['JavaScript', 'React', 'Rédaction'], 7],
  ['Ingénieur des Mines — Exploitation', 12, 'Boké', 'Guinée', 'Temps plein', 15000000, 22000000, 4, 'Bac+5', 'Industrie', ['Sécurité', 'Organisation', 'Analyse de données'], 8],
  ['Analyste Marketing Digital', 13, 'Abidjan', 'Côte d’Ivoire', 'Temps plein', 7000000, 10000000, 2, 'Bac+3', 'Marketing', ['Marketing digital', 'SEO', 'Analyse de données'], 1],
  ['Développeur Front-End React', 15, 'Dakar', 'Sénégal', 'Temps plein', 8000000, 12000000, 2, 'Bac+3', 'Technologie & Numérique', ['JavaScript', 'React', 'CSS'], 3],
  ['Chef de Projet Digital', 13, 'Abidjan', 'Côte d’Ivoire', 'Temps plein', 9500000, 13000000, 4, 'Bac+5', 'Technologie & Numérique', ['Gestion de projet', 'Communication', 'SQL'], 9],
  ['Secrétaire de Direction', 6, 'Kankan', 'Guinée', 'Temps plein', 3200000, 4300000, 1, 'Bac+2', 'Administration', ['Organisation', 'PowerPoint', 'Français'], 10],
  ['Responsable RH', 3, 'Conakry', 'Guinée', 'Temps plein', 8500000, 12000000, 5, 'Bac+5', 'Ressources humaines', ['Ressources humaines', 'Recrutement', 'Gestion de projet'], 11],
  ['Commercial B2B Télécom', 1, 'Conakry', 'Guinée', 'Temps plein', 4500000, 8000000, 2, 'Bac', 'Commercial', ['Vente', 'Négociation', 'Service client'], 4],
  ['Technicien Réseau & Systèmes', 1, 'Conakry', 'Guinée', 'Temps plein', 5500000, 7500000, 2, 'Bac+2', 'Technologie & Numérique', ['Réseaux', 'Linux', 'Cisco / TCP-IP'], 6],
  ['Chargé(e) de Communication', 5, 'Conakry', 'Guinée', 'CDD', 4000000, 5500000, 2, 'Bac+3', 'Marketing', ['Communication', 'Rédaction', 'Design graphique'], 5],
  ['Auditeur Comptable Junior', 3, 'Conakry', 'Guinée', 'Temps plein', 6500000, 9000000, 2, 'Bac+3', 'Comptabilité', ['Comptabilité', 'Excel', 'Analyse de données'], 12],
  ['Agent Service Client (Francophone)', 14, 'Bamako', 'Mali', 'Temps plein', 3500000, 4800000, 0, 'Bac', 'Commercial', ['Service client', 'Français', 'Communication'], 2],
  ['Stage — Marketing & Communication', 7, 'Conakry', 'Guinée', 'Stage', 1500000, 2200000, 0, 'Bac+3', 'Marketing', ['Marketing digital', 'Rédaction', 'PowerPoint'], 1],
  ['Stage — Développement Logiciel', 7, 'Conakry', 'Guinée', 'Stage', 1800000, 2500000, 0, 'Bac+3', 'Technologie & Numérique', ['Python', 'SQL', 'JavaScript'], 0],
  ['Responsable de Résidence', 4, 'Conakry', 'Guinée', 'Temps plein', 6000000, 8000000, 4, 'Bac+3', 'Hôtellerie', ['Organisation', 'Service client', 'Anglais'], 13],
  ['Chef Pâtissier / Pâtissière', 4, 'Conakry', 'Guinée', 'Temps plein', 4500000, 6000000, 3, 'Bac', 'Hôtellerie', ['HACCP', 'Organisation', 'Service client'], 14],
  ['Chargé(e) de Programme ONG', 5, 'Conakry', 'Guinée', 'CDD', 6500000, 8500000, 3, 'Bac+3', 'ONG', ['Gestion de projet', 'Rédaction', 'Analyse de données'], 7],
  ['Agent de Terrain — Enquête Santé', 5, 'Conakry', 'Guinée', 'CDD', 3000000, 4000000, 1, 'Bac+2', 'ONG', ['Organisation', 'Communication', 'SQL'], 8],
  ['Magasinier / Magasinière', 6, 'Kankan', 'Guinée', 'Temps plein', 2800000, 3600000, 1, 'Bac', 'Logistique', ['Organisation', 'Excel', 'Transport'], 9],
  ['Responsable de Production Agro', 6, 'Kankan', 'Guinée', 'Temps plein', 7000000, 9500000, 4, 'Bac+5', 'Industrie', ['HACCP', 'Gestion de projet', 'Agriculture'], 10],
  ['Technicien Agricole', 6, 'Kindia', 'Guinée', 'Temps plein', 3000000, 4200000, 1, 'Bac+2', 'Industrie', ['Agriculture', 'Organisation', 'Transport'], 11],
  ['Administrateur Système (Linux)', 9, 'Conakry', 'Guinée', 'Temps plein', 7500000, 10500000, 3, 'Bac+3', 'Technologie & Numérique', ['Linux', 'Réseaux', 'Sécurité'], 3],
  ['Data Analyst Junior', 7, 'Conakry', 'Guinée', 'Temps plein', 7000000, 9500000, 1, 'Bac+3', 'Technologie & Numérique', ['SQL', 'Python', 'Analyse de données'], 2],
  ['Ingénieur HSE — Site Minier', 12, 'Boké', 'Guinée', 'Temps plein', 13000000, 18000000, 4, 'Bac+5', 'Industrie', ['Sécurité', 'Organisation', 'Maintenance'], 12],
  ['Conducteur de Travaux BTP', 16, 'Douala', 'Cameroun', 'Temps plein', 7000000, 10000000, 4, 'Bac+2', 'BTP', ['AutoCAD', 'Organisation', 'Sécurité'], 6],
  ['Dessinateur Projetiste (AutoCAD)', 16, 'Douala', 'Cameroun', 'Temps plein', 5000000, 7000000, 2, 'Bac+2', 'BTP', ['AutoCAD', 'Excel', 'Sécurité'], 7],
  ['Représentant Pharmaceutique', 17, 'Kankan', 'Guinée', 'Temps plein', 5000000, 7500000, 2, 'Bac+3', 'Commercial', ['Vente', 'Négociation', 'Communication'], 4],
  ['Cadre de Santé Publique', 17, 'Kankan', 'Guinée', 'CDD', 5500000, 7000000, 3, 'Bac+5', 'Santé', ['Soins infirmiers', 'Analyse de données', 'Organisation'], 5],
  ['Aide-Comptable', 10, 'Labé', 'Guinée', 'Temps plein', 3000000, 4000000, 1, 'Bac+2', 'Comptabilité', ['Comptabilité', 'Excel', 'Sage'], 8],
  ['Technicien Électricien Réseau', 10, 'Labé', 'Guinée', 'Temps plein', 3800000, 5200000, 2, 'Bac+2', 'Énergie', ['Électricité', 'Maintenance', 'Sécurité'], 9],
  ['Opérateur/Trice de Caisse', 11, 'Nzérékoré', 'Guinée', 'Temps partiel', 2500000, 3200000, 0, 'Bac', 'Commercial', ['Service client', 'Excel', 'Organisation'], 3],
  ['Chef de Produit Marketing', 11, 'Nzérékoré', 'Guinée', 'Temps plein', 6500000, 9000000, 4, 'Bac+3', 'Marketing', ['Marketing digital', 'Analyse de données', 'Négociation'], 10],
  ['Consultant(e) CRM — Freelance', 13, 'Abidjan', 'Côte d’Ivoire', 'Freelance', 250000, 450000, 3, 'Bac+3', 'Technologie & Numérique', ['SQL', 'Marketing digital', 'Gestion de projet'], 2],
  ['Assistant(e) de Direction', 3, 'Conakry', 'Guinée', 'Temps plein', 4500000, 6000000, 2, 'Bac+3', 'Administration', ['Organisation', 'PowerPoint', 'Français'], 1],
  ['Community Manager', 15, 'Dakar', 'Sénégal', 'Temps partiel', 3500000, 5000000, 1, 'Bac', 'Marketing', ['Marketing digital', 'Rédaction', 'Design graphique'], 0],
  ['Développeur Python / Data', 15, 'Dakar', 'Sénégal', 'CDD', 9000000, 13000000, 3, 'Bac+3', 'Technologie & Numérique', ['Python', 'SQL', 'Analyse de données'], 5],
  ['Agent de Transit Douanier', 14, 'Bamako', 'Mali', 'Temps plein', 4000000, 5500000, 2, 'Bac+2', 'Logistique', ['Transport', 'Organisation', 'Excel'], 11],
  ['Responsable Dépôt', 14, 'Bamako', 'Mali', 'Temps plein', 5500000, 7000000, 4, 'Bac+2', 'Logistique', ['Logistique', 'Gestion de projet', 'Excel'], 12],
  ['Enseignant(e) de Français', 9, 'Conakry', 'Guinée', 'Temps plein', 3500000, 4800000, 2, 'Bac+3', 'Éducation', ['Français', 'Rédaction', 'Communication'], 6],
  ['Formateur(ice) Comptabilité (PME)', 9, 'Conakry', 'Guinée', 'CDD', 5000000, 6500000, 3, 'Bac+3', 'Éducation', ['Comptabilité', 'Excel', 'Formation'], 7],
  ['Responsable Boutique', 11, 'Conakry', 'Guinée', 'Temps plein', 5000000, 7000000, 3, 'Bac', 'Commercial', ['Vente', 'Organisation', 'Service client'], 8],
  ['Soudeur(ère) Qualifié(e)', 16, 'Douala', 'Cameroun', 'Temps plein', 3500000, 5000000, 2, 'Bac', 'Industrie', ['Maintenance', 'Sécurité', 'Mécanique'], 9],
  ['Stagiaire Banque — Agence Conakry', 3, 'Conakry', 'Guinée', 'Stage', 1500000, 2000000, 0, 'Bac+3', 'Comptabilité', ['Comptabilité', 'Service client', 'Excel'], 1],
  ['Analyste Crédit PME', 3, 'Conakry', 'Guinée', 'Temps plein', 7500000, 10000000, 3, 'Bac+5', 'Comptabilité', ['Analyse de données', 'Comptabilité', 'Négociation'], 5],
  ['Architecte d’Intérieur (Junior)', 16, 'Douala', 'Cameroun', 'CDD', 4500000, 6500000, 1, 'Bac+3', 'BTP', ['AutoCAD', 'Design graphique', 'Communication'], 10],
  ['Électricien Bâtiment', 16, 'Douala', 'Cameroun', 'Temps plein', 3200000, 4500000, 2, 'Bac', 'BTP', ['Électricité', 'Sécurité', 'Maintenance'], 12],
  ['Conseiller(ère) en Assurance', 12, 'Conakry', 'Guinée', 'Temps plein', 4500000, 7000000, 1, 'Bac+2', 'Commercial', ['Vente', 'Service client', 'Négociation'], 3],
  ['Product Manager Junior', 7, 'Conakry', 'Guinée', 'Temps plein', 8500000, 12000000, 2, 'Bac+3', 'Technologie & Numérique', ['Gestion de projet', 'Analyse de données', 'JavaScript'], 1],
  ['Chef de Cuisine', 4, 'Conakry', 'Guinée', 'Temps plein', 5000000, 7000000, 4, 'Bac', 'Hôtellerie', ['HACCP', 'Organisation', 'Gestion de projet'], 15],
  ['Assistant(e) RH — Paie', 2, 'Conakry', 'Guinée', 'Temps plein', 5000000, 6500000, 2, 'Bac+2', 'Ressources humaines', ['Ressources humaines', 'Excel', 'Comptabilité'], 4],
  ['Coordinateur(ice) Logistique ONG', 5, 'Conakry', 'Guinée', 'CDD', 6000000, 8000000, 3, 'Bac+3', 'ONG', ['Logistique', 'Gestion de projet', 'Excel'], 6],
  ['Vendeur(se) Polyvalent(e)', 11, 'Kindia', 'Guinée', 'Temps partiel', 2300000, 3000000, 0, 'Bac', 'Commercial', ['Vente', 'Service client', 'Communication'], 2],
];

const ADVICE = [
  {
    title: 'Rédiger un CV qui décroche un entretien en Guinée',
    category: 'CV',
    excerpt: 'Structure, rubriques, longueur : les règles d’or pour que votre CV sorte du lot face aux recruteurs de Conakry.',
    minutes: 5,
    color: '#2E6BFF',
    content: `Un recruteur passe en moyenne 8 secondes sur un premier CV. Voici la méthode CarrièreOS :

1. **Une page, pas plus** (sauf profils seniors). Allez à l’essentiel : postes récents, résultats chiffrés, compétences clés.
2. **Un titre professionnel clair** en haut : “Assistant Administratif — 3 ans d’expérience” plutôt qu’un simple nom.
3. **Des rubriques standard** : Informations, Expérience, Formation, Compétences, Langues.
4. **Chaque expérience en 2-3 lignes action → résultat** : “Géré 40 dossiers clients/jour, réduit les erreurs de facturation de 25 %”.
5. **Des compétences concrètes et lisibles** : Excel, Sage, React, logistique… celles que les offres demandent.
6. **Zéro faute d’orthographe**. Faites relire par un proche.

Dans CarrièreOS, votre profil sert de CV : remplissez-le une fois, postulez en un clic sur toutes les offres à 90 % de matching.`,
  },
  {
    title: 'Préparer son entretien d’embauche : les 10 questions incontournables',
    category: 'Entretien',
    excerpt: 'Présentez-vous, vos points forts, votre salaire… Anticipez les questions que 90 % des recruteurs posent.',
    minutes: 6,
    color: '#7C3AED',
    content: `Voici les questions à préparer impérativement, avec la méthode STAR (Situation, Tâche, Action, Résultat) :

1. “Présentez-vous.” — 60 secondes : qui vous êtes, ce que vous savez faire, ce que vous cherchez.
2. “Pourquoi ce poste / cette entreprise ?” — montrez que vous connaissez l’entreprise.
3. “Quelles sont vos forces / faiblesses ?” — une force prouvée, une faiblesses en cours de progrès.
4. “Décrivez un problème que vous avez résolu.” — STAR + résultat chiffré.
5. “Où vous voyez-vous dans 3 ans ?” — alignez avec le poste.
6. “Pourquoi devrions-vous vous recruter ?” — 3 arguments mémorables.
7. “Êtes-vous mobile(?) / disponible quand ?” — soyez précis.
8. “Quelles questions avez-vous ?” — préparez-en 3 (mission, équipe, objectifs 6 mois).
9. “Prétentions salariales ?” — fourchette réaliste basée sur le marché local.
10. “Quand pouvez-vous commencer ?” — réponse nette.

Entraînez-vous à voix haute. Un entretien bien préparé, c’est 80 % de la réussite.`,
  },
  {
    title: 'Recevoir les alertes SMS emploi chaque matin à 7h00',
    category: 'Alertes SMS',
    excerpt: 'Comment configurer vos alertes CarrièreOS pour ne manquer aucune offre correspondant à votre profil.',
    minutes: 3,
    color: '#00A868',
    content: `Sur mobile, consulter ses alertes le matin change tout : vous postulez avant la foule.

**Dans CarrièreOS → Mes alertes :**
- Activez l’alerte et indiquez votre numéro guinéen (+224…).
- Choisissez l’heure : par défaut **07:00**, avant que le trafic de Conakry ne commence.
- Définissez vos critères : villes (Conakry, Kankan…), types de contrat, mots-clés (comptabilité, dev, logistique…).

**Chaque matin, vous recevez un SMS du type :**
“CarrièreOS: Bonjour Mamadou, 3 nouvelles offres correspondent à votre profil. Postulez → carriereOS.com/jobs”

Les offres les plus pertinentes remontent avec un taux de matching affiché : plus vous enrichissez votre profil, plus les alertes sont précises.`,
  },
  {
    title: 'Négocier son salaire : comprendre le marché guinéen',
    category: 'Carrière',
    excerpt: 'Fourchettes par métier, moment idéal pour en parler, arguments qui font basculer la décision.',
    minutes: 5,
    color: '#EA580C',
    content: `Négocier, ce n’est pas “demander plus”, c’est **prouver votre valeur**.

**Quand ?** Uniquement après l’offre écrite, jamais au premier entretien.

**Comment ?**
1. Renseignez-vous : les offres CarrièreOS affichent des fourchettes réales (ex. Assistant administratif : 3,5 – 5 M GNF).
2. Chiffrez vos résultats : “J’ai réduit les délais de 20 %”, “J’ai géré 500 000 FCFA de budget”.
3. Proposez une fourchette (bas-milieu-haut) plutôt qu’un chiffre unique.
4. Regardez le package complet : transport, prime de responsabilité, formation, horaires.
5. restez courtois : “Je suis très motivé(e) par ce poste. Sur la base de mon expérience, j’aimerais discuter de la rémunération.”

Dans les PME et multinationales de Guinée, une négocie préparée fait gagner en moyenne 10 à 20 % de salaire de départ.`,
  },
  {
    title: 'Sortir du chômage : la stratégie 30 jours pour trouver un emploi',
    category: 'Carrière',
    excerpt: 'Un plan d’action réaliste : 1 h par jour, ciblage, candidatures spontanées, réseau, suivi.',
    minutes: 7,
    color: '#DB2777',
    content: `**Semaine 1 — Fondations**
- Clarifiez votre cible : 2-3 types de postes, villes envisagées.
- Mettez à jour votre profil CarrièreOS à 100 % (CV, compétences, préférences).
- Activez les alertes SMS 7h00.

**Semaine 2 — Visibilité**
- Postulez aux 10 offres les mieux matchées (priorité à celles à > 80 %).
- 1 candidature spontanée par jour aux entreprises de votre secteur.
- Prévenez votre réseau : 1 message “je cherche X, vous connaissez ?” vaut 10 offres.

**Semaine 3 — Entretiens**
- Préparez les 10 questions incontournables, répétez à voix haute.
- Préparez 3 questions à poser à chaque recruteur.

**Semaine 4 — Ajustement**
- Analysez : peu d’entretiens ? → CV. Entretiens sans suite ? → préparation.
- Testez un nouveau canal : job board, salon de l’emploi, recommendation.

La régularité bat l’intensité : 1 heure par jour, tous les jours.`,
  },
  {
    title: 'Lettre de motivation courte qui fait la différence',
    category: 'CV',
    excerpt: 'La structure en 4 phrases qui donne envie au recruteur de vous appeler — même par SMS.',
    minutes: 4,
    color: '#0891B2',
    content: `Oubliez les 4 pages. Un recruteur guinéen lit 30 secondes maximum. Structurez en 4 mouvements :

**1. Accroche (1 phrase)** — le poste + votre atout numéro 1.
“Actuel assistant administratif avec 3 ans d’expérience en gestion de dossiers, je souhaite rejoindre votre équipe à Conakry.”

**2. Preuve (1-2 phrases)** — un résultat chiffré.
“J’ai orchestré le classement de plus de 2 000 dossiers/an et réduit les délais de traitement de 30 %.”

**3. Adéquation (1 phrase)** — vous avez compris leur besoin.
“Vos offres mentionnent l’organisation et le sens du service : c’est exactement mon terrain.”

**4. Conclusion (1 phrase)** — disponibilité + enthousiasme.
“Disponible immédiatement, je serais ravi(e) d’échanger avec vous.”

Dans CarrièreOS, la lettre se joint en un clic à votre candidature depuis la page de l’offre.`,
  },
];

export function seed({ force = false } = {}) {
  initSchema();

  // Complète les colonnes « fondée en / taille » sur une base déjà peuplée
  const backfill = db.prepare(
    'UPDATE companies SET founded_year = ?, staff_size = ? WHERE name = ? AND founded_year IS NULL'
  );
  for (const c of COMPANIES) backfill.run(c[5], c[6], c[0]);

  const jobCount = db.prepare('SELECT COUNT(*) AS n FROM jobs').get().n;
  if (jobCount > 0 && !force) return { skipped: true, jobs: jobCount };

  if (force) {
    for (const t of ['applications', 'sms_messages', 'alert_settings', 'jobs', 'companies', 'advice', 'users']) {
      db.exec(`DELETE FROM ${t};`);
    }
  }

  const insCompany = db.prepare(
    'INSERT INTO companies (name, sector, city, description, color, founded_year, staff_size) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const companyIds = [];
  for (const c of COMPANIES) companyIds.push(Number(insCompany.run(...c).lastInsertRowid));

  const insJob = db.prepare(`
    INSERT INTO jobs (company_id, title, city, country, contract, salary_min, salary_max,
                      experience_min, education_min, domain, description, requirements, skills, posted_at, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  let jobs = 0;
  const usedTitles = new Set();
  for (const row of JOBS) {
    if (!Array.isArray(row)) continue; // garde-fou ligne mal formée
    const [title, ci, city, country, contract, smin, smax, exp, edu, domain, skills, daysAgo] = row;
    const key = `${title}@${city}`;
    if (usedTitles.has(key)) continue;
    usedTitles.add(key);
    const tpl = DOMAIN_DESC[domain] || DOMAIN_DESC.Administration;
    const description = `${tpl.desc}\n\nPoste basé à ${city}, ${country} — contrat ${contract}.`;
    const requirements = `${tpl.req}\n• Expérience minimale : ${exp} an${exp > 1 ? 's' : ''}\n• Niveau d’études : ${edu || 'Non précisé'}`;
    insJob.run(companyIds[ci], title, city, country, contract, smin, smax, exp, edu, domain,
      description, requirements, JSON.stringify(skills), D(daysAgo));
    jobs++;
  }

  const insAdvice = db.prepare(
    'INSERT INTO advice (title, category, excerpt, content, minutes, color) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const a of ADVICE) insAdvice.run(a.title, a.category, a.excerpt, a.content, a.minutes, a.color);

  // ---- Utilisateur démo : Mamadou Diallo ----
  const email = 'mamadou@carriereos.com';
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  let uid;
  if (exists) {
    uid = exists.id;
  } else {
    uid = Number(db.prepare(`
      INSERT INTO users (email, password_hash, full_name, phone, city, title, bio, education, experience_years, skills, job_types, preferred_cities, cv)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      email,
      hashPassword('demo1234'),
      'Mamadou Diallo',
      '+224 622 000 111',
      'Conakry',
      'Assistant Administratif',
      'Assistant administratif avec 4 ans d’expérience en gestion de dossiers, accueil clients et coordination logistique à Conakry. Organisé, rigoureux, à l’aise avec les outils bureautiques.',
      'Bac+2',
      4,
      JSON.stringify(['Excel', 'Organisation', 'Communication', 'PowerPoint', 'Logistique', 'Français', 'Service client']),
      JSON.stringify(['Temps plein', 'CDD']),
      JSON.stringify(['Conakry']),
      JSON.stringify({
        summary: 'Assistant administratif organisé et fiable, 4 ans d’expérience en gestion de dossiers et coordination au sein de PME de Conakry. Habitué aux contacts clients et au travail en équipe exigeant.',
        experiences: [
          { role: 'Assistant Administratif', org: 'Ghapia Logistics', period: '2022 – 2025', detail: 'Gestion de 40 dossiers clients/jour, suivi des expéditions et rédaction des rapports hebdomadaires.' },
          { role: 'Secrétaire d’entreprise (stage)', org: 'Résidence Belmont', period: '2021 – 2022', detail: 'Accueil, standard téléphonique, organisation du planning des équipes.' },
        ],
        education: [
          { level: 'Bac+2 — Gestion des entreprises', org: 'Institut Supérieur de Gestion, Conakry', period: '2019 – 2021' },
          { level: 'Baccalauréat série G1', org: 'Lycée de la Corniche, Conakry', period: '2018' },
        ],
      })
    ).lastInsertRowid);
  }

  // alertes SMS démo
  db.prepare(`
    INSERT OR REPLACE INTO alert_settings (user_id, enabled, phone, send_time, keywords, cities, contracts, updated_at)
    VALUES (?, 1, ?, '07:00', ?, ?, ?, datetime('now'))
  `).run(uid, '+224 622 000 111', JSON.stringify(['assistant', 'administratif', 'logistique']), JSON.stringify(['Conakry']), JSON.stringify(['Temps plein', 'CDD']));

  // candidatures démo
  const demoJobs = db.prepare('SELECT id FROM jobs ORDER BY RANDOM() LIMIT 4').all();
  const statuses = ['En attente', 'En cours', 'Acceptée', 'Refusée'];
  demoJobs.forEach((j, i) => {
    db.prepare('INSERT OR IGNORE INTO applications (user_id, job_id, cover_letter, status, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(uid, j.id, 'Madame, Monsieur,\n\nVivement motivé(e) par ce poste, je vous prie de trouver ma candidature ci-jointe.\n\nCordialement,', statuses[i % statuses.length], D(i + 1));
  });

  // SMS de démonstration
  const insSms = db.prepare('INSERT INTO sms_messages (user_id, body, sent_at, is_read) VALUES (?, ?, ?, ?)');
  insSms.run(uid, 'CarrièreOS: Bonjour Mamadou, 3 nouvelles offres correspondent à votre profil (Conakry, Temps plein). Postulez → carriereOS.com/jobs', D(1), 0);
  insSms.run(uid, 'CarrièreOS: Alerte 7h00 — Assistant Administratif à Conakry, match 91%. Postulez → carriereOS.com/jobs', D(2), 1);
  insSms.run(uid, 'CarrièreOS: 2 nouvelles offres logistique à Conakry correspondent à vos critères. Voir → carriereOS.com/jobs', D(3), 1);

  return { skipped: false, jobs };
}

// Exécution directe : npm run seed
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  const r = seed({ force: true });
  console.log('Base initialisée :', r);
}
