import { useState } from "react";
import { Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileDropzone } from "@/components/auth/FileDropzone";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { uploadImageFile } from "@/lib/uploadImage";
import type { Profile } from "@/types";

interface DiverProfileEditCardProps {
  profile?: Profile;
  diverId: string;
}

/**
 * 다이버 마이페이지 상단 "내 프로필" 수정 카드.
 * 예전에는 다이버 본인이 프로필 사진/이름/연락처/자기소개를 전혀 수정할 방법이 없었다
 * (강사에게는 InstructorProfileEditCard로 동일한 기능이 이미 있었음). 강사 쪽과 같은
 * 저장 패턴(실패 시 에러를 던져 화면에 알리기)을 그대로 따른다.
 */
export function DiverProfileEditCard({ profile, diverId }: DiverProfileEditCardProps) {
  const { updateDiverProfile } = useAppData();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");

  const resetForm = () => {
    setName(profile?.name ?? "");
    setPhone(profile?.phone ?? "");
    setAvatarUrl(profile?.avatarUrl ?? "");
    setBio(profile?.bio ?? "");
  };

  const handleCancel = () => {
    resetForm();
    setEditing(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "이름을 입력해주세요", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "연락처를 입력해주세요", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await updateDiverProfile(diverId, {
        name: name.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl || undefined,
        bio: bio.trim(),
      });
      toast({ title: "프로필이 저장되었습니다" });
      setEditing(false);
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

  if (!editing) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">내 프로필</h3>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              onClick={() => {
                resetForm();
                setEditing(true);
              }}
            >
              <Pencil className="h-3 w-3" />
              수정
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border border-border">
              <AvatarImage src={profile?.avatarUrl || undefined} alt={profile?.name ?? "프로필"} />
              <AvatarFallback className="bg-gradient-ocean-light text-primary-foreground">
                {(profile?.name ?? "게")[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{profile?.name || "-"}</p>
              <p className="text-xs text-muted-foreground">{profile?.phone || "-"}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">자기소개</p>
            <p className="whitespace-pre-line text-sm font-medium text-foreground">{profile?.bio || "아직 작성하지 않았어요."}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-foreground">내 프로필 수정</h3>

        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16 border border-border">
            <AvatarImage src={avatarUrl || undefined} alt={name} />
            <AvatarFallback className="bg-gradient-ocean-light text-lg text-primary-foreground">
              {(name || "게")[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <Label>프로필 사진</Label>
            <FileDropzone
              label={uploadingAvatar ? "업로드 중..." : "사진 선택"}
              accept="image/*"
              onFilesChange={async (files) => {
                if (files.length === 0) return;
                setUploadingAvatar(true);
                try {
                  const url = await uploadImageFile(files[0], "avatars");
                  setAvatarUrl(url);
                } catch {
                  toast({ title: "사진 업로드에 실패했습니다", variant: "destructive" });
                } finally {
                  setUploadingAvatar(false);
                }
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>이름</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>연락처</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>자기소개</Label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="같이 투어를 떠날 강사님과 다른 참가자들에게 나를 소개해보세요."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving || uploadingAvatar}>
            취소
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || uploadingAvatar}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
