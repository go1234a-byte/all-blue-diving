-- 강사 투어 등록/수정 폼(TourCreateForm/TourEditForm)의 기본가 검증이 "빈 값인지"만
-- 확인하고 있어서, 0이나 음수 기본가로도 통과됐다(min/max 인원은 이미 >0 체크가 있는데
-- 기본가만 빠져 있었음). 프론트 검증은 우회 가능하므로(직접 API 호출 등) DB 레벨에서도 막는다.
alter table public.tours
  add constraint tours_base_price_positive check (base_price > 0);
