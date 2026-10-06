# 투어앱 알림 배포 체크리스트

순서를 지켜야 합니다. 각 단계는 앞 단계가 끝난 뒤에만 진행합니다.

## 사전 검증 (운영 적용 전)
- [ ] 로컬 Supabase에서 `supabase db reset` 후 `supabase/verify/seed_local.sql`, `supabase/verify/tour_alerts_verify.sql` 실행
- [ ] 검증 시나리오 S1–S23 모두 OK 확인 (실패하면 중단)
- [ ] `supabase gen types --local`로 `src/integrations/supabase/types.ts` 재생성 후, 알림 어댑터(`src/lib/alertsApi.ts`) 정리

## 배포 순서
1. **DB 적용**: 마이그레이션 파일을 하나씩 적용한다 (`db push` 사용 금지). 순서는 `20261006010000` → `20261006010100` → `20261006020000`.
2. **환경 변수 설정** (서버 전용, 값은 저장소에 기록하지 않는다): `NOTIFY_WEBHOOK_SECRET`, `CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
3. **main 병합 및 배포**: `feature/alerts-checklist`를 main에 병합하고 Vercel 배포 확인
4. **Database Webhook 생성**: `tour_diver_notifications` INSERT → `/api/notifications/dispatch`, 헤더 `x-notify-secret`
5. **end-to-end 테스트**: 테스트 찜 1건으로 알림 생성 → 푸시 수신 확인

## 후속 작업 후보 (이번 배포 범위 밖)
- 투어 `admin_status`가 정지·보류로 바뀔 때 예약자 안내 알림. 현재는 알림을 만들지 않는다. 앱에 이미 같은 안내가 있는지는 확인하지 않았고, 이번 범위(찜·구독·마감·준비물)에서 뺐다. 필요해지면 앱 안내 여부를 확인한 뒤 별도 명세로 추가한다.
