-- PedagoOS — schéma complet (migrations 0001 → 0010 concaténées).
-- Généré pour un déploiement en un seul collage dans le SQL Editor de Supabase.
-- Équivalent à `supabase db push` (chemin recommandé, prouvé en CI).
-- Exécuter sur un projet VIERGE. Ordre garanti.

-- ============================================================
-- 0001_initial_schema.sql
-- ============================================================
-- PedagoOS — migration 0001 : identité, organisations, structure scolaire.
-- Référence : docs/data-model.md §1-2 + audit_logs (§7).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums
create type member_role as enum (
  'platform_admin', 'org_admin', 'school_director', 'pedagogical_lead',
  'teacher', 'grader', 'student', 'parent'
);

create type membership_status as enum ('invited', 'active', 'suspended');

create type class_teacher_role as enum ('main_teacher', 'co_teacher');

-- ------------------------------------------------------ trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------- tables
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  default_locale text not null default 'fr',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  address jsonb,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index schools_organization_idx on public.schools (organization_id);

-- 1-1 avec auth.users ; minimisation stricte (privacy §1).
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  preferred_locale text not null default 'fr',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  role member_role not null,
  status membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, organization_id, role)
);
create index memberships_org_idx on public.memberships (organization_id);
create index memberships_profile_idx on public.memberships (profile_id);

create table public.school_memberships (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (membership_id, school_id)
);
create index school_memberships_school_idx on public.school_memberships (school_id);

-- Invitations gérées côté serveur uniquement (token stocké haché).
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  school_id uuid references public.schools(id),
  email text not null,
  role member_role not null,
  token_hash text not null unique,
  invited_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitations_role_invitable check (
    role in ('org_admin', 'school_director', 'pedagogical_lead', 'teacher', 'grader')
  )
);
create index invitations_org_idx on public.invitations (organization_id);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  label text not null,
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, label),
  constraint academic_years_dates check (starts_on < ends_on)
);
create index academic_years_org_idx on public.academic_years (organization_id);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  code text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);
create index subjects_org_idx on public.subjects (organization_id);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  school_id uuid not null references public.schools(id),
  academic_year_id uuid not null references public.academic_years(id),
  name text not null,
  grade_level text not null,
  subject_id uuid references public.subjects(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index classes_org_idx on public.classes (organization_id);
create index classes_school_idx on public.classes (school_id);

create table public.class_teachers (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role class_teacher_role not null default 'main_teacher',
  created_at timestamptz not null default now(),
  unique (class_id, profile_id)
);
create index class_teachers_profile_idx on public.class_teachers (profile_id);

-- Minimisation : prénom, nom, et optionnellement date de naissance /
-- identifiant école. RIEN d'autre (privacy §1). Compte utilisateur optionnel.
create table public.students (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  school_id uuid not null references public.schools(id),
  first_name text not null,
  last_name text not null,
  birth_date date,
  profile_id uuid references public.profiles(id),
  external_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index students_org_idx on public.students (organization_id);
create index students_school_idx on public.students (school_id);

create table public.class_students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  joined_on date not null default current_date,
  left_on date,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);
create index class_students_student_idx on public.class_students (student_id);

-- Journal métier append-only (CLAUDE.md §5.6) ; l'immutabilité est garantie
-- par l'absence de politique UPDATE/DELETE (migration 0002).
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at);

-- ------------------------------------------------- triggers updated_at
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','schools','profiles','memberships','invitations',
    'academic_years','subjects','classes','students'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ------------------------------------ création automatique du profil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, preferred_locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'preferred_locale', 'fr')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 0002_rls.sql
-- ============================================================
-- PedagoOS — migration 0002 : fonctions d'appui et politiques RLS.
-- Principes : docs/data-model.md §9. RLS activée sur TOUTES les tables ;
-- aucune politique implicite ; audit_logs append-only.

-- ------------------------------------------------------------ fonctions
-- security definer + stable : lisibles dans les politiques, évaluées une
-- fois par requête (initPlan), et non contournables par le client.

create or replace function public.is_member_of(org_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.profile_id = auth.uid()
      and m.organization_id = org_id
      and m.status = 'active'
  );
