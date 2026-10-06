create or replace function public.log_tour_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.start_date is distinct from old.start_date then
    insert into public.tour_change_log (tour_id, field, old_value, new_value)
    values (new.id, 'start_date', old.start_date::text, new.start_date::text);
  end if;
  if new.end_date is distinct from old.end_date then
    insert into public.tour_change_log (tour_id, field, old_value, new_value)
    values (new.id, 'end_date', old.end_date::text, new.end_date::text);
  end if;
  if new.meeting_point is distinct from old.meeting_point then
    insert into public.tour_change_log (tour_id, field, old_value, new_value)
    values (new.id, 'meeting_point', old.meeting_point, new.meeting_point);
  end if;
  if new.status is distinct from old.status then
    insert into public.tour_change_log (tour_id, field, old_value, new_value)
    values (new.id, 'status', old.status, new.status);
  end if;
  if new.cancelled_at is distinct from old.cancelled_at then
    insert into public.tour_change_log (tour_id, field, old_value, new_value)
    values (new.id, 'cancelled_at', old.cancelled_at::text, new.cancelled_at::text);
  end if;
  return new;
end;
$$;
