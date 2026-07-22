import { useState } from "react";
import { FileCheck2, Pencil, X } from "lucide-react";
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
import type { InstructorProfile, Profile } from "@/types";

interface InstructorProfileEditCardProps {
  instructor: InstructorProfile;
  profile?: Profile;
}

/**
 * 강사 마이페이지의 "내 정보 수정" 카드.
 * 다이버 마이페이지의 C-Card 업로드 카드처럼 강사도 자신의 정보(이름/연락처/소속/소개/자격증)를
 * 직접 수정할 수 있게 한다.
 */
export function InstructorProfileEditCard({ instructor, profile }: InstructorProfileEditCardProps) {
  const { updateInstructorProfile } = useAppData();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [name, setName] = useState(instructor.name);
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [agency, setAgency] = useState(instructor.agency ?? "");
  const [bio, setBio] = useState(instructor.bio ?? "");
  const [licenseFileNames, setLicenseFileNames] = useState<string[]>(instructor.licenseFileNames);
  const [avatarUrl, setAvatarUrl] = useState(instructor.avatarUrl ?? "");

  const resetForm = () => {
    setName(instructor.name);
    setPhone(profile?.phone ?? "");
    setAgency(instructor.agency ?? "");
    setBio(instructor.bio ?? "");
    setLicenseFileNames(instructor.licenseFileNames);
    setAvatarUrl(instructor.avatarUrl ?? "");
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
    setSaving(true);
    try {
      await updateInstructorProfile(instructor.id, {
        name: name.trim(),
        phone: phone.trim(),
        agency: agency.trim(),
        bio: bio.trim(),
        licenseFileNames,
        avatarUrl,
      });
      toast({ title: "정보가 저장되었습니다" });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">내 정보</h3>
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <p className="text-muted-foreground">이름</p>
              <p className="font-medium text-foreground">{instructor.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">연락처</p>
              <p className="font-medium text-foreground">{profile?.phone || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">소속</p>
              <p className="font-medium text-foreground">{instructor.agency || "-"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">소개</p>
              <p className="whitespace-pre-line font-medium text-foreground">{instructor.bio || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-foreground">내 정보 수정</h3>

        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16 border border-border">
            <AvatarImage src={avatarUrl || undefined} alt={name} crossOrigin="anonymous" />
            <AvatarFallback className="bg-primary text-lg text-primary-foreground">{name[0]}</AvatarFallback>
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>이름</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>연락처</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>소속 (자격 기관 등)</Label>
          <Input value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="예: PADI MSDT" />
        </div>

        <div className="space-y-1.5">
          <Label>소개</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="다이버들에게 보여질 자기소개를 입력해주세요" />
        </div>

        <div className="space-y-1.5">
          <Label>강사 자격증 서류</Label>
          {licenseFileNames.length > 0 && (
            <ul className="space-y-1">
              {licenseFileNames.map((file, index) => (
                <li
                  key={`${file}-${index}`}
                  className="flex items-center justify-between rounded-md bg-secondary px-3 py-1.5 text-xs"
                >
                  <span className="flex items-center gap-1.5 truncate text-secondary-foreground">
                    <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-success" />
                    <span className="truncate">{file}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={() => setLicenseFileNames((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <FileDropzone
            label="자격증 파일 추가"
            accept=".pdf,.jpg,.png"
            multiple
            maxFiles={5}
            onFilesChange={(files) => {
              if (files.length === 0) return;
              setLicenseFileNames((prev) => [...prev, ...files.map((f) => f.name)]);
            }}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1" onClick={handleSave} disabled={saving || uploadingAvatar}>
            {saving ? "저장 중..." : "저장"}
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={handleCancel} disabled={saving}>
            취소
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
