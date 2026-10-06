-- security_definer views were writable via automatic-updatable-view rules and
-- readable by anon; masking logic lives inside the view (CASE + is_*() checks),
-- not RLS, so grants were the only thing standing between anon and other users'
-- booking/payout/profile data (and, via UPDATE/DELETE, write access bypassing RLS).

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.public_profiles, public.public_tour_booking_counts
  FROM anon, authenticated;

REVOKE ALL ON public.profiles_directory FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.profiles_directory FROM authenticated;

REVOKE ALL ON public.bookings_directory FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.bookings_directory FROM authenticated;

REVOKE ALL ON public.payouts_directory FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.payouts_directory FROM authenticated;
