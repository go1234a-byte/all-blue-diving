import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SignaturePad } from "@/components/auth/SignaturePad";

const BASE_PLEDGE_CLAUSES = [
  "등록하는 투어 정보(일정/가격/포함사항 등)를 사실과 다르지 않게 작성합니다.",
  "참가자의 안전을 최우선으로 하여 투어를 진행합니다.",
  "플랫폼 외 별도 거래를 유도하지 않습니다.",
  "ALL BLUE의 예약/정산/취소 정책을 준수합니다.",
];

interface TourPledgeAgreementProps {
  signerName: string;
  onSignerNameChange: (name: string) => void;
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
  signature: string | undefined;
  onSignatureChange: (dataUrl: string | undefined) => void;
}

/**
 * 투어 생성 시마다 매번 작성하는 강사 전자 서약.
 * 최소 인원 미달 시에도 "그대로 진행"을 선택한 경우, 그로 인해 발생하는 모든 책임은
 * 현장에서 투어를 진행하는 강사 본인에게 있다는 조항을 명시적으로 포함한다.
 */
export function TourPledgeAgreement({
  signerName,
  onSignerNameChange,
  agreed,
  onAgreedChange,
  signature,
  onSignatureChange,
}: TourPledgeAgreementProps) {
  return (
    <div className="space-y-4 rounded-xl border-2 border-primary/40 p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">투어 등록 전자 서약</h3>
      </div>

      <div className="space-y-2 rounded-lg bg-secondary/50 p-3 text-sm text-foreground">
        <p className="font-medium">본인은 이 투어를 등록하며</p>
        <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed">
          {BASE_PLEDGE_CLAUSES.map((clause) => (
            <li key={clause}>{clause}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-1.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs leading-relaxed text-destructive">
        <p className="flex items-center gap-1.5 font-semibold">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          최소 인원 미달 시 책임 조항 (필독)
        </p>
        <p className="break-keep">
          최소 인원을 충족하지 못한 상태에서{" "}
          <strong>&quot;그대로 진행&quot;을 선택하여 투어를 진행한 경우, 그로 인해 발생하는 모든 책임은
          현장에서 투어를 진행하는 강사 본인에게 있습니다.</strong>{" "}
          (안전사고, 참가자 불만, 환불 분쟁 등 포함) 이 진행/취소 결정은 투어 출발 30일 전, 확정 예약이
          최소 인원에 미달할 경우 강사 대시보드에서 직접 선택하게 됩니다.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tour-pledge-name">이름 입력</Label>
        <Input
          id="tour-pledge-name"
          value={signerName}
          onChange={(e) => onSignerNameChange(e.target.value)}
          placeholder="본인 성명을 입력해주세요"
        />
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border border-primary/40 bg-background/60 p-3 text-sm">
        <Checkbox checked={agreed} onCheckedChange={(checked) => onAgreedChange(checked === true)} className="mt-0.5 shrink-0" />
        <span className="text-foreground">
          위 서약 내용과 최소 인원 미달 시 책임 조항을 모두 확인했으며 이에 전자동의합니다.
        </span>
      </label>

      <div className="space-y-1.5">
        <Label>서명 완료</Label>
        <SignaturePad onChange={onSignatureChange} />
        {signature && <p className="text-xs font-medium text-success">서명이 저장되었습니다.</p>}
      </div>
    </div>
  );
}
