-- PedagoOS - migration 0012 : notes professeur par eleve et par classe.
-- Objectif produit : permettre au professeur de garder des commentaires de suivi
-- sans creer de compte eleve ni exposer ces notes aux autres professeurs.

create table if not exists public.student_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, student_id, author_id)
);

create index if not exists student_notes_class_idx on public.student_notes (class_id);
create index if not exists student_notes_student_idx on public.student_notes (student_id);
create index if not exists student_notes_author_idx on public.student_notes (author_id);

create trigger student_notes_set_updated_at before update on public.student_notes
  for each row execute function public.set_updated_at();

alter table public.student_notes enable row level security;

create policy student_notes_select_own on public.student_notes
  for select using (
    author_id = auth.uid()
    and can_access_class(class_id)
  );

create policy student_notes_insert_own on public.student_notes
  for insert with check (
    author_id = auth.uid()
    and can_access_class(class_id)
  );

create policy student_notes_update_own on public.student_notes
  for update using (
    author_id = auth.uid()
    and can_access_class(class_id)
  )
  with check (
    author_id = auth.uid()
    and can_access_class(class_id)
  );

create policy student_notes_delete_own on public.student_notes
  for delete using (
    author_id = auth.uid()
    and can_access_class(class_id)
  );

grant select, insert, update, delete on public.student_notes to authenticated;
grant all privileges on public.student_notes to service_role;
