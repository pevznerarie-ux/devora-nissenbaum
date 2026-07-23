-- PedagoOS — migration 0003 : ajout d'élèves à une classe.
--
-- Un professeur peut ajouter des élèves à SA classe (PRD §3.B), mais la
-- politique students_write est réservée à l'administration/direction et le
-- RETURNING d'un insert exigerait un droit SELECT immédiat. Cette fonction
-- security definer est donc l'unique chemin d'écriture professeur :
-- contrôle d'accès explicite (can_access_class), insertion élève +
-- rattachement classe atomiques, rapport ligne à ligne pour l'import CSV.

create or replace function public.add_students_to_class(
  p_class_id uuid,
  p_students jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class classes%rowtype;
  v_item jsonb;
  v_first text;
  v_last text;
  v_birth date;
  v_created int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_index int := 0;
  v_student_id uuid;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  select * into v_class from classes where id = p_class_id;
  if not found then
    raise exception 'class_not_found';
  end if;
  if v_class.archived_at is not null then
    raise exception 'class_archived';
  end if;
  if not can_access_class(p_class_id) then
    raise exception 'forbidden';
  end if;
  if p_students is null or jsonb_typeof(p_students) <> 'array' then
    raise exception 'invalid_payload';
  end if;
  if jsonb_array_length(p_students) > 500 then
    raise exception 'too_many_rows';
  end if;

  for v_item in select * from jsonb_array_elements(p_students) loop
    v_index := v_index + 1;
    v_first := nullif(btrim(coalesce(v_item->>'firstName', '')), '');
    v_last := nullif(btrim(coalesce(v_item->>'lastName', '')), '');

    if v_first is null or v_last is null then
      v_errors := v_errors
        || jsonb_build_object('index', v_index, 'code', 'missing_name');
      continue;
    end if;

    begin
      v_birth := nullif(v_item->>'birthDate', '')::date;
    exception when others then
      v_errors := v_errors
        || jsonb_build_object('index', v_index, 'code', 'invalid_date');
      continue;
    end;

    insert into students (organization_id, school_id, first_name, last_name, birth_date)
    values (v_class.organization_id, v_class.school_id, v_first, v_last, v_birth)
    returning id into v_student_id;

    insert into class_students (class_id, student_id)
    values (p_class_id, v_student_id);

    v_created := v_created + 1;
  end loop;

  insert into audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  values (
    v_class.organization_id,
    auth.uid(),
    'students.add_to_class',
    'class',
    p_class_id,
    jsonb_build_object('created', v_created, 'errorCount', jsonb_array_length(v_errors))
  );

  return jsonb_build_object('created', v_created, 'errors', v_errors);
end $$;

revoke all on function public.add_students_to_class(uuid, jsonb) from public;
grant execute on function public.add_students_to_class(uuid, jsonb) to authenticated;
