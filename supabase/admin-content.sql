-- Mise à jour additive uniquement. Ne modifie aucune table existante.
create table if not exists jobbyblaise.site_content (
  id integer primary key,
  data text not null default '{}',
  updated_at timestamptz not null default now()
);
alter table jobbyblaise.site_content enable row level security;
