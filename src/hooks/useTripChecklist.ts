import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchChecklistState,
  fetchTourChecklistItems,
  saveChecklistState,
  saveTourChecklistItems,
} from "@/lib/checklistApi";
import { EMPTY_CHECKLIST_STATE, type ChecklistItem, type ChecklistState } from "@/lib/packingChecklist";

export const tripChecklistKeys = {
  items: (tourId: string) => ["tour-checklist-items", tourId] as const,
  state: (diverId: string, tourId: string) => ["tour-checklist-state", diverId, tourId] as const,
};

type SaveRequest = { next: ChecklistState; totalCount: number; checkedCount: number };

/** 강사 목록 + 본인 상태. 예약이 확인된 다이버만 켠다(enabled). */
export function useTripChecklist(tourId: string, diverId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const items = useQuery({
    queryKey: tripChecklistKeys.items(tourId),
    queryFn: () => fetchTourChecklistItems(tourId),
    enabled: enabled && !!tourId,
  });
  const state = useQuery({
    queryKey: tripChecklistKeys.state(diverId, tourId),
    queryFn: () => fetchChecklistState(diverId, tourId),
    enabled: enabled && !!tourId && !!diverId,
  });

  // 저장은 한 번에 하나씩 순서대로 보낸다. 각 차례에는 "지금까지 누른 결과 중 가장 최근 상태"를 보낸다.
  // 그래서 응답이 뒤섞여도 오래된 상태가 최신 상태를 덮어쓰지 않는다.
  const latest = useRef<SaveRequest | null>(null);
  // 가장 최근 상태(저장 전 포함). 렌더 시점의 값을 쓰면 빠른 연속 클릭에서 앞의 변경이 사라지므로 여기서 이어 붙인다.
  const live = useRef<ChecklistState | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const [pending, setPending] = useState(0);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const saveState = (req: SaveRequest): Promise<void> => {
    latest.current = req;
    queryClient.setQueryData<ChecklistState>(tripChecklistKeys.state(diverId, tourId), req.next);
    setPending((n) => n + 1);
    const job = chain.current.then(async () => {
      const toSend = latest.current ?? req;
      await saveChecklistState(diverId, tourId, toSend.next, { totalCount: toSend.totalCount, checkedCount: toSend.checkedCount });
      setSavedAt(Date.now());
    });
    chain.current = job.catch(async () => {
      // 저장이 실패하면 화면을 서버 값으로 되돌린다
      await queryClient.invalidateQueries({ queryKey: tripChecklistKeys.state(diverId, tourId) });
    });
    return job.finally(() => setPending((n) => n - 1));
  };

  /**
   * 상태를 바꾼다. mutate는 가장 최근 상태를 받아 새 상태를 돌려주고, countsOf는 저장할 집계를 계산한다.
   * 렌더 시점의 값이 아니라 가장 최근 상태에서 이어 붙이므로 빠른 연속 입력도 모두 남는다.
   */
  const updateState = (
    mutate: (prev: ChecklistState) => ChecklistState,
    countsOf: (next: ChecklistState) => { totalCount: number; checkedCount: number },
  ): Promise<void> => {
    const prev = live.current ?? (queryClient.getQueryData<ChecklistState>(tripChecklistKeys.state(diverId, tourId)) ?? EMPTY_CHECKLIST_STATE);
    const next = mutate(prev);
    live.current = next;
    return saveState({ next, ...countsOf(next) }).finally(() => {
      if (latest.current && latest.current.next === next) live.current = null;
    });
  };

  // 저장이 끝나기 전에 페이지를 떠나면 변경이 사라지므로 브라우저에 확인을 띄운다
  useEffect(() => {
    if (pending === 0) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pending]);

  return {
    items,
    state,
    updateState,
    saving: pending > 0,
    /** 마지막 저장이 성공한 시각. 변경이 없으면 null. */
    savedAt,
  };
}

/** 강사 편집기: 목록 조회와 저장. 저장 뒤 목록 쿼리를 다시 가져온다. */
export function useTourChecklistItems(tourId: string) {
  const queryClient = useQueryClient();
  const items = useQuery({
    queryKey: tripChecklistKeys.items(tourId),
    queryFn: () => fetchTourChecklistItems(tourId),
    enabled: !!tourId,
  });
  const save = useMutation({
    mutationFn: (next: ChecklistItem[]) => saveTourChecklistItems(tourId, next),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripChecklistKeys.items(tourId) }),
  });
  return { items, save };
}
