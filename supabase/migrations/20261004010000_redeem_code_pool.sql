create table public.redeem_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  product text not null check (product in ('week', 'month', 'year')),
  status text not null default 'available' check (status in ('available', 'assigned', 'sent', 'redeemed')),
  booking_id uuid references public.bookings(id) on delete set null,
  assigned_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.redeem_codes enable row level security;

create or replace function public.assign_redeem_code(p_booking uuid, p_product text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  picked uuid;
  picked_code text;
begin
  select id into picked from public.redeem_codes
    where status = 'available' and product = p_product
    order by created_at
    limit 1
    for update skip locked;
  if picked is null then
    return null;
  end if;
  update public.redeem_codes
    set status = 'assigned', booking_id = p_booking, assigned_at = now()
    where id = picked
    returning code into picked_code;
  return picked_code;
end;
$$;

revoke all on function public.assign_redeem_code(uuid, text) from public, anon, authenticated;
