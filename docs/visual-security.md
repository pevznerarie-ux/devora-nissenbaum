# Visual Intelligence Engine — sécurité et confidentialité

## Stockage

Buckets **privés** `visuals` et `visuals-personal`. Accès uniquement par URL
signée courte (≤ 600 s). Chemins préfixés `organization_id` (`buildStoragePath`).
Aucune URL publique.

## Uploads

Vérifier le type MIME, limiter la taille, nettoyer les noms de fichiers, refuser
les formats non autorisés, miniatures générées **côté serveur**, jamais
d'exécution de contenu importé. Architecture prête pour un scan de sécurité.

## Confidentialité (données mineurs)

Les images d'élèves sont traitées séparément (`visuals-personal`). Un asset
`contains_minor`/`contains_personal_data` n'est **jamais** envoyé à une IA
externe sans `external_ai_processing_allowed` (garde-fou pur `maySendToExternalAi`).
Aucun fichier utilisateur pour entraîner un modèle. Logs sans données sensibles.

## Isolation multi-tenant

RLS explicite par table (bornée `organization_id`), fonctions `security definer`
existantes réutilisées.
