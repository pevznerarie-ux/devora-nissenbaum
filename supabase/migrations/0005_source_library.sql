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
