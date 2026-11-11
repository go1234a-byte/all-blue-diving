import { test } from "node:test";
import assert from "node:assert/strict";
import { countOpenToursByMonth, dayLabelKR, groupToursByStartDate, hasSeatsFor, isOpenTour, matchesActivity, topCountries } from "../src/lib/tours.ts";

// lib/dates 의 monthKeyOf 와 같은 규칙(연도*12+월). 이 테스트가 dates.ts 를 직접 import 하지 않도록 같은 식을 둔다.
const keyOf = (iso: string) => {
  const d = new Date(iso);
  return d.getFullYear() * 12 + d.getMonth();
};
const T = (startDate: string, status: "open" | "closed" = "open", adminStatus?: "suspended" | "held") => ({ startDate, status, adminStatus });

test("모집 중: open 이고 관리자 정지/보류가 아니어야 한다", () => {
  assert.equal(isOpenTour(T("2026-11-29")), true);
  assert.equal(isOpenTour(T("2026-11-29", "closed")), false);
  assert.equal(isOpenTour(T("2026-11-29", "open", "suspended")), false);
  assert.equal(isOpenTour(T("2026-11-29", "open", "held")), false);
});

test("월별 개수: 모집 중인 것만 세고, 연도가 다른 같은 월은 따로 센다", () => {
  const counts = countOpenToursByMonth(
    [T("2026-11-22"), T("2026-11-29"), T("2026-12-06"), T("2027-11-02"), T("2026-11-30", "closed"), T("2026-12-01", "open", "held")],
    keyOf,
  );
  assert.equal(counts.get(keyOf("2026-11-01")), 2);
  assert.equal(counts.get(keyOf("2026-12-01")), 1);
  assert.equal(counts.get(keyOf("2027-11-01")), 1);
  assert.equal(counts.size, 3);
});

test("투어가 없으면 빈 지도", () => {
  assert.equal(countOpenToursByMonth([], keyOf).size, 0);
});

test("활동 필터: 빈 값은 전체, 아니면 포함 여부", () => {
  assert.equal(matchesActivity({ activityTypes: ["scuba"] }, ""), true);
  assert.equal(matchesActivity({ activityTypes: ["scuba"] }, "scuba"), true);
  assert.equal(matchesActivity({ activityTypes: ["scuba"] }, "freediving"), false);
});

test("출발일별 묶음은 날짜 오름차순이고 같은 날짜는 한 묶음", () => {
  const g = groupToursByStartDate([{ startDate: "2026-12-06", id: "b" }, { startDate: "2026-11-29", id: "a" }, { startDate: "2026-12-06", id: "c" }]);
  assert.deepEqual(g.map((x) => [x.date, x.tours.map((t) => t.id)]), [["2026-11-29", ["a"]], ["2026-12-06", ["b", "c"]]]);
});

test("지역 칩: 투어 수 많은 순, 동률은 이름순, 최대 n개", () => {
  const r = topCountries([{ country: "일본" }, { country: "필리핀" }, { country: "필리핀" }, { country: "몰디브" }, { country: "" }], 2);
  assert.deepEqual(r, [{ country: "필리핀", count: 2 }, { country: "몰디브", count: 1 }]);
});

test("날짜 라벨은 요일까지 (2026-11-29 는 일요일)", () => {
  assert.equal(dayLabelKR("2026-11-29"), "11월 29일 일요일");
  assert.equal(dayLabelKR("2026-12-06T00:00:00Z"), "12월 6일 일요일");
});

test("인원 필터: 1명은 거르지 않고, 2명 이상은 남은 자리가 그 인원 이상일 때만", () => {
  const t = { maxParticipants: 10 };
  assert.equal(hasSeatsFor(t, 10, 1), true); // 마감이어도 1명 기본값에서는 목록에 남는다
  assert.equal(hasSeatsFor(t, 8, 2), true);
  assert.equal(hasSeatsFor(t, 9, 2), false);
  assert.equal(hasSeatsFor(t, 0, 10), true);
});

test("가이드 지역 지명: 가장 구체적인 지명, 괄호·일반어 제외, 제주도→제주", async () => {
  const { pointKeyword, toursAtPoint } = await import("../src/lib/tours.ts");
  assert.equal(pointKeyword("필리핀 · 세부 말라파스쿠아"), "말라파스쿠아");
  assert.equal(pointKeyword("필리핀 · 모알보알 (세부)"), "모알보알");
  assert.equal(pointKeyword("일본 · 게라마 제도 (오키나와 인근)"), "게라마");
  assert.equal(pointKeyword("대한민국 · 제주도"), "제주");
  assert.equal(pointKeyword("팔라우"), "팔라우");
  const tours = [
    { site: "세부 모알보알", title: "정어리떼 펀다이빙" },
    { site: "말라파스쿠아", title: "환도상어 투어" },
    { site: "서귀포", title: "제주 연산호 2박 3일" },
  ];
  assert.equal(toursAtPoint("필리핀 · 세부 말라파스쿠아", tours).length, 1);
  assert.equal(toursAtPoint("필리핀 · 모알보알 (세부)", tours).length, 1);
  assert.equal(toursAtPoint("대한민국 · 제주도", tours).length, 1);
});

test("검증된 수치: 지역마다 출처 2개 이상, 문구에 (예시) 없음", async () => {
  const { VERIFIED_WATER } = await import("../src/content/verifiedWater.ts");
  const rows = Object.entries(VERIFIED_WATER);
  assert.equal(rows.length, 55);
  for (const [id, v] of rows) {
    assert.ok(v.verified.sources.length >= 2, id);
    assert.ok(!v.water.includes("예시"), id);
  }
});
