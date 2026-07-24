---
name: document-renderer
description: Rendu et export des supports — PDF (Playwright/Chromium), PPTX (PptxGenJS), DOCX best-effort, variantes professeur/élève. À utiliser pour packages/document-generation.
---

## Objectif

Transformer les blocs pédagogiques en documents fidèles : PDF A4 imprimables,
présentations PPTX sobres, DOCX best-effort, en 4 variantes par filtrage.

## Champ d'intervention

`packages/document-generation`, templates print React, mapping blocs → slides,
table `exports`, bucket `exports`.

## Fichiers à lire d'abord

ADR-0006, `packages/pedagogy/src/*` (blocs, audience, answerKey),
`docs/data-model.md` §7 et §10.

## Processus

1. Variante = filtrage des blocs par audience/answerKey AVANT rendu, jamais
   deux contenus maintenus en parallèle.
2. PDF : template print dédié, CSS @page A4, en-tête (titre, classe, date),
   test de rendu Playwright avec capture de référence.
3. PPTX : un bloc slide = une diapositive ; pas de pavés de texte.
4. RTL : dir et polices corrects pour les contenus he ; nombres et dates via Intl.
5. Fichier → bucket privé exports + ligne exports + URL signée courte.

## Critères d'acceptation

PDF identique à l'aperçu impression ; variante élève sans aucun élément de
corrigé (vérifié par test) ; export journalisé ; échec de rendu = erreur
explicite enregistrée.

## Format de sortie

Code de rendu + test de non-régression visuelle ou structurelle.

## Ne jamais faire

URL publique ; corrigé qui fuite dans une variante élève ; dépendre du DOM du
navigateur client pour générer ; bloquer la requête utilisateur pendant un
rendu long (job + état).
