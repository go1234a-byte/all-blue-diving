import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import type { Center } from "@/types";

interface CenterFormState {
  name: string;
  country: string;
  address: string;
  googleMap: string;
  homepage: string;
  instagram: string;
  phone: string;
}

const EMPTY_FORM: CenterFormState = {
  name: "",
  country: "",
  address: "",
  googleMap: "",
  homepage: "",
  instagram: "",
  phone: "",
};

function toFormState(center: Center): CenterFormState {
  return {
    name: center.name,
    country: center.country ?? "",
    address: center.address,
    googleMap: center.googleMap ?? "",
    homepage: center.homepage ?? "",
    instagram: center.instagram ?? "",
    phone: center.phone ?? "",
  };
}

const AdminCentersPage = () => {
  const { centers, addCenter, updateCenter, deleteCenter, setCenterStatus } = useAppData();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CenterFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [rejectingCenter, setRejectingCenter] = useState<Center | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const openEdit = (center: Center) => {
    setEditingCenter(center);
    setCreating(false);
    setForm(toFormState(center));
  };

  const openCreate = () => {
    setEditingCenter(null);
    setCreating(true);
    setForm(EMPTY_FORM);
  };

  const closeDialog = () => {
    setEditingCenter(null);
    setCreating(false);
    setForm(null);
  };

  const handleSave = async () => {
    if (!form) return;
    if (!form.name.trim() || !form.address.trim()) {
      toast({ title: "센터명과 주소는 필수입니다", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        country: form.country.trim() || undefined,
        address: form.address.trim(),
        googleMap: form.googleMap.trim() || undefined,
        homepage: form.homepage.trim() || undefined,
        instagram: form.instagram.trim() || undefined,
        phone: form.phone.trim() || undefined,
      };
      if (creating) {
        await addCenter({ ...payload, features: [], status: "approved" });
        toast({ title: "새 센터가 등록되었습니다" });
      } else if (editingCenter) {
        await updateCenter(editingCenter.id, { ...payload, features: editingCenter.features });
        toast({ title: "센터 정보가 저장되었습니다" });
      }
      closeDialog();
    } catch (err) {
      // addCenter/updateCenter는 실패 시 에러를 던지는데 여기서 안 잡고 있었다 — catch가
      // 없어서 실패해도 사용자에게는 아무 표시 없이 조용히 아무 일도 안 일어난 것처럼 보였다.
      toast({
        title: "저장에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (center: Center) => {
    try {
      await deleteCenter(center.id);
      toast({ title: `"${center.name}" 센터를 삭제했습니다.` });
    } catch (err) {
      toast({
        title: "삭제에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (center: Center) => {
    setStatusUpdatingId(center.id);
    try {
      await setCenterStatus(center.id, "approved");
      toast({ title: `"${center.name}" 센터를 승인했습니다.` });
    } catch (err) {
      toast({ title: "승인 처리 실패", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const openReject = (center: Center) => {
    setRejectingCenter(center);
    setRejectReason("");
  };

  const handleReject = async () => {
    if (!rejectingCenter) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast({ title: "반려 사유를 입력해주세요", variant: "destructive" });
      return;
    }
    setStatusUpdatingId(rejectingCenter.id);
    try {
      await setCenterStatus(rejectingCenter.id, "rejected", reason);
      toast({ title: `"${rejectingCenter.name}" 센터를 반려했습니다.` });
      setRejectingCenter(null);
    } catch (err) {
      toast({ title: "반려 처리 실패", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Button className="col-span-full gap-1.5" onClick={openCreate}>
        <Plus className="h-4 w-4" />
        새 센터 추가
      </Button>
      {centers.map((center) => (
        <Card
          key={center.id}
          className={
            center.id === highlightId
              ? "accent-top-ocean border-primary bg-secondary/60"
              : "accent-top-ocean"
          }
        >
          <CardContent className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{center.name}</p>
              {center.status === "approved" && (
                <Badge variant="default" className="shrink-0 text-[10px]">승인됨</Badge>
              )}
              {center.status === "pending" && (
                <Badge variant="secondary" className="shrink-0 text-[10px]">승인 대기</Badge>
              )}
              {center.status === "rejected" && (
                <Badge variant="destructive" className="shrink-0 text-[10px]">반려됨</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{center.country ?? "-"}</p>
            <p className="text-xs text-muted-foreground">{center.address}</p>
            {center.status === "rejected" && center.rejectionReason && (
              <p className="rounded-md bg-destructive/10 p-2 text-[11px] text-destructive">
                반려 사유: {center.rejectionReason}
              </p>
            )}
            {center.features.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {center.features.map((f) => (
                  <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                ))}
              </div>
            )}
            {center.status === "pending" && (
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  className="flex-1 gap-1 text-xs"
                  onClick={() => handleApprove(center)}
                  disabled={statusUpdatingId === center.id}
                >
                  <Check className="h-3.5 w-3.5" />
                  승인
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1 text-xs text-destructive hover:text-destructive"
                  onClick={() => openReject(center)}
                  disabled={statusUpdatingId === center.id}
                >
                  <X className="h-3.5 w-3.5" />
                  반려
                </Button>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1 text-xs"
                onClick={() => openEdit(center)}
              >
                <Pencil className="h-3.5 w-3.5" />
                수정
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="flex-1 gap-1 text-xs text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                    삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>&quot;{center.name}&quot; 센터를 삭제하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      삭제하면 되돌릴 수 없습니다. 이 센터를 이용 중인 투어가 있는지 먼저 확인해주세요.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(center)}>삭제</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
      {centers.length === 0 && (
        <p className="col-span-full py-10 text-center text-sm text-muted-foreground">등록된 센터가 없습니다.</p>
      )}

      <Dialog open={!!editingCenter || creating} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{creating ? "새 센터 추가" : "센터 정보 수정"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>센터명</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>국가</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>주소</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>전화번호</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>구글맵 링크</Label>
                <Input value={form.googleMap} onChange={(e) => setForm({ ...form, googleMap: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>홈페이지</Label>
                <Input value={form.homepage} onChange={(e) => setForm({ ...form, homepage: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>인스타그램</Label>
                <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : creating ? "등록" : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectingCenter} onOpenChange={(open) => !open && setRejectingCenter(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>&quot;{rejectingCenter?.name}&quot; 센터 반려</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>반려 사유</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="예: 주소가 확인되지 않습니다. 정확한 센터 주소로 다시 등록해주세요."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingCenter(null)} disabled={!!statusUpdatingId}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!!statusUpdatingId}>
              반려 확정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCentersPage;
