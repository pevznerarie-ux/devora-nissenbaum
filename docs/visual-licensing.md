# Visual Intelligence Engine — licences et crédits

Aucun visuel externe n'entre sans métadonnées de source. Un visuel sans licence
claire est **non publiable** (`publishable=false` par défaut).

## Métadonnées stockées

fournisseur · auteur · page source · URL directe · type de licence · URL de
licence · attribution requise · attribution générée · date de récupération ·
restrictions · domaine public (oui/non).

## Générateur de crédits (pur)

`buildAttributionText`, `buildCreditsList` (`packages/pedagogy/src/visual/license.ts`)
alimentent : fiche professeur, support élève, présentation, page de crédits,
exports PDF/PPTX. Ne jamais supposer qu'une image trouvée est libre.

## Ordre des fournisseurs (droits croissants)

1. Domaine public (Wikimedia) — sûr, MVP.
2. Banques sous licence (D-10) — à instruire.
3. Illustrations IA (D-11) — droits du contenu généré à cadrer (D-9).
