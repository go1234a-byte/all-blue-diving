/**
 * 출처를 확인한 수온·시야 문구. 여기 있는 지역만 화면에 수치가 나간다(DivePoint.verified).
 * 출처 대부분이 여행·다이빙 업체 자료라 값이 서로 달라서, 출처 범위 안쪽의 "대략" 범위로만 쓴다.
 * 검토 기록: .planning/content-review/2026-11-08_검토요청.md
 * 새 지역 추가 = 출처 2개 이상 확인 → 여기 한 줄.
 */
const CHECKED = "2026-11-08";
/** 2차 확인 — 검토 기록: .planning/content-review/2026-11-11_검토요청_2차.md */
const CHECKED_2 = "2026-11-11";
/** 3차 확인 — 검토 기록: .planning/content-review/2026-11-11_검토요청_3차.md */
const CHECKED_3 = "2026-11-11";
/** 4차 확인 — 검토 기록: .planning/content-review/2026-11-11_검토요청_4차.md */
const CHECKED_4 = "2026-11-11";

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
  tubbataha: {
    water: "수온 약 27–30°C · 시야 대략 20–30m 이상 · 3월 중순~6월 중순에만 리브어보드로 들어갈 수 있음",
    verified: { checkedAt: CHECKED_3, sources: ["https://www.liveaboard.com/diving/season-calendar/best-time-to-dive-in-tubbataha", "https://www.bluewaterdivetravel.com/exploring-tubbataha-reef", "https://www.dive-the-world.com/posts/tubbataha/diving-best-time-of-year.php"] },
  },
  rajaampat: {
    water: "수온 약 27–30°C · 시야 대략 15–30m (10~4월이 더 맑음, 5~9월은 낮아짐)",
    verified: { checkedAt: CHECKED_3, sources: ["https://www.bluewaterdivetravel.com/article/raja-ampat-dive-season-explained", "https://www.liveaboard.com/diving/season-calendar/best-time-to-dive-in-raja-ampat-indonesia", "https://diveadventures.com.au/?p=1917"] },
  },
  lembeh: {
    water: "수온 약 25–29°C (7~8월이 낮음) · 시야 대략 5–15m (마크로 포인트 기준)",
    verified: { checkedAt: CHECKED_3, sources: ["https://blog.padi.com/diving-in-lembeh/", "https://zubludiving.com/destination/indonesia/north-sulawesi/lembeh-strait", "https://www.dive-the-world.com/posts/sulawesi/diving-lembeh-seasonal-macro-guide.php"] },
  },
  subic: {
    water: "수온 약 26–29°C · 시야는 포인트·날씨에 따라 대략 5–20m (만 안쪽 난파선이 낮음)",
    verified: { checkedAt: CHECKED_3, sources: ["https://www.undercurrent.org/UCnow/dive_reviews/Philippines/BoardwalkDivecenter_SubicBay_report_5904.html", "https://undercurrent.org/UCnow/dive_reviews/Philippines/Vascots_SubicBay_report_5995.html", "https://divezone.net/?p=2127"] },
  },
  xiaoliuqiu: {
    water: "수온 약 22–29°C (겨울이 낮음) · 시야 대략 10–20m (맑은 여름날은 더 좋음)",
    verified: { checkedAt: CHECKED_3, sources: ["https://www.twosevenths.com/en/outdoors/diving-liuqiu-travel/", "https://taiwanoutdoors.com/diving/dive-sites/xiaoliuqiu", "https://xray-mag.com/content/dive-taiwan-xiaoliuqiu"] },
  },
  taiwan_islands: {
    water: "수온 약 21–29°C (겨울이 낮음) · 시야 대략 15–30m 이상 (란위가 더 맑은 편)",
    verified: { checkedAt: CHECKED_3, sources: ["https://taiwanoutdoors.com/diving/dive-sites/green-island", "https://bluetrend-main.pages.dev/en/taiwan-diving-spot-island/", "https://scubaboard.com/community/threads/taiwan-orchid-island-trip-report.330218"] },
  },
  yonaguni: {
    water: "수온 약 21–29°C (겨울 귀상어 시즌은 23–24°C 안팎) · 시야는 날마다 차이가 큼",
    verified: { checkedAt: CHECKED_3, sources: ["https://dive-forecast.vercel.app/blog/yonaguni", "https://www.insidejapantours.com/themes-d/diving/yonaguni/", "https://oktodive.pages.dev/dive-sites/yonaguni"] },
  },
  ogasawara: {
    water: "수온 약 19–28°C (겨울이 낮음) · 시야 대략 20m 이상 (초여름~가을이 안정적)",
    verified: { checkedAt: CHECKED_3, sources: ["https://saiyu.co.jp/en/itinerary/IJTY13", "https://www.uwphotographyguide.com/ogasawara-islands-dive-trip/", "https://oktodive.pages.dev/dive-sites/ogasawara"] },
  },
  izu_mikomoto: {
    water: "시즌(6~10월) 수온 약 21–28°C · 시야는 쿠로시오 해류에 따라 크게 달라짐 · 조류가 강해 경험 필요",
    verified: { checkedAt: CHECKED_3, sources: ["https://dive-forecast.vercel.app/blog/mikomoto", "https://en.marinediving.com/area/mikomoto/", "https://www.freedomdive.com/en/dive_location/mikomoto"] },
  },
  maldives_baa: {
    water: "수온 약 27–29°C · 시야 대략 15–25m (만타 시즌인 우기엔 낮아짐) · 하니파루 베이 안은 스노클만 가능",
    verified: { checkedAt: CHECKED_4, sources: ["https://www.padi.com/dive-site/maldives/hanifaru-bay/", "https://dive-the-world.com/diving-sites-maldives-northern-atolls-baa-atoll.php", "https://www.liveaboard.com/diving/season-calendar/best-time-to-dive-in-the-maldives"] },
  },
  redsea: {
    water: "수온 약 22–29°C (겨울이 낮고 8월이 가장 따뜻함) · 시야 대략 20–30m",
    verified: { checkedAt: CHECKED_4, sources: ["https://routri.com/travel-inspiration/red-sea-water-temperature", "https://www.liveaboard.com/diving/season-calendar/best-time-to-dive-in-the-red-sea", "https://www.dive-the-world.com/posts/egypt/when-and-where-diving-in-egypt-red-sea.php"] },
  },
  redsea_north: {
    water: "겨울 수온 약 21–24°C (더 낮은 날도 있음) · 여름 26–29°C · 시야 대략 20–30m",
    verified: { checkedAt: CHECKED_4, sources: ["https://www.liveaboard.com/diving/season-calendar/best-time-to-dive-in-the-red-sea", "https://www.dive-the-world.com/posts/egypt/when-and-where-diving-in-egypt-red-sea.php", "https://www.inyourpocket.com/egypt/articles/diving-the-red-sea-best-sites-from-sharm-el-sheikh", "https://www.scubadiving.com/travel/red-sea/red-sea-travel-guide-2001"] },
  },
  sudan: {
    water: "수온 약 26–30°C · 시야 대략 20–30m 이상 (11~6월이 더 맑음)",
    verified: { checkedAt: CHECKED_4, sources: ["https://travel.padi.com/d/sudan", "https://www.bluewaterdivetravel.com/sudan-diving", "https://www.dive-the-world.com/liveaboards-red-sea-sudan.php"] },
  },
  gbr: {
    water: "수온 약 24–29°C (6~8월이 낮음) · 시야 대략 15–20m, 좋은 날은 30m",
    verified: { checkedAt: CHECKED_4, sources: ["https://www.diversden.com.au/travel-guide/weather/", "https://www.dive-the-world.com/posts/gbr/diving-in-the-great-barrier-reef-australia-best-months-clear-visibility.php", "https://www.spiritoffreedom.com.au/diving-the-great-barrier-reef/dive-seasons-weather/"] },
  },
  ningaloo: {
    water: "수온 약 21–28°C · 시야 대략 10–20m · 고래상어는 스노클로만 만남",
    verified: { checkedAt: CHECKED_4, sources: ["https://www.padi.com/diving-in/australia/exmouth/", "https://diveadventures.com.au/?p=1903", "https://scubaboard.com/community/threads/exmouth-australia-april-6-12-2025-ningaloo.660784"] },
  },
  fiji: {
    water: "수온 약 23–29°C (5~10월이 낮음) · 시야 대략 20m 이상 (건기가 더 맑음)",
    verified: { checkedAt: CHECKED_4, sources: ["https://bluewaterdivetravel.com/fiji-diving", "https://www.liveaboard.com/diving/season-calendar/best-time-to-dive-in-fiji", "https://divezone.net/?p=21331"] },
  },
  seychelles: {
    water: "수온 약 25–29°C (6~8월이 낮음) · 시야 대략 10–30m (4~5월·10~11월이 가장 맑음)",
    verified: { checkedAt: CHECKED_4, sources: ["https://koek.sc/seychelles-diving-guide/seychelles-diving-season", "https://www.bluewaterdivetravel.com/seychelles-diving", "https://www.scubadiving.com/scuba-diving-seychelles"] },
  },
  oman: {
    water: "수온 약 22–31°C (겨울이 낮음) · 시야 대략 10–25m (여름 플랑크톤 철엔 낮아짐)",
    verified: { checkedAt: CHECKED_4, sources: ["https://canvascluboman.com/en/blog/diving-in-oman", "https://divernet.com/world-dives/daymaniyat-islands-diving-in-oman/", "https://starfish.ch/dive/Oman.html"] },
  },
  malta: {
    water: "수온 약 14–27°C (2~3월이 가장 낮음) · 시야 대략 20–30m (고조가 더 맑음)",
    verified: { checkedAt: CHECKED_4, sources: ["https://divesitedirectory.co.uk/malta.html", "https://divebooker.com/malta-daz3923", "https://www.bluewaterdivetravel.com/malta-diving"] },
  },
};
