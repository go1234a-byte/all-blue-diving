-- 코드에는 profiles/tour_cancellation_claims에 대한 postgres_changes 구독이 이미 있었지만,
-- 두 테이블 모두 supabase_realtime publication에 빠져있어서 실제로는 INSERT/UPDATE 이벤트가
-- 전혀 브로드캐스트되지 않고 있었다. 오늘 강사 "안내 남기기"가 작동 안 하는 버그를 조사하다가
-- 같은 근본원인(publication 누락)이 다른 테이블에도 있는지 전수확인해서 발견함.
-- - profiles 누락: 신규 강사/다이버 가입이 관리자 목록에 실시간으로 안 뜨던 문제(오늘 오전에
--   "고쳤다"고 했던 것이 실제로는 publication 미등록으로 인해 여전히 새로고침 전까지 반영 안 됐음).
-- - tour_cancellation_claims 누락: 오늘 신설한 강사 취소 증빙 제출/관리자 검토 기능도 동일하게
--   새로고침 없이는 실시간 반영이 안 되는 상태였음.
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.tour_cancellation_claims;
