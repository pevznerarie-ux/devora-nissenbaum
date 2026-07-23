-- PedagoOS — migration 0009 : supports pédagogiques par blocs (ADR-0005, ADR-0009).
-- Un support = liste ordonnée de blocs typés (jsonb conforme au schéma Zod
-- MaterialContent). État de travail sur `materials.blocks` ; historique
-- append-only par snapshot dans `material_versions` (compare / restore).

-- Nouvel état d'assistant : aperçu interactif validé avant génération (ADR-0010).
-- Ajouté avant 'materials_generated' ; non utilisé dans cette migration.
alter type sequence_status add value if not exists 'preview_ready' before 'materials_generated';

create type material_kind as enum (
  'teacher_guide', 'student_handout', 'presentation', 'exercise_set', 'assessment'
);

-- --------------------------------------------------------------- supports
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  sequence_id uuid not null references public.lesson_sequences(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  kind material_kind not null,
  title text not null,
  -- État de travail éditable (autosave) : blocs conformes à MaterialContent.blocks.
  blocks jsonb not null default '[]',
  status object_status not null default 'draft',
  -- Numéro du dernier snapshot publié dans material_versions (0 = aucun).
  current_version int not null default 0,
  -- Verrou de régénération (ADR-0011) : un support verrouillé n'est pas régénéré.
  locked boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index materials_org_idx on public.materials (organization_id);
create index materials_sequence_idx on public.materials (sequence_id);
create index materials_lesson_idx on public.materials (lesson_id);

-- Historique append-only : un snapshot par version (aucune politique update/delete).
create table public.material_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  material_id uuid not null references public.materials(id) on delete cascade,
  sequence_id uuid not null references public.lesson_sequences(id) on delete cascade,
  version_number int not null,
  title text not null,
  kind material_kind not null,
  blocks jsonb not null,
  status object_status not null default 'draft',
  label text,
  created_by uuid references public.profiles(id),
  ai_generation_id uuid references public.ai_generations(id),
  created_at timestamptz not null default now(),
  unique (material_id, version_number)
);
create index material_versions_material_idx on public.material_versions (material_id);
create index material_versions_sequence_idx on public.material_versions (sequence_id);

create trigger materials_set_updated_at before update on public.materials
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------- RLS
alter table public.materials         enable row level security;
alter table public.material_versions enable row level security;

-- Supports : lecture/écriture par les intervenants de la séquence (via la classe).
create policy materials_select on public.materials
  for select using (can_access_sequence(sequence_id));
create policy materials_insert on public.materials
  for insert with check (
    can_access_sequence(sequence_id) and created_by = auth.uid()
  );
create policy materials_update on public.materials
  for update using (can_access_sequence(sequence_id))
  with check (can_access_sequence(sequence_id));
create policy materials_delete on public.materials
  for delete using (can_access_sequence(sequence_id));

-- Historique : lecture via la séquence ; insertion bornée ; append-only.
create policy material_versions_select on public.material_versions
  for select using (can_access_sequence(sequence_id));
create policy material_versions_insert on public.material_versions
  for insert with check (can_access_sequence(sequence_id));
