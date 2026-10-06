import { supabase } from "@/integrations/supabase/client";
import {
  EMPTY_CHECKLIST_STATE,
  parseCustomItems,
  parseInstructorItems,
  type ChecklistItem,
  type ChecklistState,
} from "@/lib/packingChecklist";

/** PostgREST 오류를 Error로 바꿔 던진다. */
function check<T>(result: { data: T | null; error: { message: string } | null }): T | null {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

/** 강사가 등록한 준비물 목록(tours.checklist_items)을 검증해서 가져온다. */
export async function fetchTourChecklistItems(tourId: string): Promise<ChecklistItem[]> {
  const rows = check(await supabase.from("tours").select("checklist_items").eq("id", tourId));
  return parseInstructorItems(rows?.[0]?.checklist_items);
}

/**
 * 강사 편집기 저장. 다른 필드는 건드리지 않는다.
 * 그룹 값은 저장하지 않는다 (강사 항목은 항상 "강사님 요청").
 */
export async function saveTourChecklistItems(tourId: string, items: ChecklistItem[]): Promise<void> {
  check(
    await supabase.from("tours").update({
      checklist_items: items.map(({ key, label, required }) => ({ key, label, required })),
    }).eq("id", tourId),
  );
}

/** 본인의 준비물 상태 한 행. 행이 없으면 빈 상태 (아직 열어보지 않은 다이버). */
export async function fetchChecklistState(diverId: string, tourId: string): Promise<ChecklistState> {
  const rows = check(
    await supabase
      .from("tour_checklist_state")
      .select("checked_keys,hidden_keys,custom_items")
      .eq("diver_id", diverId)
      .eq("tour_id", tourId),
  );
  const row = rows?.[0];
  if (!row) return EMPTY_CHECKLIST_STATE;
  return {
    checkedKeys: row.checked_keys ?? [],
    hiddenKeys: row.hidden_keys ?? [],
    customItems: parseCustomItems(row.custom_items),
  };
}

/**
 * 상태와 함께 집계(total_count, checked_count)를 저장한다. 집계는 숨긴 항목을 뺀 병합 결과 기준이다.
 * 리마인드 대상 판단이 이 값을 쓰므로, 체크·숨김·추가할 때마다 같이 보낸다.
 */
export async function saveChecklistState(
  diverId: string,
  tourId: string,
  state: ChecklistState,
  counts: { totalCount: number; checkedCount: number },
): Promise<void> {
  check(
    await supabase.from("tour_checklist_state").upsert(
      {
        diver_id: diverId,
        tour_id: tourId,
        checked_keys: state.checkedKeys,
        hidden_keys: state.hiddenKeys,
        custom_items: state.customItems.map(({ key, label, group, required }) => ({ key, label, group, required })),
        total_count: counts.totalCount,
        checked_count: counts.checkedCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "diver_id,tour_id" },
    ),
  );
}
