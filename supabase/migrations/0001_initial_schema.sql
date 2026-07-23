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
