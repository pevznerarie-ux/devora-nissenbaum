# Visual Intelligence Engine — modèle de données

Toutes les tables portent `organization_id` (+ `school_id` le cas échéant) et
une RLS explicite testée (CLAUDE §5.2). Migrations phasées.

## Migration 0010 — Media Library

`visual_assets`, `visual_asset_versions`, `visual_licenses`,
`visual_attributions`, `visual_usages`, `visual_layout_variants`

- buckets privés `visuals`, `visuals-personal`.

## Migration 0011 — Visual Director

`visual_requests`, `visual_style_kits` (+ seed 4 chartes),
`visual_generation_jobs`, `visual_provider_logs`.

## Migration 0012 — Recherche & qualité

`visual_sources`, `visual_search_results`, `visual_quality_reviews`.

## Migration 0013 — Personnages & sémantique (différé)

`visual_characters`, `visual_character_references`, `visual_embeddings`
(pgvector si disponible, sinon colonne préparée).

## Liens optionnels

`lesson_sequence_id`, `lesson_id`, `material_id`, `block_id`, `assessment_id`,
`slide_id`.

## Confidentialité (sur `visual_assets`)

`contains_personal_data`, `contains_minor`, `consent_status`,
`retention_policy`, `external_ai_processing_allowed`.
