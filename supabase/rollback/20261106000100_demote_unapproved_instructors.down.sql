update public.profiles p
set role = 'instructor'
from public._demoted_instructors_20261106 d
where p.id = d.id;

drop table public._demoted_instructors_20261106;
