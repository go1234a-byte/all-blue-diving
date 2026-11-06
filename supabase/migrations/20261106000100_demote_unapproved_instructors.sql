-- 승인제 전환 전에 가입해 아직 승인받지 못한 강사를 다이버로 되돌린다. 신청 행(instructors)은 그대로
-- 두므로 관리자 승인 큐에 남고, 승인되면 다시 강사가 된다. 투어를 연 적이 있는 계정은 예약·정산이
-- 걸려 있을 수 있어 건드리지 않는다. 되돌릴 수 있도록 대상을 백업 테이블에 남긴다.
create table public._demoted_instructors_20261106 as
select p.id
from public.profiles p
where p.role = 'instructor'
  and not exists (
    select 1 from public.instructors i
    where i.profile_id = p.id::text and i.verified_status
  )
  and not exists (
    select 1 from public.tours t
    join public.instructors i on i.id = t.instructor_id
    where i.profile_id = p.id::text
  );

alter table public._demoted_instructors_20261106 enable row level security;

update public.profiles p
set role = 'diver'
from public._demoted_instructors_20261106 d
where p.id = d.id;
