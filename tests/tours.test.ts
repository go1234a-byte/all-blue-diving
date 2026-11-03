import { test } from "node:test";
import assert from "node:assert/strict";
import { countOpenToursByMonth, dayLabelKR, groupToursByStartDate, isOpenTour, matchesActivity, topCountries } from "../src/lib/tours.ts";

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
