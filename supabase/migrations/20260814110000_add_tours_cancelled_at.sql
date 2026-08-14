-- 강사 마이페이지/관리자 페이지에서 "취소"를 "마감"/"완료"와 구분해서 보여줄 방법이 없었다.
-- 취소 경로가 3곳(강사 자진 취소, 최소인원 미달 취소, 관리자 강제 정지)인데 전부
-- tours.status를 "closed"로만 바꿔서, 정상적으로 모집만 끝난 투어와 실제로 취소된
-- 투어를 구분할 방법이 없었다. 취소 시점에만 값이 채워지는 단일 필드로 명확히 구분한다.
alter table public.tours add column if not exists cancelled_at timestamptz;
