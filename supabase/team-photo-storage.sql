-- Stockage public dédié UNIQUEMENT aux portraits de Job by blaise.
-- Les photos sont publiques par URL ; les profils ne sont publiés qu’après enregistrement explicite.
-- Aucun accès direct d’écriture au navigateur : l’API admin utilise la clé de service côté serveur.
-- Ne modifie aucun autre bucket et ne crée aucune politique globale storage.objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('job-by-blaise-team', 'job-by-blaise-team', true, 3145728, array['image/webp'])
on conflict (id) do nothing;
