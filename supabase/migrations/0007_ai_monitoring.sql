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
