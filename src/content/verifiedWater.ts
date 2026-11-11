/**
 * 출처를 확인한 수온·시야 문구. 여기 있는 지역만 화면에 수치가 나간다(DivePoint.verified).
 * 출처 대부분이 여행·다이빙 업체 자료라 값이 서로 달라서, 출처 범위 안쪽의 "대략" 범위로만 쓴다.
 * 검토 기록: .planning/content-review/2026-11-08_검토요청.md
 * 새 지역 추가 = 출처 2개 이상 확인 → 여기 한 줄.
 */
const CHECKED = "2026-11-08";
/** 2차 확인 — 검토 기록: .planning/content-review/2026-11-11_검토요청_2차.md */
const CHECKED_2 = "2026-11-11";

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
  palau: {
    water: "수온 약 27–30°C · 시야 대략 15–30m (건기에 더 맑음)",
    verified: { checkedAt: CHECKED_2, sources: ["https://www.liveaboard.com/diving/season-calendar/best-time-to-dive-in-palau", "https://www.bluewaterdivetravel.com/palau-scuba-diving-travel", "https://dive-the-world.com/diving-sites-palau.php"] },
  },
  ulleung: {
    water: "여름 수온 약 20–26°C · 겨울은 훨씬 차가움 · 시야는 날마다 차이가 큼",
    verified: { checkedAt: CHECKED_2, sources: ["https://www.koreaherald.com/article/10549294", "https://seatemperatures.net/asia/south-korea/ulleungdo-august-temperature/", "https://www.seoulz.com/korea-scuba-diving/"] },
  },
  ishigaki: {
    water: "수온 약 21–29°C (겨울이 낮음) · 시야 대략 20m 안팎",
    verified: { checkedAt: CHECKED_2, sources: ["https://dive-forecast.vercel.app/en/blog/ishigaki", "https://dive-forecast.vercel.app/blog/ishigaki-water-temp", "https://www.primescuba-ishigaki.com/en/?p=30594"] },
  },
  miyako: {
    water: "수온 약 21–29°C (겨울이 낮음) · 시야는 날마다 차이가 큼",
    verified: { checkedAt: CHECKED_2, sources: ["https://en.japantravel.com/okinawa/miyakojima-a-diver-s-paradise/3872", "https://en.activityjapan.com/feature/january-okinawa-diving"] },
  },
  anilao: {
    water: "수온 약 24–28°C · 시야 대략 10–20m (7~9월은 낮음)",
    verified: { checkedAt: CHECKED_2, sources: ["https://www.dive-the-world.com/diving-sites-philippines-batangas.php", "https://www.bluewaterdivetravel.com/anilao-diving"] },
  },
  apo_dumaguete: {
    water: "수온 약 25–30°C · 시야 대략 10–25m (건기에 더 맑음)",
    verified: { checkedAt: CHECKED_2, sources: ["https://www.bluewaterdivetravel.com/dumaguete-diving", "https://www.dive-the-world.com/diving-sites-philippines-dumaguete-apo-island.php"] },
  },
  puerto_galera: {
    water: "수온 약 25–29°C · 시야 대략 10–20m",
    verified: { checkedAt: CHECKED_2, sources: ["https://diveadventures.com.au/?p=1953", "https://underwaterasia.info/philippines/puerto-galera-dive-guide"] },
  },
  boracay: {
    water: "수온 약 25–29°C · 시야 대략 10–25m (12~2월은 낮을 수 있음)",
    verified: { checkedAt: CHECKED_2, sources: ["https://blog.padi.com/philippines-diving-calendar-where-to-dive-december/", "https://divezone.net/?p=907", "https://scubago.com/south-east-asia/philippines/visayas/boracay"] },
  },
  sipadan: {
    water: "수온 약 27–30°C · 시야 대략 15–30m · 하루 입장 허가 인원이 제한됨",
    verified: { checkedAt: CHECKED_2, sources: ["https://www.dive-the-world.com/posts/sipadan/best-time-for-sipadan-diving-optimal-conditions.php", "https://www.bluewaterdivetravel.com/sipadan-diving", "https://www.divessi.com/en/blog/guide-to-scuba-diving-in-sipadan-1483"] },
  },
  komodo: {
    water: "북부 수온 약 27–29°C, 남부는 20°C 안팎까지 낮아짐 · 시야 대략 10–30m",
    verified: { checkedAt: CHECKED_2, sources: ["https://www.liveaboard.com/diving/season-calendar/best-time-to-dive-in-komodo-indonesia", "https://www.komodoresort.com/komodo-diving/conditions/", "https://www.bluewaterdivetravel.com/komodo-diving"] },
  },
};
