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
