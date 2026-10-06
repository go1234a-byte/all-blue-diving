# 다이빙 기록 동기화 프로토콜 (현재 구현)

## 흐름
```
워치 (실제 다이빙, 로컬 저장)
   │  WatchConnectivity (기존 WatchDiveLogQueue / WatchSyncService)
   ▼
아이폰 로컬 저장 (DiveSessionStore, JSON)
   │  사용자가 "다이빙 기록 올리기" 누름 (설정 → 계정)
   ▼
Supabase REST (URLSession, anon 키 + 사용자 토큰)
   ├─ devices  : resolution=ignore-duplicates (기기 1회 등록)
   └─ dive_logs: resolution=ignore-duplicates (id 기준, 한 건씩)
```

## 중복 방지
- 키는 `DiveLogEntry.id` (UUID). 같은 기록을 여러 번 올려도 한 줄만 남는다.
- 서버는 `Prefer: resolution=ignore-duplicates`로 응답하므로 재시도가 안전하다.

## 재시도
- 올린 기록 목록(`fetchUploadedLogs`)에 없는 기록만 "다이빙 기록 올리기"에 넘긴다.
- 실패한 기록은 다음 누름 때 자동으로 다시 시도된다.
- 네트워크가 없으면 로컬 기록은 그대로 남는다 (기록을 지우지 않는다).

## 토큰
- 액세스 토큰은 저장하지 않는다. 매번 리프레시 토큰으로 새로 받는다 (`AccountStore.accessToken()`).
- 리프레시 토큰은 Keychain에 저장한다.

## 아직 없는 것
- 백그라운드 자동 업로드 (지금은 사용자가 누를 때만)
- 부분 업로드 상태를 기록별로 보여주기
- 워치가 직접 업로드 (지금은 아이폰이 대신)
