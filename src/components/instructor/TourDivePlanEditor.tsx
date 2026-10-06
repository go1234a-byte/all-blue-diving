import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type PlanRow = {
  id: string;
  dive_no: number;
  planned_date: string;
  planned_depth_m: string;
  planned_bottom_min: string;
  gas: string;
  dive_type: string;
  notes: string;
};

const toRow = (r: {
  id: string;
  dive_no: number;
  planned_date: string | null;
  planned_depth_m: number | null;
  planned_bottom_min: number | null;
  gas: string | null;
  dive_type: string | null;
  notes: string;
}): PlanRow => ({
  id: r.id,
  dive_no: r.dive_no,
  planned_date: r.planned_date ?? "",
  planned_depth_m: r.planned_depth_m?.toString() ?? "",
  planned_bottom_min: r.planned_bottom_min?.toString() ?? "",
  gas: r.gas ?? "",
  dive_type: r.dive_type ?? "",
  notes: r.notes,
});

const toPayload = (r: PlanRow) => ({
  planned_date: r.planned_date || null,
  planned_depth_m: r.planned_depth_m ? Number(r.planned_depth_m) : null,
  planned_bottom_min: r.planned_bottom_min ? Number(r.planned_bottom_min) : null,
  gas: r.gas || null,
  dive_type: r.dive_type || null,
  notes: r.notes,
});

/** 강사가 투어의 예정 다이빙 계획을 등록하는 편집기. 여기서 적은 값은 참고용 계획이며 실제 다이빙 계산이 아니다. */
export const TourDivePlanEditor = ({ tourId }: { tourId: string }) => {
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("tour_dive_plans")
      .select("*")
      .eq("tour_id", tourId)
      .order("dive_no", { ascending: true });
    if (error) {
      setMessage("계획을 불러오지 못했습니다.");
      return;
    }
    setRows((data ?? []).map(toRow));
  };

  useEffect(() => {
    void load();
    // tourId가 바뀔 때만 다시 읽는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId]);

  const update = (id: string, patch: Partial<PlanRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addDive = async () => {
    setBusy(true);
    setMessage(null);
    const nextNo = rows.length ? Math.max(...rows.map((r) => r.dive_no)) + 1 : 1;
    const { error } = await supabase.from("tour_dive_plans").insert({ tour_id: tourId, dive_no: nextNo, notes: "" });
    setBusy(false);
    if (error) setMessage("다이브를 추가하지 못했습니다.");
    await load();
  };

  const save = async (row: PlanRow) => {
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.from("tour_dive_plans").update(toPayload(row)).eq("id", row.id);
    setBusy(false);
    setMessage(error ? "저장하지 못했습니다." : "저장했습니다.");
  };

  const remove = async (row: PlanRow) => {
    if (!window.confirm(`Dive #${row.dive_no} 계획을 삭제할까요?`)) return;
    setBusy(true);
    const { error } = await supabase.from("tour_dive_plans").delete().eq("id", row.id);
    setBusy(false);
    if (error) setMessage("삭제하지 못했습니다.");
    await load();
  };

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">예정 다이빙 계획</h2>
        <p className="text-xs text-muted-foreground">
          예약한 다이버에게 "예정 다이빙"으로 보입니다. 참고용 계획이며, 실제 감압 계산은 각자의 다이브 컴퓨터가 합니다.
        </p>
      </div>

      {rows.length === 0 && <p className="text-sm text-muted-foreground">아직 등록된 계획이 없습니다.</p>}

      {rows.map((r) => (
        <div key={r.id} className="space-y-2 rounded-lg border border-border p-3">
          <div className="text-sm font-semibold text-foreground">Dive #{r.dive_no}</div>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={r.planned_date} onChange={(e) => update(r.id, { planned_date: e.target.value })} />
            <Input placeholder="종류 (보트·비치·리프 등)" value={r.dive_type} onChange={(e) => update(r.id, { dive_type: e.target.value })} />
            <Input type="number" placeholder="계획 수심 (m)" value={r.planned_depth_m} onChange={(e) => update(r.id, { planned_depth_m: e.target.value })} />
            <Input type="number" placeholder="계획 시간 (분)" value={r.planned_bottom_min} onChange={(e) => update(r.id, { planned_bottom_min: e.target.value })} />
            <Input placeholder="가스 (예: EAN32)" value={r.gas} onChange={(e) => update(r.id, { gas: e.target.value })} />
          </div>
          <Input placeholder="메모 (조류, 시야 등)" value={r.notes} onChange={(e) => update(r.id, { notes: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => remove(r)} disabled={busy}>삭제</Button>
            <Button size="sm" onClick={() => save(r)} disabled={busy}>저장</Button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={addDive} disabled={busy}>+ 다이브 추가</Button>
        {message && <span className="text-xs text-muted-foreground">{message}</span>}
      </div>
    </section>
  );
};
