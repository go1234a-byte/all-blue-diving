import { useState } from "react";
import { Plus, Ticket, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateKR } from "@/lib/dates";
import type { CouponDiscountType } from "@/types";

const AdminCouponsPage = () => {
  const { coupons, addCoupon, toggleCouponActive, deleteCoupon } = useAppData();
  const { toast } = useToast();

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<CouponDiscountType>("percent");
  const [discountValue, setDiscountValue] = useState("10");
  const [minPurchase, setMinPurchase] = useState("0");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sorted = [...coupons].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const handleSubmit = async () => {
    if (!code.trim() || !discountValue || Number(discountValue) <= 0) {
      toast({ title: "쿠폰 코드와 할인 값을 입력해주세요", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await addCoupon({
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minPurchase: Number(minPurchase) || 0,
        maxDiscount: discountType === "percent" && maxDiscount ? Number(maxDiscount) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        active: true,
      });
      toast({ title: "쿠폰이 발급되었습니다" });
      setCode("");
      setDiscountValue("10");
      setMinPurchase("0");
      setMaxDiscount("");
      setExpiresAt("");
      setUsageLimit("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="accent-top-ocean">
        <CardContent className="space-y-3 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Ticket className="h-4 w-4 text-primary" />
            새 쿠폰 발급
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>쿠폰 코드</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="예: ALLBLUE10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>할인 방식</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as CouponDiscountType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">정률 할인 (%)</SelectItem>
                  <SelectItem value="fixed">정액 할인 (원)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{discountType === "percent" ? "할인율 (%)" : "할인 금액 (원)"}</Label>
              <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>최소 구매금액 (원)</Label>
              <Input type="number" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} placeholder="0" />
            </div>
            {discountType === "percent" && (
              <div className="space-y-1.5">
                <Label>최대 할인 금액 (선택)</Label>
                <Input
                  type="number"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  placeholder="예: 50000"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>유효기간 (선택)</Label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>총 사용 가능 횟수 (선택)</Label>
              <Input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="비워두면 무제한"
              />
            </div>
          </div>
          <Button size="sm" className="gap-1.5" disabled={submitting} onClick={handleSubmit}>
            <Plus className="h-3.5 w-3.5" />
            {submitting ? "발급 중..." : "쿠폰 발급"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {sorted.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">발급된 쿠폰이 없습니다.</p>
        )}
        {sorted.map((coupon) => {
          const expired = coupon.expiresAt ? new Date(coupon.expiresAt).getTime() < Date.now() : false;
          const exhausted = coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit;
          return (
            <Card key={coupon.id}>
              <CardContent className="space-y-1.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <p className="font-mono text-sm font-semibold text-foreground">{coupon.code}</p>
                    {!coupon.active && <Badge variant="secondary" className="text-[10px]">비활성</Badge>}
                    {expired && <Badge variant="destructive" className="text-[10px]">만료됨</Badge>}
                    {exhausted && <Badge variant="destructive" className="text-[10px]">소진됨</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={coupon.active} onCheckedChange={() => toggleCouponActive(coupon.id)} />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-destructive"
                      onClick={() => deleteCoupon(coupon.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {coupon.discountType === "percent"
                    ? `${coupon.discountValue}% 할인${coupon.maxDiscount ? ` (최대 ${coupon.maxDiscount.toLocaleString("ko-KR")}원)` : ""}`
                    : `${coupon.discountValue.toLocaleString("ko-KR")}원 할인`}
                  {" · "}최소 {coupon.minPurchase.toLocaleString("ko-KR")}원 이상
                </p>
                <p className="text-[11px] text-muted-foreground">
                  사용 {coupon.usedCount}회{coupon.usageLimit !== undefined ? ` / ${coupon.usageLimit}회` : " (무제한)"}
                  {coupon.expiresAt ? ` · ~${formatDateKR(coupon.expiresAt)}까지` : " · 무기한"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCouponsPage;
