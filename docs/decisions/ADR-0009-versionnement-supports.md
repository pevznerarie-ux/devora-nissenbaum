# ADR-0009 — Versionnement des supports : autosave, versions immuables, statuts

Statut : acceptée · Date : 2026-07-23

## Contexte

Exigences éditeur : sauvegarde automatique, versions, duplication, historique,
restauration, statuts brouillon/validé/publié/archivé — sans construire un
système de collaboration temps réel.

## Décision

- Modèle à deux niveaux : `materials` (identité, `kind`, `status`, langue,
  `current_version_id`) et `material_versions` (contenu `blocks` jsonb,
  **immuables** une fois figées).
- **Autosave** : écrit (débouncé côté client, ~2 s) dans la version de travail
  courante ; un instantané numéroté est figé automatiquement à chaque événement
  significatif : validation, publication, restauration, régénération IA, et au
  plus toutes les 24 h de modifications actives.
- **Restauration** : copier les `blocks` d'une version passée dans une nouvelle
  version de travail (l'historique n'est jamais réécrit).
- **Duplication** : nouveau `material` avec version 1 = copie des blocs ;
  la provenance est tracée (`metadata.duplicated_from`).
- **Statuts** : `draft → validated → published → archived` ; transitions
  contrôlées par server action (rôle requis), journalisées dans `audit_logs` ;
  seule `published` est visible des élèves (RLS).
- Concurrence : verrouillage optimiste (`updated_at` attendu dans l'autosave) ;
  en cas de conflit, l'utilisateur choisit — pas de fusion automatique ni de
  CRDT au MVP.

## Conséquences

- Historique fiable et simple ; stockage borné (instantanés événementiels, pas
  à chaque frappe).
- La collaboration simultanée multi-professeurs sur un même support est hors
  MVP ; le modèle ne l'empêche pas (passage possible à une granularité par bloc).
