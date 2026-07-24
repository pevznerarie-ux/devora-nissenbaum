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
