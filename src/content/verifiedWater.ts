/**
 * 출처를 확인한 수온·시야 문구. 여기 있는 지역만 화면에 수치가 나간다(DivePoint.verified).
 * 출처 대부분이 여행·다이빙 업체 자료라 값이 서로 달라서, 출처 범위 안쪽의 "대략" 범위로만 쓴다.
 * 검토 기록: .planning/content-review/2026-11-08_검토요청.md
 * 새 지역 추가 = 출처 2개 이상 확인 → 여기 한 줄.
 */
const CHECKED = "2026-11-08";

export const VERIFIED_WATER: Record<string, { water: string; verified: { checkedAt: string; sources: string[] } }> = {
  jeju: {
    water: "성수기(6~11월) 수온 약 18–26°C · 겨울은 더 차가움 · 시야는 날마다 차이가 큼",
    verified: { checkedAt: CHECKED, sources: ["https://www.padi.com/diving-in/jeju-island/", "https://divebuddy.com/divesite/3090/jeju-skorea-south-korea"] },
  },
  kerama: {
    water: "수온 약 21–29°C · 시야 대략 20m 안팎",
    verified: { checkedAt: CHECKED, sources: ["https://dive-forecast.vercel.app/blog/kerama-vs-ishigaki", "https://dive-forecast.vercel.app/blog/kerama-water-temp", "https://www.traveldojo.com/kerama-islands"] },
  },
  moalboal: {
    water: "수온 약 26–30°C · 시야 대략 10–25m (건기에 더 맑음)",
    verified: { checkedAt: CHECKED, sources: ["https://divesitedirectory.co.uk/philippines_cebu_moalboal.html", "https://www.traveldojo.com/moalboal/"] },
  },
  malapascua: {
    water: "수온 약 25–29°C · 시야 대략 15–25m",
    verified: { checkedAt: CHECKED, sources: ["https://www.liveaboard.com/diving/season-calendar/best-time-to-dive-in-malapascua", "https://www.originaldiving.com/far-east/philippines/dive-malapascua/best-time"] },
  },
  coron: {
    water: "수온 약 27–30°C · 시야 대략 5–20m (포인트마다 차이가 큼)",
    verified: { checkedAt: CHECKED, sources: ["https://www.divessi.com/en/blog/scuba-diving-in-coron-guide-2387", "https://www.bluewaterdivetravel.com/coron-diving"] },
  },
  tulamben: {
    water: "수온 약 26–29°C · 시야 대략 12–25m",
    verified: { checkedAt: CHECKED, sources: ["https://dive-the-world.com/diving-sites-indonesia-bali-tulamben.php", "https://www.baliocean.com/blog/tulamben-dive-in-the-shadow-of-balis-holy-volcano"] },
  },
  similan: {
    water: "수온 약 27–29°C · 시야 대략 15–30m · 국립공원 개방기(대략 10월 중순~5월 중순)에만",
    verified: { checkedAt: CHECKED, sources: ["https://www.dive-the-world.com/posts/similans/similan-islands-liveaboard-a-week-of-wonder.php", "https://bluewaterdivetravel.com/node/6950"] },
  },
  maldives: {
    water: "수온 약 27–30°C · 시야 대략 15–30m (아톨·시기마다 차이)",
    verified: { checkedAt: CHECKED, sources: ["https://www.liveaboard.com/diving/season-calendar/best-time-to-dive-in-the-maldives", "https://bandosmaldives.com/news/the-best-time-for-diving-in-the-maldives-a-seasonal-guide/"] },
  },
};
