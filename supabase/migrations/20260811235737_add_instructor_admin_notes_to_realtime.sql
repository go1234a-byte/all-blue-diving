-- "안내 남기기" 메시지를 보내도 화면에 실시간으로 뜨지 않던 버그의 원인.
-- instructor_admin_notes 테이블이 supabase_realtime publication에 빠져있어서
-- INSERT 이벤트가 구독 중인 클라이언트로 브로드캐스트되지 않았다 (arbitration_messages 등
-- 다른 실시간 테이블들은 이미 포함되어 있었음).
alter publication supabase_realtime add table public.instructor_admin_notes;
