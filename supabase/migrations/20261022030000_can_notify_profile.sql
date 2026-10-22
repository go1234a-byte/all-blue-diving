-- send-push·send-email이 호출자 확인 없이 아무 회원에게나 임의 제목·본문을 보낼 수 있던 문제.
-- 두 함수는 이제 호출자 JWT로 이 함수를 불러 통과할 때만 발송한다.
--
-- 허용: 관리자, 본인, 예약으로 이어진 상대(다이버 ↔ 그 투어의 강사).
-- 앱의 알림 발송 지점(예약·후기·취소·중재·고객지원·인증 승인)은 모두 이 셋 중 하나다.

create or replace function public.can_notify_profile(p_target text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select auth.uid() is not null and (
    public.is_admin()
    or p_target = auth.uid()::text
    or exists (
      select 1
      from public.bookings b
      join public.tours t on t.id = b.tour_id
      join public.instructors i on i.id = t.instructor_id
      where (b.diver_id = auth.uid()::text and i.profile_id = p_target)
         or (b.diver_id = p_target and i.profile_id = auth.uid()::text)
    )
  );
$function$;

revoke all on function public.can_notify_profile(text) from public, anon;
grant execute on function public.can_notify_profile(text) to authenticated;