$$;

create or replace function public.has_role(org_id uuid, wanted member_role)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.profile_id = auth.uid()
      and m.organization_id = org_id
      and m.role = wanted
      and m.status = 'active'
  );
$$;

create or replace function public.is_school_member(target_school_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1
    from school_memberships sm
    join memberships m on m.id = sm.membership_id
    where sm.school_id = target_school_id
      and m.profile_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- Directeur ou responsable pédagogique rattaché à cet établissement.
create or replace function public.manages_school(target_school_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1
    from school_memberships sm
    join memberships m on m.id = sm.membership_id
    where sm.school_id = target_school_id
      and m.profile_id = auth.uid()
      and m.status = 'active'
      and m.role in ('school_director', 'pedagogical_lead')
  );
$$;

create or replace function public.teaches_class(target_class_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from class_teachers ct
    where ct.class_id = target_class_id
      and ct.profile_id = auth.uid()
  );
$$;

-- Accès complet à une classe : professeur de la classe, direction de son
-- établissement, ou org_admin de son organisation.
create or replace function public.can_access_class(target_class_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from classes c
    where c.id = target_class_id
      and (
        teaches_class(c.id)
        or manages_school(c.school_id)
        or has_role(c.organization_id, 'org_admin')
      )
  );
$$;

-- ------------------------------------------------------------ activation
alter table public.organizations      enable row level security;
alter table public.schools            enable row level security;
alter table public.profiles           enable row level security;
alter table public.memberships        enable row level security;
alter table public.school_memberships enable row level security;
alter table public.invitations        enable row level security;
alter table public.academic_years     enable row level security;
alter table public.subjects           enable row level security;
alter table public.classes            enable row level security;
alter table public.class_teachers     enable row level security;
alter table public.students           enable row level security;
alter table public.class_students     enable row level security;
alter table public.audit_logs         enable row level security;

-- ---------------------------------------------------------- organizations
create policy organizations_select on public.organizations
  for select using (is_member_of(id));
create policy organizations_update on public.organizations
  for update using (has_role(id, 'org_admin'))
  with check (has_role(id, 'org_admin'));
-- INSERT/DELETE : service_role uniquement (provisioning plateforme).

-- ---------------------------------------------------------------- schools
create policy schools_select on public.schools
  for select using (
    has_role(organization_id, 'org_admin') or is_school_member(id)
  );
create policy schools_insert on public.schools
  for insert with check (has_role(organization_id, 'org_admin'));
create policy schools_update on public.schools
  for update using (
    has_role(organization_id, 'org_admin') or manages_school(id)
  )
  with check (
    has_role(organization_id, 'org_admin') or manages_school(id)
  );

-- --------------------------------------------------------------- profiles
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid());
-- Profils visibles entre membres d'une même organisation (annuaire interne).
create policy profiles_select_same_org on public.profiles
  for select using (
    exists (
      select 1 from memberships mine
      join memberships theirs on theirs.organization_id = mine.organization_id
      where mine.profile_id = auth.uid()
        and mine.status = 'active'
        and theirs.status = 'active'
        and theirs.profile_id = profiles.id
    )
  );
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ------------------------------------------------------------ memberships
create policy memberships_select on public.memberships
  for select using (
    profile_id = auth.uid() or has_role(organization_id, 'org_admin')
  );
create policy memberships_admin_write on public.memberships
  for update using (has_role(organization_id, 'org_admin'))
  with check (has_role(organization_id, 'org_admin'));
create policy memberships_admin_delete on public.memberships
  for delete using (has_role(organization_id, 'org_admin'));
