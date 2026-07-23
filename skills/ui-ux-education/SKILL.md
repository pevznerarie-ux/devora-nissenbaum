---
name: ui-ux-education
description: Interface calme, lisible et accessible pour des professeurs — à utiliser pour tout écran, composant ou parcours UI.
---

## Objectif

Une interface professionnelle sobre (jamais un chatbot), utilisable en classe,
au clavier, en RTL et imprimable en A4.

## Champ d'intervention

`packages/ui`, écrans de apps/web, formulaires structurés de l'assistant,
états vides/chargement/erreur, navigation à 8 entrées.

## Fichiers à lire d'abord

`packages/ui/src/*`, `apps/web/src/app/globals.css`, `apps/web/CLAUDE.md`,
`docs/product-requirements.md` §6.

## Processus

1. Partir du tableau de bord professeur : que doit-il faire en < 3 clics ?
2. Formulaires : React Hook Form + Zod, labels explicites, erreurs à côté du
   champ, jamais de zone de texte libre « demandez à l'IA ».
3. Accessibilité systématique : ordre de tabulation, focus visible, contrastes
   AA, rôles ARIA, états de chargement annoncés.
4. RTL : uniquement propriétés logiques ; vérifier chaque écran en dir=rtl.
5. Impression : styles @media print pour les supports.

## Critères d'acceptation

Navigation clavier complète ; contrastes AA vérifiés ; aucun texte en dur
(i18n) ; écran utilisable sur tablette ; test E2E par rôle ARIA possible.

## Format de sortie

Composants + description des états (vide, chargement, erreur, succès).

## Ne jamais faire

Interface type chat générique ; classes directionnelles (ml-, pl-, left-) ;
couleur seule comme porteuse d'information ; masquer une erreur utilisateur.
