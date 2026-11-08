-- 투어 상세에 보이는 안내 정보 3가지를 강사가 직접 적을 수 있게 한다. 모두 선택 입력이라 기존 투어는 비어 있고,
-- 비어 있으면 화면에 아무것도 보이지 않는다(예시 문구로 채우지 않는다). 수온·시야는 기존 water_temp_c / visibility_m 를 쓴다.
alter table public.tours add column if not exists dive_plan text;
alter table public.tours add column if not exists pickup_info text;
alter table public.tours add column if not exists onsite_cost_notes text;

comment on column public.tours.dive_plan is '다이빙 횟수·포인트 결정 방식 (강사 입력, 예: 총 6회, 포인트는 당일 컨디션에 따라 결정)';
comment on column public.tours.pickup_info is '픽업·이동 안내 (강사 입력, 예: 막탄 주요 호텔 픽업 포함, 공항·본섬은 추가 요금)';
comment on column public.tours.onsite_cost_notes is '현장 지불·팁 안내 (강사 입력, 예: 팁 2~3달러는 투어 종료 후 현지 지불)';
