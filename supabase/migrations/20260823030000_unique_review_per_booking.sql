-- 프론트(BookingHistoryList)는 이미 리뷰가 있으면 "후기 작성" 버튼을 비활성화하지만,
-- 이건 클라이언트 상태 기준이라 더블클릭 레이스나 직접 REST 호출로는 우회된다.
-- reviews_insert_own RLS 정책도 예약당 개수를 제한하지 않아, 한 예약에 리뷰를 여러 개
-- 남겨 평점을 왜곡시킬 수 있었다. DB 레벨에서 예약당 리뷰 1개로 막는다.
alter table public.reviews
  add constraint reviews_booking_id_unique unique (booking_id);
