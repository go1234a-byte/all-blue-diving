import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SignaturePad } from "@/components/auth/SignaturePad";

const PLEDGE_CLAUSES = [
  "허위 자격을 사용하지 않습니다.",
  "참가자의 안전을 최우선으로 합니다.",
  "플랫폼 외 거래를 유도하지 않습니다.",
  "참가자의 개인정보를 외부에 제공하지 않습니다.",
  "플랫폼 정책을 준수합니다.",
];

const SETTLEMENT_PLEDGE_TEXT =
  "선지급 정산 정책: 투어 등록 및 예약 확정 시 총 금액의 80%가 강사에게 선지급되며, 투어 완료 후 48시간 동안 사용자의 공식 이의 제기나 문제가 없을 경우 나머지 20%가 최종 정산되어 지급됩니다.";

const ENFORCEMENT_CLAUSES = ["활동 정지", "정산 보류", "영구 이용정지"];

interface PledgeAgreementProps {
  signerName: string;
  onSignerNameChange: (name: string) => void;
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
  signature: string | undefined;
  onSignatureChange: (dataUrl: string | undefined) => void;
}

/** 인증강사 전자서약 단계: 서약 조항 + 위반 시 제재 조항 + 이름/체크박스/서명. */
export function PledgeAgreement({
  signerName,
  onSignerNameChange,
  agreed,
  onAgreedChange,
  signature,
  onSignatureChange,
}: PledgeAgreementProps) {
  return (
    <div className="space-y-4 rounded-xl border-2 border-primary/40 p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">전자 서약</h3>
      </div>

      <div className="space-y-2 rounded-lg bg-secondary/50 p-3 text-sm text-foreground">
        <p className="font-medium">본인은</p>
        <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed">
          {PLEDGE_CLAUSES.map((clause) => (
            <li key={clause}>{clause}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-1.5 rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
        <p className="font-semibold text-primary">정산 정책 안내</p>
        <p className="break-keep">{SETTLEMENT_PLEDGE_TEXT}</p>
      </div>

      <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
        <p className="font-semibold">위반 시</p>
        <ul className="list-disc space-y-1 pl-5 leading-relaxed">
          {ENFORCEMENT_CLAUSES.map((clause) => (
            <li key={clause}>{clause}</li>
          ))}
        </ul>
        <p className="pt-1 font-medium">조치에 동의합니다.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pledge-name">이름 입력</Label>
        <Input
          id="pledge-name"
          value={signerName}
          onChange={(e) => onSignerNameChange(e.target.value)}
          placeholder="본인 성명을 입력해주세요"
        />
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border border-primary/40 bg-background/60 p-3 text-sm">
        <Checkbox checked={agreed} onCheckedChange={(checked) => onAgreedChange(checked === true)} className="mt-0.5 shrink-0" />
        <span className="text-foreground">위 서약 내용, 정산 정책, 위반 시 제재 조치에 모두 전자동의합니다.</span>
      </label>

      <div className="space-y-1.5">
        <Label>서명 완료</Label>
        <SignaturePad onChange={onSignatureChange} />
        {signature && <p className="text-xs font-medium text-success">서명이 저장되었습니다.</p>}
      </div>
    </div>
  );
}
