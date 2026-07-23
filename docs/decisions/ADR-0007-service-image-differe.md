# ADR-0007 — Service image FastAPI différé ; interfaces, tables et mock OCR d'abord

Statut : acceptée · Date : 2026-07-23

## Contexte
Le scan et la correction de copies exigent du traitement d'image (OpenCV :
redressement, nettoyage, séparation de pages) et de l'OCR manuscrit (Google
Cloud Vision / Document AI). La commande impose de **ne pas** développer le
module complet au premier sprint, mais de préparer le terrain.

## Décision
- Au MVP : uniquement (1) les interfaces TypeScript (`OCRProvider`, `ScanJob`,
  `ScannedPage`, `AnswerSegment`, `TranscriptionResult`, `ProposedGrade`),
  (2) les tables `scan_batches`, `scanned_copies`, `copy_pages`,
  `answer_segments`, `proposed_grades`, `student_results` avec leur RLS,
  (3) un `MockOCRProvider` déterministe, (4) un écran de démonstration branché
  sur le mock, (5) `docs/scan-architecture.md` décrivant le pipeline cible :
  upload → séparation des pages → amélioration image → identification de la
  copie → OCR → segmentation par question → transcription → correction
  proposée → score de confiance → validation professeur → résultats par
  compétence.
- Le service `services/image-processing` (Python FastAPI + OpenCV) n'est créé
  qu'au démarrage du module réel ; appels serveur→serveur authentifiés,
  jamais exposé au client ; il ne stocke rien durablement.
- L'OCR réel reste derrière `OCRProvider` (Google Cloud Vision ou Document AI
  interchangeables) ; choix final instruit à ce moment-là par un ADR dédié.
- Invariant : aucune note officielle sans validation humaine
  (`proposed_grades.reviewed_by` obligatoire pour finaliser).

## Conséquences
- Le modèle de données et l'UI du MVP anticipent le scan sans en payer le coût.
- Le seul microservice du système reste optionnel et remplaçable.
