import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildOwnItem,
  buildPackingTemplate,
  daysUntil,
  EMPTY_CHECKLIST_STATE,
  mergeChecklist,
  MAX_INSTRUCTOR_ITEMS,
  MAX_OWN_ITEMS,
  parseCustomItems,
  parseInstructorItems,
  parseWaterTempInput,
  instructorCallName,
  rentalIncluded,
  suitHint,
} from "../src/lib/packingChecklist.ts";

test("T1 기본 템플릿: 활동 유형별 항목이 붙고 key는 중복되지 않는다", () => {
  const scuba = buildPackingTemplate(["scuba"]);
  assert.ok(scuba.some((i) => i.key === "passport"));
  assert.ok(scuba.some((i) => i.key === "mask"));
  assert.ok(!scuba.some((i) => i.key === "seasick"));

  const liveaboard = buildPackingTemplate(["scuba", "liveaboard"]);
  assert.ok(liveaboard.some((i) => i.key === "seasick"));

  const keys = liveaboard.map((i) => i.key);
  assert.equal(new Set(keys).size, keys.length);
});

test("T2 진행률 병합: 체크 수·전체 수·필수 미완료 수를 세고, 모르는 key는 무시한다", () => {
  const template = buildPackingTemplate(["scuba"]);
  const state = { ...EMPTY_CHECKLIST_STATE, checkedKeys: ["passport", "mask", "no-such-key"] };
  const { progress, items } = mergeChecklist(template, [], state);
  assert.equal(progress.total, template.length);
  assert.equal(progress.done, 2);
  assert.equal(items.find((i) => i.key === "passport")?.checked, true);
  const requiredTotal = template.filter((i) => i.required).length;
  assert.equal(progress.requiredLeft, requiredTotal - 2);
});

test("T3 강사 항목: 형식이 틀린 항목은 버리고, 그룹은 항상 '강사님 요청', 템플릿과 key가 겹치면 병합에서 템플릿이 우선", () => {
  const raw = [
    { key: "passport", label: "강사가 쓴 여권", required: false },
    { key: "", label: "빈 key" },
    { label: "key 없음" },
    { key: "pillow", label: "  베개  ", required: true, group: "gear" },
    null,
    "문자열",
  ];
  const parsed = parseInstructorItems(raw);
  assert.deepEqual(parsed.map((i) => i.key), ["passport", "pillow"]);
  assert.equal(parsed[1].label, "베개");
  assert.equal(parsed[1].required, true);
  assert.ok(parsed.every((i) => i.group === "instructor"));

  const many = Array.from({ length: MAX_INSTRUCTOR_ITEMS + 5 }, (_, n) => ({ key: `k${n}`, label: `항목 ${n}` }));
  assert.equal(parseInstructorItems(many).length, MAX_INSTRUCTOR_ITEMS);

  const merged = mergeChecklist(buildPackingTemplate(["scuba"]), parsed, EMPTY_CHECKLIST_STATE);
  assert.equal(merged.items.find((i) => i.key === "passport")?.label, "여권 또는 신분증");
});

test("T4 D-day: 날짜만 비교한다 (오늘 0, 7일 뒤 7, 지난 날은 음수)", () => {
  const today = new Date(2026, 9, 6, 23, 59);
  assert.equal(daysUntil("2026-10-06", today), 0);
  assert.equal(daysUntil("2026-10-13", today), 7);
  assert.equal(daysUntil("2026-10-01", today), -5);
  assert.equal(daysUntil("2026-10-07T00:00:00+09:00", today), 1);
});

test("T5 숨긴 항목은 진행률 분모에서 빠지고 hiddenItems로 따로 나온다", () => {
  const template = buildPackingTemplate(["scuba"]);
  const state = { ...EMPTY_CHECKLIST_STATE, hiddenKeys: ["fins", "towel"], checkedKeys: ["fins", "passport"] };
  const { progress, hiddenItems, items } = mergeChecklist(template, [], state);
  assert.equal(progress.total, template.length - 2);
  assert.equal(progress.done, 1);
  assert.deepEqual(hiddenItems.map((i) => i.key).sort(), ["fins", "towel"]);
  assert.ok(!items.some((i) => i.key === "fins"));
});

test("T6 본인 추가 항목: 공백은 거부, 이름은 자르고, 그룹은 '내가 추가한 항목'", () => {
  assert.equal(buildOwnItem("   "), null);
  const own = buildOwnItem("  텀블러  ", 1);
  assert.equal(own?.label, "텀블러");
  assert.equal(own?.group, "mine");
  const parsed = parseCustomItems([{ key: "own-1", label: "  우산 " }, { key: "", label: "x" }]);
  assert.deepEqual(parsed.map((i) => i.label), ["우산"]);
  const many = Array.from({ length: MAX_OWN_ITEMS + 3 }, (_, n) => ({ key: `o${n}`, label: `항목 ${n}` }));
  assert.equal(parseCustomItems(many).length, MAX_OWN_ITEMS);
});

test("T7 수온별 슈트 문구: 수온 미입력(0)이면 문구 없음, 구간별 문구", () => {
  assert.equal(suitHint(0), null);
  assert.equal(suitHint(-3), null);
  assert.match(suitHint(18) ?? "", /5mm/);
  assert.match(suitHint(22) ?? "", /3mm/);
  assert.match(suitHint(28) ?? "", /래시가드/);
});

test("T8 대여 포함 판정: '대여'가 명확히 있을 때만 true", () => {
  assert.equal(rentalIncluded(["장비 대여", "보트"]), true);
  assert.equal(rentalIncluded(["보트", "점심"]), false);
  assert.equal(rentalIncluded([]), false);
});

test("T9 예상 수온 입력: 비우면 0(모름), 0~40 숫자만 허용, 나머지는 null", () => {
  assert.equal(parseWaterTempInput(""), 0);
  assert.equal(parseWaterTempInput("  "), 0);
  assert.equal(parseWaterTempInput("22.6"), 23);
  assert.equal(parseWaterTempInput("0"), 0);
  assert.equal(parseWaterTempInput("40"), 40);
  assert.equal(parseWaterTempInput("41"), null);
  assert.equal(parseWaterTempInput("-1"), null);
  assert.equal(parseWaterTempInput("abc"), null);
});

test("T10 강사 호칭: 이름이 '강사'로 끝나면 떼고, 아니면 그대로", () => {
  assert.equal(instructorCallName("SEED 강사"), "SEED");
  assert.equal(instructorCallName("김해녀"), "김해녀");
  assert.equal(instructorCallName("강사"), "강사");
  assert.equal(instructorCallName("  박강사  "), "박");
});
