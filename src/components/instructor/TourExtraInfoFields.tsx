import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ExtraInfoValues {
  waterTempC: string;
  visibilityM: string;
  divePlan: string;
  pickupInfo: string;
  onsiteCostNotes: string;
}

export const EMPTY_EXTRA_INFO: ExtraInfoValues = { waterTempC: "", visibilityM: "", divePlan: "", pickupInfo: "", onsiteCostNotes: "" };

/** 투어 등록·수정 폼 공용. 모두 선택 입력이고, 비워 두면 상세 화면에 아무것도 보이지 않는다. */
export function TourExtraInfoFields({ value, onChange }: { value: ExtraInfoValues; onChange: (next: ExtraInfoValues) => void }) {
  const set = (k: keyof ExtraInfoValues) => (v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">다이빙 조건·안내 (선택)</h3>
        <p className="text-xs text-muted-foreground">적어 주시면 투어 상세와 목록에 그대로 보여요. 모르는 값은 비워 두세요.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="x-temp">평균 수온 (°C)</Label>
          <Input id="x-temp" inputMode="decimal" value={value.waterTempC} onChange={(e) => set("waterTempC")(e.target.value.replace(/[^\d.]/g, ""))} placeholder="예: 27" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="x-vis">평균 시야 (m)</Label>
          <Input id="x-vis" inputMode="decimal" value={value.visibilityM} onChange={(e) => set("visibilityM")(e.target.value.replace(/[^\d.]/g, ""))} placeholder="예: 20" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="x-plan">다이빙 횟수·포인트 결정 방식</Label>
        <Textarea id="x-plan" rows={2} maxLength={300} value={value.divePlan} onChange={(e) => set("divePlan")(e.target.value)} placeholder="예: 총 6회 다이빙. 포인트는 당일 바다 컨디션에 따라 가이드가 정해요." />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="x-pickup">픽업·이동 안내</Label>
        <Textarea id="x-pickup" rows={2} maxLength={300} value={value.pickupInfo} onChange={(e) => set("pickupInfo")(e.target.value)} placeholder="예: 막탄 주요 호텔 픽업 포함. 공항·세부 본섬은 추가 요금이 있어요." />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="x-cost">현장 지불·팁 안내</Label>
        <Textarea id="x-cost" rows={2} maxLength={300} value={value.onsiteCostNotes} onChange={(e) => set("onsiteCostNotes")(e.target.value)} placeholder="예: 매너 팁 2~3달러는 투어 종료 후 현지에서 지불해 주세요." />
      </div>
    </div>
  );
}

/** 폼 문자열 → 저장값. 숫자가 아니거나 0 이하면 0(= 정보 없음). */
export function extraInfoToPayload(v: ExtraInfoValues) {
  const num = (s: string) => { const n = Number(s); return Number.isFinite(n) && n > 0 ? n : 0; };
  return { waterTempC: num(v.waterTempC), visibilityM: num(v.visibilityM), divePlan: v.divePlan.trim(), pickupInfo: v.pickupInfo.trim(), onsiteCostNotes: v.onsiteCostNotes.trim() };
}

export function extraInfoTexts(v: ExtraInfoValues): string[] {
  return [v.divePlan, v.pickupInfo, v.onsiteCostNotes];
}
