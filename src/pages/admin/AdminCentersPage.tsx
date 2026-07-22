import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
  const { centers, addCenter, updateCenter, deleteCenter } = useAppData();
  const { toast } = useToast();
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CenterFormState | null>(null);
  const [saving, setSaving] = useState(false);

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
        await addCenter({ ...payload, features: [] });
        toast({ title: "새 센터가 등록되었습니다" });
      } else if (editingCenter) {
        await updateCenter(editingCenter.id, { ...payload, features: editingCenter.features });
        toast({ title: "센터 정보가 저장되었습니다" });
      }
      closeDialog();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (center: Center) => {
    await deleteCenter(center.id);
    toast({ title: `"${center.name}" 센터를 삭제했습니다.` });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Button className="col-span-full gap-1.5" onClick={openCreate}>
        <Plus className="h-4 w-4" />
        새 센터 추가
      </Button>
      {centers.map((center) => (
        <Card key={center.id} className="accent-top-ocean">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{center.name}</p>
              <Badge variant="default" className="shrink-0 text-[10px]">승인됨</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{center.country ?? "-"}</p>
            <p className="text-xs text-muted-foreground">{center.address}</p>
            {center.features.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {center.features.map((f) => (
                  <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                ))}
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
    </div>
  );
};

export default AdminCentersPage;
