# ALL BLUE (올블루)

스쿠버다이빙·프리다이빙 투어 예약 플랫폼 — https://allbluedive.com

## 개발

```bash
npm ci
npm run dev      # 로컬 개발 서버
npm test         # 단위 테스트
npm run build    # 운영 빌드
```

## 배포

- 웹: `main` 브랜치에 push 하면 Vercel이 자동 배포합니다.
- 앱: Capacitor(Android·iOS)로 웹 번들을 담아 스토어에 올립니다(`npx cap sync`).
- 데이터·로그인: Supabase, 결제: 토스페이먼츠.
