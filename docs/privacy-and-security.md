# PedagoOS — Confidentialité et sécurité

Statut : version 1. Ce document est normatif : toute fonctionnalité doit s'y
conformer. Le produit traite des données de **mineurs** ; le niveau d'exigence
est donc maximal (cadre visé : RGPD ; hypothèse A-008 sur les cadres locaux).

## 1. Minimisation des données

- Élèves : prénom, nom, classe(s), niveau, et **optionnellement** date de
  naissance et identifiant école fourni par l'établissement. Rien d'autre :
  pas d'adresse, pas de téléphone, pas de photo au MVP.
- Un élève peut exister **sans compte utilisateur** (pas d'email requis).
- Les formulaires ne demandent jamais une donnée sans usage immédiat documenté.
- Les copies scannées (post-MVP) sont rattachées par identifiant opaque.

## 2. Contrôle des accès

- Authentification par Supabase Auth ; sessions serveur (cookies httpOnly).
- Autorisation à deux niveaux : vérification applicative par rôle dans chaque
  server action **et** politiques RLS explicites sur toutes les tables
  (voir `docs/data-model.md` §9).
- Séparation stricte des organisations : aucune requête, aucun index, aucune
  URL ne permet d'atteindre les données d'une autre organisation. Tests RLS
  inter-organisations obligatoires en CI.
- Un professeur ne voit que ses classes et les ressources partagées avec lui ;
  un directeur, son établissement ; un administrateur d'organisation, son
  organisation ; un élève, uniquement ses contenus **publiés** et ses résultats.
- Clés `service_role` : serveur uniquement, usages système énumérés
  (invitations, jobs), jamais pour des lectures métier utilisateur.

## 3. Fichiers et chiffrement

- Tous les buckets Storage sont **privés** ; accès par URL signée à durée
  courte (≤ 10 min) ; aucun document récupérable par URL publique.
- Chiffrement en transit : TLS partout (app, Supabase, fournisseurs IA, OCR).
- Chiffrement au repos : assuré par Supabase/GCP ; aucune copie locale durable
  de fichiers élèves dans les services.

## 4. Gestion des secrets

- Aucun secret dans le dépôt ni dans le bundle client ; `.env.example` liste
  les variables sans valeur.
- Seules les variables `NEXT_PUBLIC_*` énumérées dans `docs/architecture.md` §9
  sont exposées au client.
- Rotation possible sans déploiement (variables d'environnement de la
  plateforme d'hébergement).
- Les tokens d'invitation sont stockés hachés (`token_hash`), à expiration.

## 5. Journaux

- `audit_logs` (métier) : append-only (RLS interdit UPDATE/DELETE), horodaté,
  par organisation ; enregistre les opérations sensibles : invitations,
  changements de rôle, création/archivage de classe, ajout/suppression
  d'élève, publication de support, validation de correction, exports, accès
  administratifs. Métadonnées minimales, pas de contenu pédagogique complet.
- Journaux techniques (Sentry, logs serveur) : identifiants opaques uniquement ;
  jamais de nom d'élève, de contenu de copie, de token ou de clé. Durée de
  rétention Sentry ≤ 90 jours.
- PostHog : désactivé par défaut (feature flag) ; événements produit sans
  contenu pédagogique ni donnée élève.

## 6. IA et données des élèves

- **Interdiction** d'utiliser les données élèves pour entraîner un modèle sans
  accord explicite de l'organisation (et opt-out par défaut). Les fournisseurs
  configurés doivent contractuellement ne pas entraîner sur les données
  transmises (API-only, pas de rétention d'entraînement).
- Les prompts envoyés aux fournisseurs contiennent le minimum nécessaire :
  jamais de nom d'élève pour la génération de supports ; pour la correction
  (post-MVP), pseudonymisation par identifiant opaque.
- Toute sortie IA est marquée comme proposition, revue par un humain avant
  publication ; les incertitudes sont signalées, jamais présentées comme des
  faits.
- Chaque appel IA est journalisé (`ai_generations`) avec fournisseur, modèle,
  version de prompt et objet concerné.

## 7. Conservation, suppression, export

- **Durée de conservation configurable par organisation**
  (`organizations.settings.retention`) : par défaut, données élèves conservées
  l'année scolaire en cours + 1 an, puis anonymisées.
- **Suppression d'un élève** : suppression des données personnelles (nom,
  date de naissance, identifiant externe) ; les résultats agrégés sont soit
  supprimés, soit anonymisés (choix de l'organisation) ; fichiers de copies
  supprimés du Storage ; entrée d'audit conservée sans données personnelles.
- **Suppression d'une organisation** : export complet proposé, puis purge
  totale (base + Storage + sorties brutes IA) sous délai documenté (30 jours),
  y compris les sauvegardes selon le calendrier de rotation de l'hébergeur.
- **Export des données** : une organisation peut exporter ses données dans un
  format structuré (JSON + fichiers) ; un professeur peut exporter ses
  productions ; conforme au droit à la portabilité.
- Anonymisation : remplacement irréversible des identifiants personnels par
  des jetons, en conservant les statistiques pédagogiques agrégées.

## 8. Audit des accès

- Les lectures administratives sensibles (consultation massive d'élèves,
  exports, accès support plateforme) génèrent une entrée d'audit.
- Les accès du super administrateur plateforme aux données d'une organisation
  sont exceptionnels, journalisés et motivés.

## 9. Checklist par fonctionnalité (à appliquer en revue)

1. Quelles données personnelles sont introduites ? Sont-elles nécessaires ?
2. RLS écrite et testée (accès légitime + refus inter-org) ?
3. Entrées validées par Zod ? Sorties IA validées par schéma ?
4. Fichiers en bucket privé, URL signées ?
5. Opération sensible → `audit_logs` ?
6. Suppression/anonymisation de la donnée couverte par §7 ?
7. Aucune donnée personnelle dans les logs techniques ?
