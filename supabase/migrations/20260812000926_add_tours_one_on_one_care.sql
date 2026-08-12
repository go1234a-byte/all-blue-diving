alter table public.tours add column if not exists one_on_one_care boolean not null default false;
comment on column public.tours.one_on_one_care is '강사가 이 투어를 1:1 전담 케어로 진행하는지 여부 (강사가 투어 생성/수정 시 직접 선택). 참일 때만 투어 상세 하이라이트에 "OO 강사 1:1 케어"를 노출한다.';
