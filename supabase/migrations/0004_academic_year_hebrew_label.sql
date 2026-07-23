-- PedagoOS — migration 0004 : double calendrier des années scolaires.
-- Les dates restent stockées en calendrier civil (grégorien) ; chaque année
-- scolaire porte en plus un libellé hébreu traditionnel (ex. תשפ״ז), calculé
-- côté serveur (packages/shared/src/hebrew-calendar.ts) et modifiable.

alter table public.academic_years
  add column hebrew_label text;
