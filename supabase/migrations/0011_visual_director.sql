-- PedagoOS — migration 0011 : Visual Director, chartes, jobs et logs (ADR-0016).
-- Persistance des VisualRequest, des chartes visuelles (style kits, + 4 défauts
-- globaux), et de l'exécution (jobs de statut + journal des appels fournisseurs).
-- Types texte validés côté application par Zod ; RLS explicite (CLAUDE §5.2).

-- ------------------------------------------------------- visual_style_kits
create table public.visual_style_kits (
  id uuid primary key default gen_random_uuid(),
  -- null = charte globale par défaut (lecture par tout éducateur authentifié).
  organization_id uuid references public.organizations(id),
  name text not null,
  target_age_min int,
  target_age_max int,
  school_levels text[] not null default '{}',
  subjects text[] not null default '{}',
  editorial_style text not null,
  visual_mood text not null,
  line_style text not null,
  background_style text not null,
  character_style text not null,
  realism_level text not null,
  allowed_colors text[] not null default '{}',
  preferred_colors text[] not null default '{}',
  prohibited_colors text[] not null default '{}',
  allowed_visual_types text[] not null default '{}',
  prohibited_visual_types text[] not null default '{}',
  prompt_prefix text not null default '',
  prompt_suffix text not null default '',
  negative_instructions text[] not null default '{}',
  reference_asset_ids uuid[] not null default '{}',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index visual_style_kits_org_idx on public.visual_style_kits (organization_id);

-- --------------------------------------------------------- visual_requests
create table public.visual_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  school_id uuid references public.schools(id),
  sequence_id uuid references public.lesson_sequences(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  material_id uuid references public.materials(id) on delete cascade,
  block_id uuid,
  assessment_id uuid,
  slide_id uuid,
  visual_needed boolean not null default false,
  pedagogical_purpose text not null,
  recommended_type text not null,
  preferred_source text not null,
  fallback_types text[] not null default '{}',
  concept text not null,
  description text not null,
  caption text,
  alt_text text,
  target_age int,
  school_level text,
  subject text,
  language text,
  orientation text not null default 'landscape',
  aspect_ratio text,
  minimum_width int,
  minimum_height int,
  accuracy_requirements text[] not null default '{}',
  required_elements text[] not null default '{}',
  prohibited_elements text[] not null default '{}',
  search_queries text[] not null default '{}',
  negative_search_terms text[] not null default '{}',
  style_kit_id uuid references public.visual_style_kits(id),
  requires_human_review boolean not null default false,
  -- proposed → accepted / rejected / fulfilled (un asset a été rattaché).
  status text not null default 'proposed',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index visual_requests_org_idx on public.visual_requests (organization_id);
create index visual_requests_material_idx on public.visual_requests (material_id);
create index visual_requests_sequence_idx on public.visual_requests (sequence_id);

-- -------------------------------------------------- visual_generation_jobs
-- Statuts de l'exécution (synchrone au MVP ; prêt pour une file — ADR-0016 §6).
create table public.visual_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  visual_request_id uuid references public.visual_requests(id) on delete cascade,
  asset_id uuid references public.visual_assets(id) on delete set null,
  kind text not null,
  status text not null default 'queued',
  attempts int not null default 0,
  error text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index visual_generation_jobs_org_idx on public.visual_generation_jobs (organization_id);
create index visual_generation_jobs_request_idx
  on public.visual_generation_jobs (visual_request_id);

-- ------------------------------------------------------ visual_provider_logs
-- Journal des appels fournisseurs (coût/durée/erreur) — jamais de données sensibles.
create table public.visual_provider_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  job_id uuid references public.visual_generation_jobs(id) on delete cascade,
  requested_by uuid references public.profiles(id),
  provider text not null,
  model text,
  operation text not null,
  duration_ms int,
  cost numeric,
  status text not null,
  error text,
  created_at timestamptz not null default now()
);
create index visual_provider_logs_org_idx on public.visual_provider_logs (organization_id);
create index visual_provider_logs_job_idx on public.visual_provider_logs (job_id);

do $$
declare t text;
begin
  foreach t in array array[
    'visual_style_kits', 'visual_requests', 'visual_generation_jobs'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- --------------------------------------------------------------- RLS
alter table public.visual_style_kits       enable row level security;
alter table public.visual_requests         enable row level security;
alter table public.visual_generation_jobs  enable row level security;
alter table public.visual_provider_logs    enable row level security;

-- Chartes : globales (org null) lisibles par tout éducateur authentifié ; chartes
-- d'organisation lisibles par ses éducateurs, écrites par l'org_admin.
create policy visual_style_kits_select on public.visual_style_kits
  for select using (
    (organization_id is null and auth.uid() is not null)
    or is_educator(organization_id)
  );
create policy visual_style_kits_write on public.visual_style_kits
  for all using (
    organization_id is not null and has_role(organization_id, 'org_admin')
  )
  with check (
    organization_id is not null and has_role(organization_id, 'org_admin')
  );

-- VisualRequest : lecture/écriture par les intervenants (via la séquence sinon org).
create policy visual_requests_select on public.visual_requests
  for select using (
    (sequence_id is not null and can_access_sequence(sequence_id))
    or (sequence_id is null and is_educator(organization_id))
  );
create policy visual_requests_insert on public.visual_requests
  for insert with check (
    is_educator(organization_id) and created_by = auth.uid()
  );
create policy visual_requests_update on public.visual_requests
  for update using (is_educator(organization_id))
  with check (is_educator(organization_id));
create policy visual_requests_delete on public.visual_requests
  for delete using (
    created_by = auth.uid() or has_role(organization_id, 'org_admin')
  );

-- Jobs : lecture/écriture par les éducateurs de l'organisation (exécution serveur).
create policy visual_generation_jobs_select on public.visual_generation_jobs
  for select using (is_educator(organization_id));
create policy visual_generation_jobs_write on public.visual_generation_jobs
  for all using (is_educator(organization_id))
  with check (is_educator(organization_id));

-- Logs : lecture par l'auteur ou l'org_admin ; insertion serveur (éducateur).
create policy visual_provider_logs_select on public.visual_provider_logs
  for select using (
    requested_by = auth.uid() or has_role(organization_id, 'org_admin')
  );
create policy visual_provider_logs_insert on public.visual_provider_logs
  for insert with check (is_educator(organization_id));

-- ------------------------------------------------- seed des chartes globales
-- Quatre chartes par défaut (org null) alignées sur DEFAULT_STYLE_KITS (code).
insert into public.visual_style_kits (
  id, organization_id, name, target_age_min, target_age_max, school_levels,
  editorial_style, visual_mood, line_style, background_style, character_style,
  realism_level, prompt_prefix, prompt_suffix, negative_instructions, is_default
) values
  ('00000000-0000-4000-9000-000000000001', null, 'Primaire 6–8 ans', 6, 8,
   array['cp','ce1'],
   'illustration éditoriale douce, formes claires', 'rassurant et lisible',
   'contours nets et réguliers', 'fonds épurés, peu d''éléments',
   'personnages simples aux proportions naturelles', 'editorial',
   'Clear educational editorial illustration for young children,',
   'calm palette, high readability, no clutter.',
   array['generic AI look','plastic 3D render','babyish cartoon'], true),
  ('00000000-0000-4000-9000-000000000002', null, 'Primaire 9–11 ans', 9, 11,
   array['ce2','cm1','cm2'],
   'illustration éditoriale précise', 'curieux et clair',
   'traits nets, détails maîtrisés', 'contextes simples et pertinents',
   'personnages réalistes non caricaturaux', 'editorial',
   'Precise educational editorial illustration,',
   'clear composition, age-appropriate detail.',
   array['generic AI look','plastic 3D render'], true),
  ('00000000-0000-4000-9000-000000000003', null, 'Collège 11–14 ans', 11, 14,
   array['sixieme','cinquieme','quatrieme','troisieme'],
   'illustration éditoriale semi-réaliste', 'sérieux et engageant',
   'rendu soigné, hiérarchie visuelle claire', 'contextes crédibles et informatifs',
   'personnages crédibles, proportions justes', 'semi_realistic',
   'Semi-realistic educational illustration for secondary students,',
   'credible detail, clear visual hierarchy.',
   array['generic AI look','plastic 3D render'], true),
  ('00000000-0000-4000-9000-000000000004', null, 'Lycée 15–18 ans', 15, 18,
   array['seconde','premiere','terminale'],
   'illustration éditoriale sobre, proche du manuel', 'rigoureux et net',
   'précision documentaire', 'contextes exacts, sans surcharge',
   'représentations réalistes et respectueuses', 'semi_realistic',
   'Sober textbook-grade educational illustration,',
   'documentary accuracy, restrained palette.',
   array['generic AI look','plastic 3D render'], true)
on conflict (id) do nothing;
