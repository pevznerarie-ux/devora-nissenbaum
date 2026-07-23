-- PedagoOS — migration 0006 : modèle pédagogique et séquences (PRD §3.D, §5).
-- Séquences avec état d'assistant + structure (jsonb conforme au schéma Zod
-- LessonSequence), objectifs/séances normalisés (traçabilité — continuité
-- pédagogique), compétences, et journal des générations IA (ai_generations).

create type sequence_status as enum (
  'draft', 'structure_proposed', 'structure_validated',
  'materials_generated', 'published', 'archived'
);
create type sequence_difficulty as enum ('easier', 'standard', 'harder');
create type bloom_level as enum (
  'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'
);
create type ai_generation_status as enum (
  'pending', 'succeeded', 'schema_failed', 'provider_failed'
);

-- --------------------------------------------------------- compétences
create table public.competencies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  subject_id uuid references public.subjects(id),
  code text,
  label text not null,
  description text,
  parent_id uuid references public.competencies(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index competencies_org_idx on public.competencies (organization_id);

create table public.curriculum_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  subject_id uuid references public.subjects(id),
  grade_level text,
  title text not null,
  description text,
  source_document_id uuid references public.source_documents(id),
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index curriculum_units_org_idx on public.curriculum_units (organization_id);

-- ---------------------------------------------------------- séquences
create table public.lesson_sequences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  class_id uuid not null references public.classes(id),
  subject_id uuid references public.subjects(id),
  title text not null,
  theme text not null,
  created_by uuid not null references public.profiles(id),
  language text not null default 'fr',
  session_count int not null default 1,
  session_duration_minutes int not null default 55,
  difficulty sequence_difficulty not null default 'standard',
  status sequence_status not null default 'draft',
  wizard_state jsonb not null default '{}',
  structure jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index lesson_sequences_org_idx on public.lesson_sequences (organization_id);
create index lesson_sequences_class_idx on public.lesson_sequences (class_id);

create table public.learning_objectives (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  sequence_id uuid references public.lesson_sequences(id) on delete cascade,
  curriculum_unit_id uuid references public.curriculum_units(id),
  title text not null,
  description text,
  bloom_level bloom_level not null default 'understand',
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index learning_objectives_org_idx on public.learning_objectives (organization_id);
create index learning_objectives_sequence_idx on public.learning_objectives (sequence_id);

create table public.objective_competencies (
  objective_id uuid not null references public.learning_objectives(id) on delete cascade,
  competency_id uuid not null references public.competencies(id) on delete cascade,
  primary key (objective_id, competency_id)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.lesson_sequences(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  order_index int not null,
  title text not null,
  summary text,
  duration_minutes int not null default 55,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sequence_id, order_index)
);
create index lessons_sequence_idx on public.lessons (sequence_id);

create table public.lesson_objectives (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  objective_id uuid not null references public.learning_objectives(id) on delete cascade,
  primary key (lesson_id, objective_id)
);

-- ------------------------------------------------------- ai_generations
-- Journal de traçabilité IA (ADR-0004). raw_output stocké en jsonb au MVP
-- (mock, sorties petites) ; les gros bruts des providers réels iront dans le
-- bucket privé ai-raw (Phase 7).
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  requested_by uuid references public.profiles(id),
  provider text not null,
  model text not null,
  prompt_name text not null,
  prompt_version text not null,
  parameters jsonb not null default '{}',
  target_type text not null,
  target_id uuid,
  source_document_ids uuid[] not null default '{}',
  raw_output jsonb,
  validated_output jsonb,
  status ai_generation_status not null default 'pending',
  error text,
  duration_ms int,
  cost_estimate numeric,
  created_at timestamptz not null default now()
);
create index ai_generations_org_idx on public.ai_generations (organization_id);
create index ai_generations_target_idx on public.ai_generations (target_type, target_id);

-- ------------------------------------------------- triggers updated_at
do $$
declare t text;
begin
  foreach t in array array[
    'competencies','curriculum_units','lesson_sequences',
    'learning_objectives','lessons'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- --------------------------------------------------------------- RLS
alter table public.competencies         enable row level security;
alter table public.curriculum_units     enable row level security;
alter table public.lesson_sequences     enable row level security;
alter table public.learning_objectives  enable row level security;
alter table public.objective_competencies enable row level security;
alter table public.lessons              enable row level security;
alter table public.lesson_objectives    enable row level security;
alter table public.ai_generations       enable row level security;

-- Accès à une séquence = accès à sa classe (professeur, direction, org_admin).
create or replace function public.can_access_sequence(seq_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from lesson_sequences s
    where s.id = seq_id and can_access_class(s.class_id)
  );
$$;

-- Compétences et unités de programme : éducateurs de l'organisation.
create policy competencies_select on public.competencies
  for select using (is_educator(organization_id));
create policy competencies_write on public.competencies
  for all using (has_role(organization_id, 'org_admin'))
  with check (has_role(organization_id, 'org_admin'));

create policy curriculum_units_select on public.curriculum_units
  for select using (is_educator(organization_id));
create policy curriculum_units_write on public.curriculum_units
  for all using (has_role(organization_id, 'org_admin'))
  with check (has_role(organization_id, 'org_admin'));

-- Séquences : lecture/écriture par les intervenants de la classe.
create policy lesson_sequences_select on public.lesson_sequences
  for select using (can_access_class(class_id));
create policy lesson_sequences_insert on public.lesson_sequences
  for insert with check (can_access_class(class_id) and created_by = auth.uid());
create policy lesson_sequences_update on public.lesson_sequences
  for update using (can_access_class(class_id))
  with check (can_access_class(class_id));
create policy lesson_sequences_delete on public.lesson_sequences
  for delete using (
    exists (
      select 1 from classes c
      where c.id = class_id
        and (has_role(c.organization_id, 'org_admin') or manages_school(c.school_id))
    )
  );

-- Objectifs et séances normalisés : lecture via la séquence. L'écriture passe
-- par la fonction security definer de validation (bypass RLS) ; pas de
-- politique write pour les utilisateurs.
create policy learning_objectives_select on public.learning_objectives
  for select using (
    (sequence_id is not null and can_access_sequence(sequence_id))
    or (sequence_id is null and is_educator(organization_id))
  );

create policy lessons_select on public.lessons
  for select using (can_access_sequence(sequence_id));

create policy lesson_objectives_select on public.lesson_objectives
  for select using (
    exists (
      select 1 from lessons l
      where l.id = lesson_id and can_access_sequence(l.sequence_id)
    )
  );

create policy objective_competencies_select on public.objective_competencies
  for select using (
    exists (
      select 1 from learning_objectives o
      where o.id = objective_id
        and (
          (o.sequence_id is not null and can_access_sequence(o.sequence_id))
          or (o.sequence_id is null and is_educator(o.organization_id))
        )
    )
  );

-- ai_generations : lecture par l'auteur ou l'org_admin ; insertion serveur.
create policy ai_generations_select on public.ai_generations
  for select using (
    requested_by = auth.uid() or has_role(organization_id, 'org_admin')
  );

-- ------------------------------------- validation d'une structure de séquence
-- Persiste la structure jsonb validée en objectifs/séances normalisés
-- (traçabilité) et passe la séquence en 'structure_validated', de façon
-- atomique. security definer : contrôle d'accès explicite, écritures dans les
-- tables sans politique write.
create or replace function public.validate_sequence_structure(
  p_sequence_id uuid,
  p_structure jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq lesson_sequences%rowtype;
  v_obj jsonb;
  v_lesson jsonb;
  v_index int;
  v_objective_id uuid;
  v_lesson_id uuid;
  v_obj_uuid uuid;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;
  select * into v_seq from lesson_sequences where id = p_sequence_id;
  if not found then
    raise exception 'sequence_not_found';
  end if;
  if not can_access_class(v_seq.class_id) then
    raise exception 'forbidden';
  end if;

  -- Remplace toute normalisation précédente de cette séquence.
  delete from learning_objectives where sequence_id = p_sequence_id;
  delete from lessons where sequence_id = p_sequence_id;

  -- Objectifs : conserve l'id fourni par la structure (référencé par les séances).
  v_index := 0;
  for v_obj in select * from jsonb_array_elements(p_structure->'objectives') loop
    insert into learning_objectives (
      id, organization_id, sequence_id, title, description, bloom_level, order_index
    )
    values (
      (v_obj->>'id')::uuid,
      v_seq.organization_id,
      p_sequence_id,
      v_obj->>'title',
      nullif(v_obj->>'description', ''),
      coalesce((v_obj->>'bloomLevel')::bloom_level, 'understand'),
      v_index
    );
    v_index := v_index + 1;
  end loop;

  -- Séances + rattachement aux objectifs déclarés.
  for v_lesson in select * from jsonb_array_elements(p_structure->'lessons') loop
    insert into lessons (
      id, sequence_id, organization_id, order_index, title, summary, duration_minutes
    )
    values (
      (v_lesson->>'id')::uuid,
      p_sequence_id,
      v_seq.organization_id,
      (v_lesson->>'orderIndex')::int,
      v_lesson->>'title',
      nullif(v_lesson->>'summary', ''),
      coalesce((v_lesson->>'durationMinutes')::int, v_seq.session_duration_minutes)
    )
    returning id into v_lesson_id;

    for v_obj_uuid in
      select (value #>> '{}')::uuid from jsonb_array_elements(v_lesson->'objectiveIds')
    loop
      insert into lesson_objectives (lesson_id, objective_id)
      values (v_lesson_id, v_obj_uuid)
      on conflict do nothing;
    end loop;
  end loop;

  update lesson_sequences
     set structure = p_structure,
         status = 'structure_validated',
         updated_at = now()
   where id = p_sequence_id;

  insert into audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  values (
    v_seq.organization_id, auth.uid(), 'sequence.validate_structure',
    'lesson_sequence', p_sequence_id,
    jsonb_build_object('objectives', jsonb_array_length(p_structure->'objectives'),
                       'lessons', jsonb_array_length(p_structure->'lessons'))
  );
end $$;

revoke all on function public.validate_sequence_structure(uuid, jsonb) from public;
grant execute on function public.validate_sequence_structure(uuid, jsonb) to authenticated;
