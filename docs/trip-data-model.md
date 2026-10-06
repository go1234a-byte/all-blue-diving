# Trip 데이터 모델

Trip은 별도 테이블이 없다. **예약(bookings) + 투어(tours)** 가 Trip이다. 같은 정보를 두 번 저장하지 않기 위해서다.

## 테이블

### bookings (기존, 투어 앱)
- `id`, `tour_id`, `diver_id` (로그인 사용자 `auth.uid()` 문자열, 게스트는 연결 불가), `status`('confirmed' 등), `created_at`, ...

### tours (기존, 투어 앱)
- `id`, `title`, `country`, `site`, `start_date`, `end_date`, `meeting_point`, `status`('open' | 'closed' | 'cancelled'), `instructor_id`, ...

### tour_dive_plans (신규, 마이그레이션 `20261003010000`)
| 컬럼 | 의미 |
|---|---|
| tour_id | 투어 |
| dive_no | 투어 안의 다이브 번호 (투어별 유일) |
| planned_date | 예정 날짜 |
| planned_depth_m / planned_bottom_min | 계획 수심·시간 |
| gas, dive_type, notes | 가스, 종류, 메모 |

이 테이블은 "예정 다이빙(Dive Slot)"이다. 실제 감압 계산 입력이 아니다.

### tour_change_log (신규, 같은 마이그레이션)
- `tours`의 `start_date`, `end_date`, `meeting_point`, `status`가 바뀌면 트리거(`log_tour_change`, security definer)가 한 줄씩 기록한다.
- 클라이언트는 직접 쓸 수 없다 (쓰기 정책 없음).

### dive_logs (신규, 마이그레이션 `20261003000000`)
| 컬럼 | 의미 |
|---|---|
| id | 기록 UUID (클라이언트 생성, 중복 방지 키) |
| user_id | 기록한 사용자 |
| device_id | 기기 |
| booking_id | 연결된 여행 (없을 수 있음) |
| started_at, duration_sec, max_depth_m, avg_depth_m, water_temp_c, gas_name, algorithm | 요약 |
| payload | 전체 `DiveLogEntry` JSON (원본) |

### devices (신규, 같은 마이그레이션)
- 사용자별 기기. 컴패니언이 설치마다 UUID를 만들어 한 번 등록한다.

## 연결 규칙
1. **날짜 자동 연결**: 기록 날짜(한국 시간)가 예약 투어의 `start_date ~ end_date` 안이면 그 여행에 연결.
2. **직접 선택**: 업로드 화면에서 여행을 고르면 모든 기록을 그 여행에 연결.
3. **연결 안 함**: `booking_id`를 비운다.
4. 계획 비교: 같은 여행의 `planned_date`가 기록 날짜와 같은 첫 번째 계획과 비교.

## 상태 분리
- 투어 상태: `open`, `closed` (DB 제약). 취소는 `status = closed` + `cancelled_at` 날짜로 표시한다.
- 예약 상태: `confirmed`, `cancelled`, `cancel_pending_review` (투어 앱)
- 다이브 상태: 업로드 여부는 `dive_logs` 존재 여부로 판단 (별도 상태 칼럼 없음)