-- INSERT : service_role uniquement (flux d'invitation côté serveur).

-- ----------------------------------------------------- school_memberships
create policy school_memberships_select on public.school_memberships
  for select using (
    exists (
      select 1 from memberships m
      where m.id = membership_id
        and (m.profile_id = auth.uid() or has_role(m.organization_id, 'org_admin'))
    )
    or manages_school(school_id)
  );
create policy school_memberships_admin_write on public.school_memberships
  for all using (
    exists (
      select 1 from memberships m
      where m.id = membership_id and has_role(m.organization_id, 'org_admin')
    )
  )
  with check (
    exists (
      select 1 from memberships m
      where m.id = membership_id and has_role(m.organization_id, 'org_admin')
    )
  );

-- ------------------------------------------------------------ invitations
-- Lecture : administration de l'organisation. Écriture : service_role
-- uniquement (le token haché ne transite jamais par le client).
create policy invitations_select on public.invitations
  for select using (has_role(organization_id, 'org_admin'));

-- --------------------------------------------------- academic_years
create policy academic_years_select on public.academic_years
  for select using (is_member_of(organization_id));
create policy academic_years_write on public.academic_years
  for all using (has_role(organization_id, 'org_admin'))
  with check (has_role(organization_id, 'org_admin'));

-- ----------------------------------------------------------------- subjects
create policy subjects_select on public.subjects
  for select using (is_member_of(organization_id));
create policy subjects_write on public.subjects
  for all using (has_role(organization_id, 'org_admin'))
  with check (has_role(organization_id, 'org_admin'));

-- ------------------------------------------------------------------ classes
create policy classes_select on public.classes
  for select using (can_access_class(id));
create policy classes_insert on public.classes
  for insert with check (
    has_role(organization_id, 'org_admin') or manages_school(school_id)
  );
create policy classes_update on public.classes
  for update using (can_access_class(id))
  with check (can_access_class(id));
create policy classes_delete on public.classes
  for delete using (
    has_role(organization_id, 'org_admin') or manages_school(school_id)
  );

-- ----------------------------------------------------------- class_teachers
create policy class_teachers_select on public.class_teachers
  for select using (can_access_class(class_id));
create policy class_teachers_write on public.class_teachers
  for all using (
    exists (
      select 1 from classes c
      where c.id = class_id
        and (has_role(c.organization_id, 'org_admin') or manages_school(c.school_id))
    )
  )
  with check (
    exists (
      select 1 from classes c
      where c.id = class_id
        and (has_role(c.organization_id, 'org_admin') or manages_school(c.school_id))
    )
  );

-- ----------------------------------------------------------------- students
create policy students_select on public.students
  for select using (
    has_role(organization_id, 'org_admin')
    or manages_school(school_id)
    or exists (
      select 1 from class_students cs
      where cs.student_id = students.id and teaches_class(cs.class_id)
    )
  );
create policy students_write on public.students
  for all using (
    has_role(organization_id, 'org_admin') or manages_school(school_id)
  )
  with check (
    has_role(organization_id, 'org_admin') or manages_school(school_id)
  );

-- ------------------------------------------------------------ class_students
create policy class_students_select on public.class_students
  for select using (can_access_class(class_id));
create policy class_students_write on public.class_students
  for all using (
    exists (
      select 1 from classes c
      where c.id = class_id
        and (
          teaches_class(c.id)
          or manages_school(c.school_id)
          or has_role(c.organization_id, 'org_admin')
        )
    )
  )
  with check (
    exists (
      select 1 from classes c
      where c.id = class_id
        and (
          teaches_class(c.id)
          or manages_school(c.school_id)
          or has_role(c.organization_id, 'org_admin')
        )
    )
  );

-- --------------------------------------------------------------- audit_logs
-- Append-only : lecture org_admin ; insertion serveur (service_role) ;
-- AUCUNE politique update/delete → impossibles pour tout rôle non-service.
create policy audit_logs_select on public.audit_logs
  for select using (has_role(organization_id, 'org_admin'));

-- ------------------------------------------------------------------ grants
-- Privilèges de table explicites (la RLS filtre ensuite). Sans GRANT, même
-- service_role reçoit « permission denied » ; on ne dépend pas des privilèges
-- par défaut de l'environnement.
grant usage on schema public to anon, authenticated, service_role;
grant all privileges on all tables in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
alter default privileges in schema public
  grant all privileges on tables to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;

-- ============================================================
-- 0003_add_students_function.sql
-- ============================================================
-- PedagoOS — migration 0003 : ajout d'élèves à une classe.
--
-- Un professeur peut ajouter des élèves à SA classe (PRD §3.B), mais la
-- politique students_write est réservée à l'administration/direction et le
-- RETURNING d'un insert exigerait un droit SELECT immédiat. Cette fonction
-- security definer est donc l'unique chemin d'écriture professeur :
-- contrôle d'accès explicite (can_access_class), insertion élève +
-- rattachement classe atomiques, rapport ligne à ligne pour l'import CSV.

create or replace function public.add_students_to_class(
  p_class_id uuid,
  p_students jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class classes%rowtype;
  v_item jsonb;
  v_first text;
  v_last text;
  v_birth date;
  v_created int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_index int := 0;
  v_student_id uuid;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  select * into v_class from classes where id = p_class_id;
  if not found then
    raise exception 'class_not_found';
  end if;
  if v_class.archived_at is not null then
    raise exception 'class_archived';
  end if;
  if not can_access_class(p_class_id) then
    raise exception 'forbidden';
  end if;
  if p_students is null or jsonb_typeof(p_students) <> 'array' then
    raise exception 'invalid_payload';
  end if;
  if jsonb_array_length(p_students) > 500 then
    raise exception 'too_many_rows';
  end if;

  for v_item in select * from jsonb_array_elements(p_students) loop
    v_index := v_index + 1;
    v_first := nullif(btrim(coalesce(v_item->>'firstName', '')), '');
    v_last := nullif(btrim(coalesce(v_item->>'lastName', '')), '');

    if v_first is null or v_last is null then
      v_errors := v_errors
        || jsonb_build_object('index', v_index, 'code', 'missing_name');
      continue;
    end if;

    begin
      v_birth := nullif(v_item->>'birthDate', '')::date;
    exception when others then
      v_errors := v_errors
        || jsonb_build_object('index', v_index, 'code', 'invalid_date');
      continue;
    end;

    insert into students (organization_id, school_id, first_name, last_name, birth_date)
    values (v_class.organization_id, v_class.school_id, v_first, v_last, v_birth)
    returning id into v_student_id;

    insert into class_students (class_id, student_id)
    values (p_class_id, v_student_id);

    v_created := v_created + 1;
  end loop;

  insert into audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  values (
    v_class.organization_id,
    auth.uid(),
    'students.add_to_class',
    'class',
    p_class_id,
    jsonb_build_object('created', v_created, 'errorCount', jsonb_array_length(v_errors))
  );

  return jsonb_build_object('created', v_created, 'errors', v_errors);
end $$;

revoke all on function public.add_students_to_class(uuid, jsonb) from public;
grant execute on function public.add_students_to_class(uuid, jsonb) to authenticated;

-- ============================================================
-- 0004_academic_year_hebrew_label.sql
-- ============================================================
-- PedagoOS — migration 0004 : double calendrier des années scolaires.
-- Les dates restent stockées en calendrier civil (grégorien) ; chaque année
-- scolaire porte en plus un libellé hébreu traditionnel (ex. תשפ״ז), calculé
-- côté serveur (packages/shared/src/hebrew-calendar.ts) et modifiable.

alter table public.academic_years
  add column hebrew_label text;

-- ============================================================
-- 0005_source_library.sql
-- ============================================================
-- PedagoOS — migration 0005 : bibliothèque de sources (PRD §3.C).
-- Documents importés (PDF/DOCX/TXT/images), extraction de texte avec état,
-- recherche plein texte, chunks pour les futures citations précises.

create type processing_status as enum (
  'pending', 'processing', 'ready', 'awaiting_ocr', 'failed'
);

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  -- null = partagé avec toute l'organisation ; sinon restreint à l'école.
  school_id uuid references public.schools(id),
  uploaded_by uuid not null references public.profiles(id),
  title text not null,
  subject_id uuid references public.subjects(id),
  grade_level text,
  language text not null default 'fr',
  tags text[] not null default '{}',
  file_path text not null,
  mime_type text not null,
  file_size bigint not null,
  processing_status processing_status not null default 'pending',
  processing_error text,
  extracted_text text,
  -- 'simple' : multilingue (fr/en/he) sans stemming, suffisant au MVP.
  text_search tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(extracted_text, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index source_documents_org_idx on public.source_documents (organization_id);
create index source_documents_school_idx on public.source_documents (school_id);
create index source_documents_search_idx on public.source_documents using gin (text_search);

create trigger source_documents_set_updated_at
  before update on public.source_documents
  for each row execute function public.set_updated_at();

create table public.source_chunks (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references public.source_documents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  chunk_index int not null,
  content text not null,
  page_number int,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (source_document_id, chunk_index)
);
create index source_chunks_document_idx on public.source_chunks (source_document_id);

-- ------------------------------------------------------------------- RLS
alter table public.source_documents enable row level security;
alter table public.source_chunks    enable row level security;

-- Rôles habilités à la bibliothèque (pas les élèves ni les parents).
create or replace function public.is_educator(org_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.profile_id = auth.uid()
      and m.organization_id = org_id
      and m.status = 'active'
      and m.role in ('org_admin', 'school_director', 'pedagogical_lead', 'teacher')
  );
$$;

create policy source_documents_select on public.source_documents
  for select using (
    is_educator(organization_id)
    and (
      school_id is null
      or is_school_member(school_id)
      or has_role(organization_id, 'org_admin')
    )
  );
create policy source_documents_insert on public.source_documents
  for insert with check (
    is_educator(organization_id) and uploaded_by = auth.uid()
  );
create policy source_documents_update on public.source_documents
  for update using (
    uploaded_by = auth.uid() or has_role(organization_id, 'org_admin')
  )
  with check (
    uploaded_by = auth.uid() or has_role(organization_id, 'org_admin')
  );
create policy source_documents_delete on public.source_documents
  for delete using (
    uploaded_by = auth.uid() or has_role(organization_id, 'org_admin')
  );

-- Chunks : lecture pour les éducateurs de l'organisation ; écriture serveur
-- uniquement (aucune politique insert/update/delete).
create policy source_chunks_select on public.source_chunks
  for select using (is_educator(organization_id));

-- ----------------------------------------------------------------- bucket
-- Bucket privé : aucun accès direct client (aucune politique storage.objects),
-- tout passe par le serveur et des URL signées courtes.
insert into storage.buckets (id, name, public)
values ('sources', 'sources', false)
on conflict (id) do nothing;

-- ============================================================
-- 0006_pedagogy_and_sequences.sql
-- ============================================================
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

-- ============================================================
-- 0007_ai_monitoring.sql
-- ============================================================
-- PedagoOS — migration 0007 : monitoring IA (ADR-0014 §7).
-- Champs de pilotage ajoutés à ai_generations : capacité, moteur, tokens
-- détaillés, cache hit, temps de réponse, établissement. Permet le suivi des
-- coûts par école / capacité / niveau de modèle et des taux de cache/escalade.

alter table public.ai_generations
  add column capability text,
  add column engine text,
  add column token_input int,
  add column token_output int,
  add column token_cache_read int,
  add column token_cache_creation int,
  add column cache_hit boolean,
  add column response_time_ms int,
  add column school_id uuid references public.schools(id),
  add column tier text;

create index ai_generations_school_idx on public.ai_generations (school_id);
create index ai_generations_capability_idx on public.ai_generations (capability);

-- ============================================================
-- 0008_regeneration_versions.sql
-- ============================================================
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

-- ============================================================
-- 0009_materials.sql
-- ============================================================
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

-- ============================================================
-- 0010_media_library.sql
-- ============================================================
-- PedagoOS — migration 0010 : médiathèque visuelle (ADR-0016, Media Library).
-- Assets visuels + versions (append-only), licences, attributions, usages
-- (liaison bloc↔visuel) et variantes de mise en page. Buckets privés.
-- Toute table porte organization_id et une RLS explicite (CLAUDE §5.2).

create type visual_asset_type as enum (
  'photo', 'illustration', 'diagram', 'timeline', 'chart', 'map',
  'historical_document', 'uploaded_image'
);
create type visual_source_type as enum (
  'generated', 'stock', 'public_domain', 'licensed', 'teacher_upload', 'internal'
);
create type visual_quality_status as enum (
  'pending', 'approved', 'rejected', 'requires_review'
);
create type visual_moderation_status as enum ('pending', 'approved', 'rejected');
create type visual_consent_status as enum (
  'not_required', 'pending', 'granted', 'denied'
);
create type visual_layout_target as enum (
  'slide_16_9', 'student_a4', 'teacher_guide', 'thumbnail',
  'full_width', 'half_page', 'mobile'
);

-- ----------------------------------------------------------- visual_assets
create table public.visual_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  -- null = visible à toute l'organisation ; sinon restreint à l'école.
  school_id uuid references public.schools(id),
  asset_type visual_asset_type not null,
  source_type visual_source_type not null,
  storage_path text not null,
  thumbnail_path text,
  width int not null,
  height int not null,
  mime_type text not null,
  file_size bigint not null,
  title text,
  description text,
  caption text,
  alt_text text,
  creator text,
  source_name text,
  source_url text,
  license_name text,
  license_url text,
  attribution_text text,
  attribution_required boolean not null default true,
  generation_provider text,
  generation_model text,
  generation_prompt text,
  negative_prompt text,
  seed text,
  generation_cost numeric,
  quality_status visual_quality_status not null default 'pending',
  moderation_status visual_moderation_status not null default 'pending',
  -- Confidentialité (garde-fou : jamais d'envoi IA externe sans autorisation).
  contains_personal_data boolean not null default false,
  contains_minor boolean not null default false,
  consent_status visual_consent_status not null default 'not_required',
  retention_policy text,
  external_ai_processing_allowed boolean not null default false,
  -- Faux par défaut : sans licence claire, un visuel n'est pas publiable.
  publishable boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index visual_assets_org_idx on public.visual_assets (organization_id);
create index visual_assets_school_idx on public.visual_assets (school_id);
create index visual_assets_type_idx on public.visual_assets (asset_type);

-- Historique par asset (append-only : aucune politique update/delete).
create table public.visual_asset_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  asset_id uuid not null references public.visual_assets(id) on delete cascade,
  version_number int not null,
  storage_path text not null,
  snapshot jsonb not null default '{}',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (asset_id, version_number)
);
create index visual_asset_versions_asset_idx on public.visual_asset_versions (asset_id);

-- Licences détaillées (une source par asset au MVP).
create table public.visual_licenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  asset_id uuid not null references public.visual_assets(id) on delete cascade,
  provider text,
  creator text,
  source_page_url text,
  source_file_url text,
  license_name text,
  license_url text,
  is_public_domain boolean not null default false,
  attribution_required boolean not null default true,
  attribution_text text,
  retrieved_at timestamptz,
  restrictions text[] not null default '{}',
  publishable boolean not null default false,
  created_at timestamptz not null default now()
);
create index visual_licenses_asset_idx on public.visual_licenses (asset_id);

-- Crédits générés par contexte (fiche prof, support élève, slide, page crédits).
create table public.visual_attributions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  asset_id uuid not null references public.visual_assets(id) on delete cascade,
  context text not null,
  text text not null,
  created_at timestamptz not null default now()
);
create index visual_attributions_asset_idx on public.visual_attributions (asset_id);

-- Liaison bloc↔visuel : les blocs vivent en jsonb (block_id = id du bloc).
create table public.visual_usages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  asset_id uuid not null references public.visual_assets(id) on delete cascade,
  sequence_id uuid references public.lesson_sequences(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  material_id uuid references public.materials(id) on delete cascade,
  block_id uuid,
  assessment_id uuid,
  slide_id uuid,
  layout visual_layout_target,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (asset_id, material_id, block_id)
);
create index visual_usages_asset_idx on public.visual_usages (asset_id);
create index visual_usages_material_idx on public.visual_usages (material_id);
create index visual_usages_sequence_idx on public.visual_usages (sequence_id);

-- Variantes de mise en page (recadrage par support, jamais d'étirement).
create table public.visual_layout_variants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  asset_id uuid not null references public.visual_assets(id) on delete cascade,
  target visual_layout_target not null,
  aspect_ratio text not null,
  crop jsonb,
  focus_x numeric not null default 0.5,
  focus_y numeric not null default 0.5,
  storage_path text,
  created_at timestamptz not null default now(),
  unique (asset_id, target)
);
create index visual_layout_variants_asset_idx on public.visual_layout_variants (asset_id);

create trigger visual_assets_set_updated_at before update on public.visual_assets
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------- RLS
alter table public.visual_assets          enable row level security;
alter table public.visual_asset_versions  enable row level security;
alter table public.visual_licenses        enable row level security;
alter table public.visual_attributions    enable row level security;
alter table public.visual_usages          enable row level security;
alter table public.visual_layout_variants enable row level security;

-- Assets : éducateurs de l'organisation, avec cloisonnement par école.
create policy visual_assets_select on public.visual_assets
  for select using (
    is_educator(organization_id)
    and (
      school_id is null
      or is_school_member(school_id)
      or has_role(organization_id, 'org_admin')
    )
  );
create policy visual_assets_insert on public.visual_assets
  for insert with check (
    is_educator(organization_id) and created_by = auth.uid()
  );
create policy visual_assets_update on public.visual_assets
  for update using (
    created_by = auth.uid() or has_role(organization_id, 'org_admin')
  )
  with check (
    created_by = auth.uid() or has_role(organization_id, 'org_admin')
  );
create policy visual_assets_delete on public.visual_assets
  for delete using (
    created_by = auth.uid() or has_role(organization_id, 'org_admin')
  );

-- Helper : accès à un asset (réplique la visibilité des assets).
create or replace function public.can_access_visual_asset(p_asset_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from visual_assets a
    where a.id = p_asset_id
      and is_educator(a.organization_id)
      and (
        a.school_id is null
        or is_school_member(a.school_id)
        or has_role(a.organization_id, 'org_admin')
      )
  );
$$;

-- Versions : lecture via l'asset ; append-only ; insertion bornée éducateur.
create policy visual_asset_versions_select on public.visual_asset_versions
  for select using (can_access_visual_asset(asset_id));
create policy visual_asset_versions_insert on public.visual_asset_versions
  for insert with check (
    is_educator(organization_id) and can_access_visual_asset(asset_id)
  );

-- Licences / attributions / variantes : lecture via l'asset, écriture éducateur.
create policy visual_licenses_select on public.visual_licenses
  for select using (can_access_visual_asset(asset_id));
create policy visual_licenses_write on public.visual_licenses
  for all using (is_educator(organization_id) and can_access_visual_asset(asset_id))
  with check (is_educator(organization_id) and can_access_visual_asset(asset_id));

create policy visual_attributions_select on public.visual_attributions
  for select using (can_access_visual_asset(asset_id));
create policy visual_attributions_write on public.visual_attributions
  for all using (is_educator(organization_id) and can_access_visual_asset(asset_id))
  with check (is_educator(organization_id) and can_access_visual_asset(asset_id));

create policy visual_layout_variants_select on public.visual_layout_variants
  for select using (can_access_visual_asset(asset_id));
create policy visual_layout_variants_write on public.visual_layout_variants
  for all using (is_educator(organization_id) and can_access_visual_asset(asset_id))
  with check (is_educator(organization_id) and can_access_visual_asset(asset_id));

-- Usages : lecture via la séquence si liée, sinon via l'asset ; écriture bornée.
create policy visual_usages_select on public.visual_usages
  for select using (
    (sequence_id is not null and can_access_sequence(sequence_id))
    or (sequence_id is null and can_access_visual_asset(asset_id))
  );
create policy visual_usages_write on public.visual_usages
  for all using (
    is_educator(organization_id) and can_access_visual_asset(asset_id)
  )
  with check (
    is_educator(organization_id) and can_access_visual_asset(asset_id)
  );

-- ----------------------------------------------------------------- buckets
-- Buckets PRIVÉS : aucun accès direct client (aucune politique storage.objects),
-- tout passe par le serveur et des URL signées courtes. `visuals-personal`
-- isole les visuels contenant des données personnelles / d'élèves.
insert into storage.buckets (id, name, public)
values ('visuals', 'visuals', false), ('visuals-personal', 'visuals-personal', false)
on conflict (id) do nothing;

