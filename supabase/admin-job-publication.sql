-- À appliquer AVANT le déploiement du contrôle de publication.
-- Additif et idempotent ; aucune offre/candidature supprimée ou approuvée en masse.
-- Les anciennes lignes (dont les démonstrations) restent visibles dans le back-office,
-- mais ne seront publiques qu’après validation explicite par un administrateur.
alter table jobbyblaise.jobs
  add column if not exists published_by_admin integer not null default 0
  check (published_by_admin in (0, 1));
alter table jobbyblaise.jobs alter column is_active set default 0;
