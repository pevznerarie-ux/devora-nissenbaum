-- PedagoOS — migration 0008 : régénération intelligente et historique (ADR-0011).
-- Objets pédagogiques versionnés (version/status/locked), graphe de dépendances
-- explicite, et historique append-only par objet (compare/restore/merge).

create type object_status as enum (
  'proposed', 'draft', 'validated', 'published', 'archived'
);

-- Champs de régénération sur les objets pédagogiques existants.
alter table public.lessons
  add column obj_version int not null default 1,
  add column obj_status object_status not null default 'draft',
  add column locked boolean not null default false;

alter table public.learning_objectives
  add column obj_version int not null default 1,
  add column obj_status object_status not null default 'draft',
  add column locked boolean not null default false;

-- Graphe de dépendances : « modifier source impose de recalculer dependent ».
create table public.pedagogical_dependencies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  sequence_id uuid not null references public.lesson_sequences(id) on delete cascade,
  source_object_type text not null,
  source_object_id uuid not null,
  dependent_object_type text not null,
  dependent_object_id uuid not null,
  created_at timestamptz not null default now(),
  unique (source_object_id, dependent_object_id)
);
create index pedagogical_dependencies_source_idx
  on public.pedagogical_dependencies (source_object_type, source_object_id);
create index pedagogical_dependencies_sequence_idx
  on public.pedagogical_dependencies (sequence_id);

-- Historique par objet (append-only : aucune politique update/delete).
create table public.object_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  sequence_id uuid references public.lesson_sequences(id) on delete cascade,
  object_type text not null,
  object_id uuid not null,
  version_number int not null,
  snapshot jsonb not null,
  created_by uuid references public.profiles(id),
  ai_generation_id uuid references public.ai_generations(id),
  created_at timestamptz not null default now(),
  unique (object_type, object_id, version_number)
);
create index object_versions_object_idx
  on public.object_versions (object_type, object_id);
create index object_versions_sequence_idx on public.object_versions (sequence_id);

-- --------------------------------------------------------------- RLS
alter table public.pedagogical_dependencies enable row level security;
alter table public.object_versions          enable row level security;

-- Lecture liée à l'accès à la séquence ; écriture serveur (régénération).
create policy pedagogical_dependencies_select on public.pedagogical_dependencies
  for select using (can_access_sequence(sequence_id));

create policy object_versions_select on public.object_versions
  for select using (
    sequence_id is null or can_access_sequence(sequence_id)
  );
