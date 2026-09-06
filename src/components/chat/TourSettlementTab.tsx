import { useMemo, useState } from "react";
import { Calculator, Check, Lock, Plus, Save, Trash2, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { formatKRW } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { Booking, SettlementDayEntry, Tour } from "@/types";

interface TourSettlementTabProps {
  tour: Tour;
  bookings: Booking[]; // 취소 제외 예약(강사=실명 / 다이버=마스킹된 명단)
  isInstructor: boolean;
}

interface Participant {
  id: string;
  name: string;
}

function calcSettlement(entries: SettlementDayEntry[], participants: Participant[]) {
  const perDay = entries.map((e) => {
    const total = e.expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const count = e.participantIds.length;
    return { dayNumber: e.dayNumber, total, count, perPerson: total / Math.max(1, count) };
  });
  const perParticipant = participants.map((p) => {
    const amount = entries.reduce((s, e) => {
      if (!e.participantIds.includes(p.id)) return s;
      const total = e.expenses.reduce((a, x) => a + (Number(x.amount) || 0), 0);
      return s + total / Math.max(1, e.participantIds.length);
    }, 0);
    return { ...p, amount };
  });
  return {
    perDay,
    perParticipant,
    grandTotal: perDay.reduce((s, d) => s + d.total, 0),
  };
}

const hasAnyExpense = (entries: SettlementDayEntry[]) => entries.some((e) => e.expenses.length > 0);

/** 채팅방 정산 — 강사가 일자별로 참여자를 클릭해 지출을 1/n 정산하고, 다이버가 확인한다. */
export function TourSettlementTab({ tour, bookings, isInstructor }: TourSettlementTabProps) {
  const {
    getTourSettlement,
    getSettlementConfirmations,
    saveTourSettlement,
    finalizeTourSettlement,
    reopenTourSettlement,
    confirmSettlement,
    unconfirmSettlement,
  } = useAppData();
  const { profile } = useRole();
  const { toast } = useToast();

  const settlement = getTourSettlement(tour.id);
  const finalized = !!settlement?.instructorSettledAt;
  const savedEntries = settlement?.entries ?? [];

  // 참가자 명단 (중복 예약 id 정리)
  const participants: Participant[] = useMemo(() => {
    const seen = new Set<string>();
    const list: Participant[] = [];
    for (const b of bookings) {
      if (seen.has(b.diverId)) continue;
      seen.add(b.diverId);
      list.push({ id: b.diverId, name: b.diverName || "참가자" });
    }
    return list;
  }, [bookings]);
  const allIds = participants.map((p) => p.id);

  const dayCount = useMemo(() => {
    if (tour.itineraryDays && tour.itineraryDays.length > 0) return tour.itineraryDays.length;
    const diff = Math.round((new Date(tour.endDate).getTime() - new Date(tour.startDate).getTime()) / 86400000) + 1;
    return Math.min(30, Math.max(1, Number.isFinite(diff) ? diff : 1));
  }, [tour.itineraryDays, tour.startDate, tour.endDate]);

  const buildEntries = (): SettlementDayEntry[] =>
    Array.from({ length: dayCount }, (_, i) => {
      const dayNumber = i + 1;
      const existing = savedEntries.find((e) => e.dayNumber === dayNumber);
      return existing
        ? {
            dayNumber,
            participantIds: [...(existing.participantIds ?? [])],
            expenses: (existing.expenses ?? []).map((x) => ({ ...x })),
          }
        : { dayNumber, participantIds: [...allIds], expenses: [] };
    });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SettlementDayEntry[]>(buildEntries);
  const [saving, setSaving] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [busy, setBusy] = useState(false);

  // "정산 재개" 후 눌러둔 이전 확인은 무효 — instructor_settled_at 이후의 확인만 유효로 친다.
  const settledAtMs = settlement?.instructorSettledAt ? new Date(settlement.instructorSettledAt).getTime() : 0;
  const confirmations = getSettlementConfirmations(tour.id).filter(
    (c) => new Date(c.confirmedAt).getTime() >= settledAtMs,
  );
  const confirmedIds = new Set(confirmations.map((c) => c.diverId));
  const iConfirmed = !!profile?.id && confirmedIds.has(profile.id);
  const totalDivers = participants.length;
  const confirmedCount = participants.filter((p) => confirmedIds.has(p.id)).length;

  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? "참가자";

  const startEditing = () => {
    setDraft(buildEntries());
    setShowResult(false);
    setEditing(true);
  };

  const patchExpense = (dayIdx: number, expIdx: number, patch: Partial<{ label: string; amount: number }>) =>
    setDraft((prev) =>
      prev.map((d, i) =>
        i === dayIdx ? { ...d, expenses: d.expenses.map((x, j) => (j === expIdx ? { ...x, ...patch } : x)) } : d,
      ),
    );
  const addExpense = (dayIdx: number) =>
    setDraft((prev) =>
      prev.map((d, i) => (i === dayIdx ? { ...d, expenses: [...d.expenses, { label: "", amount: 0 }] } : d)),
    );
  const removeExpense = (dayIdx: number, expIdx: number) =>
    setDraft((prev) =>
      prev.map((d, i) => (i === dayIdx ? { ...d, expenses: d.expenses.filter((_, j) => j !== expIdx) } : d)),
    );
  const toggleParticipant = (dayIdx: number, id: string) =>
    setDraft((prev) =>
      prev.map((d, i) => {
        if (i !== dayIdx) return d;
        const on = d.participantIds.includes(id);
        return { ...d, participantIds: on ? d.participantIds.filter((x) => x !== id) : [...d.participantIds, id] };
      }),
    );

  const cleanedDraft = (): SettlementDayEntry[] =>
    draft.map((d) => ({
      dayNumber: d.dayNumber,
      participantIds: d.participantIds.filter((id) => allIds.includes(id)),
      expenses: d.expenses
        .filter((x) => x.label.trim() !== "" || (Number(x.amount) || 0) !== 0)
        .map((x) => ({ label: x.label.trim(), amount: Number(x.amount) || 0 })),
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTourSettlement(tour.id, cleanedDraft());
      toast({ title: "정산 내역이 저장되었습니다" });
      setEditing(false);
      setShowResult(true);
    } catch (err) {
      toast({
        title: "저장에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const run = async (fn: () => Promise<void>, failTitle: string) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast({
        title: failTitle,
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const resultEntries: SettlementDayEntry[] = editing ? cleanedDraft() : savedEntries;
  const result = calcSettlement(resultEntries, participants);
  const myAmount = result.perParticipant.find((p) => p.id === profile?.id)?.amount ?? 0;

  const ResultPanel = () => (
    <Card className="border-primary/40">
      <CardContent className="space-y-2 p-4">
        <p className="text-sm font-semibold text-foreground">정산 결과 (일자별 참여자 1/n 후 합산)</p>
        <div className="space-y-1">
          {result.perDay.map((d) => (
            <div key={d.dayNumber} className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{d.dayNumber}일차 · {formatKRW(d.total)} ÷ {d.count}명</span>
              <span className="font-medium text-foreground">{formatKRW(Math.round(d.perPerson))}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
          <span className="text-muted-foreground">전체 지출 총액</span>
          <span className="font-medium text-foreground">{formatKRW(result.grandTotal)}</span>
        </div>
        <div className="space-y-1 border-t border-border pt-2">
          <p className="text-xs font-semibold text-foreground">참가자별 정산 금액</p>
          {result.perParticipant.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm text-foreground">{p.name}</span>
              <span className="text-sm font-bold text-primary">{formatKRW(Math.round(p.amount))}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // ── 다이버(읽기 전용) ─────────────────────────────────────────────
  if (!isInstructor) {
    if (!finalized) {
      return <p className="py-16 text-center text-sm text-muted-foreground">강사가 아직 정산을 마감하지 않았습니다.</p>;
    }
    const empty = !hasAnyExpense(savedEntries);
    return (
      <div className="space-y-3">
        {empty ? (
          <p className="py-10 text-center text-sm text-muted-foreground">정산 내역 없음</p>
        ) : (
          <>
            <ResultPanel />
            <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
              <span className="font-medium text-foreground">내 정산 금액</span>
              <span className="font-bold text-primary">{formatKRW(Math.round(myAmount))}</span>
            </div>
          </>
        )}
        {iConfirmed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-sm font-medium text-primary">
              <Check className="h-4 w-4" />
              정산 확인 완료
            </div>
            <p className="text-center text-xs text-muted-foreground">전체 {confirmedCount}/{totalDivers}명 확인</p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              disabled={busy}
              onClick={() => run(() => unconfirmSettlement(tour.id), "확인 취소에 실패했습니다")}
            >
              확인 취소
            </Button>
          </div>
        ) : (
          <Button
            className="w-full gap-1.5"
            disabled={busy}
            onClick={() => run(() => confirmSettlement(tour.id), "정산 확인에 실패했습니다")}
          >
            <Check className="h-4 w-4" />
            정산 확인
          </Button>
        )}
        <p className="break-keep rounded-lg bg-secondary/50 px-3 py-2 text-center text-[11px] text-muted-foreground">
          참가자 전원이 확인하면 48시간 뒤 채팅방이 자동으로 삭제됩니다.
        </p>
      </div>
    );
  }

  // ── 강사: 마감됨 ─────────────────────────────────────────────────
  if (finalized) {
    const empty = !hasAnyExpense(savedEntries);
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
          <Lock className="h-3.5 w-3.5" />
          {confirmedCount >= totalDivers && totalDivers > 0
            ? "정산 마감 · 참가자 전원 확인 완료"
            : "정산이 마감되었습니다 · 참가자 확인 대기 중"}
        </div>
        {empty ? <p className="py-6 text-center text-sm text-muted-foreground">정산 내역 없음</p> : <ResultPanel />}
        <Card>
          <CardContent className="space-y-1.5 p-4">
            <p className="text-sm font-semibold text-foreground">참가자 확인 현황 {confirmedCount}/{totalDivers}명</p>
            {participants.length === 0 ? (
              <p className="text-xs text-muted-foreground">예약한 참가자가 없습니다.</p>
            ) : (
              participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{p.name}</span>
                  {confirmedIds.has(p.id) ? (
                    <span className="flex items-center gap-1 font-medium text-primary">
                      <Check className="h-3 w-3" /> 확인 완료
                    </span>
                  ) : (
                    <span className="text-muted-foreground">대기 중</span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-1.5" disabled={busy}>
              <Unlock className="h-3.5 w-3.5" />
              정산 재개 (수정)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정산을 다시 열까요?</AlertDialogTitle>
              <AlertDialogDescription>
                마감을 되돌리면 참가자들이 이미 누른 정산 확인 기록이 모두 삭제되고, 다시 확인을 받아야 합니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={() => run(() => reopenTourSettlement(tour.id), "정산 재개에 실패했습니다")}>
                정산 재개
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ── 강사: 편집 모드 ─────────────────────────────────────────────
  if (editing) {
    return (
      <div className="space-y-3">
        {participants.length === 0 && (
          <p className="rounded-lg bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
            아직 예약한 참가자가 없어 정산 대상이 없습니다.
          </p>
        )}
        {draft.map((day, dayIdx) => (
          <Card key={day.dayNumber}>
            <CardContent className="space-y-2.5 p-3">
              <p className="text-sm font-semibold text-foreground">{day.dayNumber}일차</p>

              {day.expenses.map((exp, expIdx) => (
                <div key={expIdx} className="flex items-center gap-1.5">
                  <Input
                    placeholder="항목 (예: 숙박, 보트)"
                    value={exp.label}
                    onChange={(e) => patchExpense(dayIdx, expIdx, { label: e.target.value })}
                    className="h-8 flex-1 text-sm"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="금액"
                    value={exp.amount === 0 ? "" : exp.amount}
                    onChange={(e) => patchExpense(dayIdx, expIdx, { amount: Number(e.target.value) || 0 })}
                    className="h-8 w-24 text-right text-sm"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-destructive"
                    onClick={() => removeExpense(dayIdx, expIdx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs"
                onClick={() => addExpense(dayIdx)}
              >
                <Plus className="h-3.5 w-3.5" />
                지출 항목 추가
              </Button>

              <div className="space-y-1.5 border-t border-border pt-2">
                <p className="text-xs text-muted-foreground">
                  이 날 참여자 <span className="font-medium text-foreground">{day.participantIds.length}명</span> · 눌러서 포함/제외
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {participants.map((p) => {
                    const on = day.participantIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleParticipant(dayIdx, p.id)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs transition-colors",
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground",
                        )}
                      >
                        {on && <Check className="mr-1 inline h-3 w-3" />}
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button type="button" variant="secondary" size="sm" className="w-full gap-1.5" onClick={() => setShowResult((v) => !v)}>
          <Calculator className="h-3.5 w-3.5" />
          {showResult ? "정산 결과 접기" : "정산하기"}
        </Button>
        {showResult && <ResultPanel />}

        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            취소
          </Button>
          <Button size="sm" className="gap-1.5" disabled={saving} onClick={handleSave}>
            <Save className="h-3.5 w-3.5" />
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    );
  }

  // ── 강사: 기본(작성 전/후, 마감 전) ─────────────────────────────
  const empty = !hasAnyExpense(savedEntries);
  return (
    <div className="space-y-3">
      {empty ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          아직 작성된 정산 내역이 없습니다. 투어 일자별로 지출과 참여자를 입력해보세요.
        </p>
      ) : (
        savedEntries.map((day) => {
          const dayTotal = day.expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
          return (
            <Card key={day.dayNumber}>
              <CardContent className="space-y-1 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{day.dayNumber}일차</p>
                  <p className="text-xs text-muted-foreground">{day.participantIds.length}명 참여</p>
                </div>
                {day.expenses.map((x, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{x.label || "(미입력)"}</span>
                    <span>{formatKRW(Number(x.amount) || 0)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border pt-1 text-xs font-medium text-foreground">
                  <span>일 합계</span>
                  <span>{formatKRW(dayTotal)}</span>
                </div>
                <p className="pt-1 text-[11px] text-muted-foreground">
                  참여: {day.participantIds.map(nameOf).join(", ") || "없음"}
                </p>
              </CardContent>
            </Card>
          );
        })
      )}

      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={startEditing}>
          {empty ? "내역 작성" : "내역 수정"}
        </Button>
        {!empty && (
          <Button size="sm" variant="secondary" className="flex-1 gap-1.5" onClick={() => setShowResult(true)}>
            <Calculator className="h-3.5 w-3.5" />
            정산하기
          </Button>
        )}
      </div>

      {showResult && !empty && <ResultPanel />}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="w-full gap-1.5" disabled={busy}>
            <Lock className="h-4 w-4" />
            정산 완료
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정산을 마감할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              마감하면 내역이 잠기고 참가자에게 정산 확인 요청이 전달됩니다. 이후 수정하려면 "정산 재개"를 눌러야 합니다.
              {empty && " (현재 작성된 지출 내역이 없어 '정산 내역 없음'으로 마감됩니다.)"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => run(() => finalizeTourSettlement(tour.id, savedEntries), "정산 완료 처리에 실패했습니다")}
            >
              정산 완료
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
