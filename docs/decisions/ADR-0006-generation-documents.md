# ADR-0006 — PDF via Playwright/Chromium, PPTX via PptxGenJS, DOCX best-effort

Statut : acceptée · Date : 2026-07-23

## Contexte
Exports exigés : impression, PDF, PPTX, DOCX « si raisonnablement réalisable »,
en variantes professeur/élève/avec/sans corrigé, avec impression A4 correcte et
support RTL (hébreu).

## Décision
- **PDF** : templates React « print » dédiés (CSS `@page`, A4, en-têtes/pieds),
  rendus dans Chromium piloté par Playwright (`page.pdf()`), côté serveur.
  Le même HTML sert à l'aperçu impression navigateur.
- **PPTX** : PptxGenJS à partir des blocs `slide` (une idée par écran, peu de
  texte, questions interactives, synthèses intermédiaires, écran final).
- **DOCX** : bibliothèque `docx` (npm), mapping bloc → paragraphes/styles.
  Fidélité **best-effort** assumée : le PDF est la référence typographique ;
  si un bloc n'a pas d'équivalent DOCX correct, dégradation propre documentée.
- Variantes par **filtrage des blocs** (`audience`, `answerKey`) avant rendu —
  jamais de duplication de contenu.
- RTL : `dir` et polices adaptées dans les templates PDF ; PptxGenJS configuré
  `rtlMode` pour les contenus en hébreu.
- Les fichiers générés vont dans le bucket privé `exports`, journalisés dans
  la table `exports`, servis par URL signée.

## Conséquences
- Une seule source de vérité (les blocs) pour écran, impression et exports.
- Chromium requis côté serveur (déjà disponible dans l'environnement de dev ;
  en production, exécution dans un runtime Node avec Chromium provisionné).
