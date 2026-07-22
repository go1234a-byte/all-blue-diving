import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePolicies } from "@/hooks/use-policies";
import { SystemStatusGrid } from "@/components/admin/dashboard/SystemStatusGrid";
import { CANCELLATION_POLICY_LINES, CANCELLATION_POLICY_NOTE } from "@/lib/refund";

const AdminSettingsPage = () => {
  const { getByCategory } = usePolicies();
  const enforcementPolicies = getByCategory("enforcement");

  return (
    <div className="space-y-4">
      <Card className="accent-top-ocean">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">플랫폼 수수료 정책</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>플랫폼 이용 수수료: 투어 기본 금액 + 옵션 금액 합계의 <span className="font-semibold text-foreground">10%</span></p>
          <p>강사 정산 비율: 1차 <span className="font-semibold text-foreground">80%</span> / 2차 <span className="font-semibold text-foreground">20%</span></p>
        </CardContent>
      </Card>

      <Card className="accent-top-ocean">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">취소 및 환불 규정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {CANCELLATION_POLICY_LINES.map((line) => (
            <p key={line} className="text-xs leading-relaxed text-muted-foreground">{line}</p>
          ))}
          <p className="pt-1 text-[11px] text-muted-foreground/80">{CANCELLATION_POLICY_NOTE}</p>
        </CardContent>
      </Card>

      <Card className="accent-top-ocean">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">제재 정책</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm text-muted-foreground">
          {enforcementPolicies.map((p) => (
            <p key={p.id}>{p.title}{p.description ? ` — ${p.description}` : ""}</p>
          ))}
          {enforcementPolicies.length === 0 && <p>등록된 제재 정책이 없습니다.</p>}
        </CardContent>
      </Card>

      <SystemStatusGrid />
    </div>
  );
};

export default AdminSettingsPage;
