import { useState } from "react";
import { FileCheck2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileDropzone } from "@/components/auth/FileDropzone";
import { DocumentViewButton } from "@/components/admin/DocumentViewButton";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { calculateAge } from "@/lib/dates";
import { getInstructorDocumentSignedUrl, uploadInstructorDocument } from "@/lib/uploadImage";
import type { Profile } from "@/types";

interface DiverSafetyProfileCardProps {
  profile?: Profile;
  diverId: string;
}

/**
 * 다이버 마이페이지의 "다이빙 자격 · 비상연락처 · 보험 정보" 카드.
 * 가입 시 입력한 C-Card/로그수/비상연락처/보험 정보를 이후에도 직접 수정할 수 있게 한다.
 * 참가자 대시보드 [더보기] 탭의 "마이페이지에서 수정하기" 링크가 도착하는 곳이기도 하다.
 *
 * 생년월일은 가입 시 입력을 안 받던 기존 회원들을 위해 여기서도 채워 넣을 수 있게 했다 —
 * 강사가 투어 참가자 목록에서 나이를 확인하려면 이 값이 있어야 한다.
 */
export function DiverSafetyProfileCard({ profile, diverId }: DiverSafetyProfileCardProps) {
  const { updateDiverProfile } = useAppData();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? "");
  const [cCardAgency, setCCardAgency] = useState(profile?.cCardAgency ?? "");
  const [cCardNumber, setCCardNumber] = useState(profile?.cCardNumber ?? "");
  const [logCount, setLogCount] = useState(profile?.logCount != null ? String(profile.logCount) : "");
  const [emergencyContactName, setEmergencyContactName] = useState(profile?.emergencyContactName ?? "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(profile?.emergencyContactPhone ?? "");
  const [insuranceInfo, setInsuranceInfo] = useState(profile?.insuranceInfo ?? "");
  // 예전에는 자격증 정보가 발급기관/번호 텍스트로만 있어 관리자가 진위를 확인할 방법이
  // 전혀 없었다. 가입 시 놓쳤거나 갱신된 자격증 사진을 마이페이지에서도 등록/재제출할 수 있게 한다.
  const [cCardPhotoPath, setCCardPhotoPath] = useState(profile?.cCardPhotoPath ?? "");
  const [uploadingCCardPhoto, setUploadingCCardPhoto] = useState(false);
  const [viewingCCardPhoto, setViewingCCardPhoto] = useState(false);

  const resetForm = () => {
    setBirthDate(profile?.birthDate ?? "");
    setCCardAgency(profile?.cCardAgency ?? "");
    setCCardNumber(profile?.cCardNumber ?? "");
    setLogCount(profile?.logCount != null ? String(profile.logCount) : "");
    setEmergencyContactName(profile?.emergencyContactName ?? "");
    setEmergencyContactPhone(profile?.emergencyContactPhone ?? "");
    setInsuranceInfo(profile?.insuranceInfo ?? "");
    setCCardPhotoPath(profile?.cCardPhotoPath ?? "");
  };

  const handleCancel = () => {
    resetForm();
    setEditing(false);
  };

  const handleSave = async () => {
    if (!emergencyContactName.trim() || !emergencyContactPhone.trim()) {
      toast({ title: "비상연락처를 입력해주세요", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await updateDiverProfile(diverId, {
        birthDate: birthDate || undefined,
        cCardAgency: cCardAgency.trim(),
        cCardNumber: cCardNumber.trim(),
        logCount: logCount ? Number(logCount) : undefined,
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        insuranceInfo: insuranceInfo.trim(),
        cCardPhotoPath: cCardPhotoPath || undefined,
      });
      toast({ title: "정보가 저장되었습니다" });
      setEditing(false);
    } catch (err) {
      // updateDiverProfile이 실패 시 에러를 던지도록 바뀌었다 — 예전에는 여기서 실패해도
      // "정보가 저장되었습니다" 토스트가 그대로 떠서 사용자가 저장 실패를 알 방법이 없었다.
      // 실패 시에는 입력 화면을 닫지 않아 사용자가 다시 시도할 수 있게 한다.
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
            <h3 className="text-sm font-semibold text-foreground">다이빙 자격 · 비상연락처 · 보험</h3>
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
              <p className="text-muted-foreground">생년월일 · 나이</p>
              <p className="font-medium text-foreground">
                {profile?.birthDate ? `${profile.birthDate} (${calculateAge(profile.birthDate)}세)` : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">C-Card</p>
              <p className="font-medium text-foreground">
                {profile?.cCardAgency ? `${profile.cCardAgency} ${profile.cCardNumber ?? ""}`.trim() : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">자격증 사진</p>
              <DocumentViewButton path={profile?.cCardPhotoPath} label="자격증 사진" />
            </div>
            <div>
              <p className="text-muted-foreground">보유 로그 수</p>
              <p className="font-medium text-foreground">
                {profile?.logCount != null ? `${profile.logCount}회` : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">비상연락처</p>
              <p className="font-medium text-foreground">
                {profile?.emergencyContactName
                  ? `${profile.emergencyContactName} (${profile.emergencyContactPhone ?? "-"})`
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">보험 정보</p>
              <p className="font-medium text-foreground">{profile?.insuranceInfo || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-foreground">다이빙 자격 · 비상연락처 · 보험 수정</h3>

        <div className="space-y-1.5">
          <Label>생년월일</Label>
          <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>C-Card 발급기관</Label>
            <Input value={cCardAgency} onChange={(e) => setCCardAgency(e.target.value)} placeholder="예: PADI, SSI" />
          </div>
          <div className="space-y-1.5">
            <Label>자격증 번호</Label>
            <Input value={cCardNumber} onChange={(e) => setCCardNumber(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>자격증 사진</Label>
          {cCardPhotoPath ? (
            <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-1.5 text-xs">
              <span className="flex items-center gap-1.5 text-secondary-foreground">
                <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-success" />
                등록됨
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px]"
                disabled={viewingCCardPhoto}
                onClick={async () => {
                  setViewingCCardPhoto(true);
                  const url = await getInstructorDocumentSignedUrl(cCardPhotoPath);
                  setViewingCCardPhoto(false);
                  if (!url) {
                    toast({ title: "사진을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.", variant: "destructive" });
                    return;
                  }
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
              >
                {viewingCCardPhoto ? "불러오는 중..." : "보기"}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">아직 등록되지 않았습니다.</p>
          )}
          <FileDropzone
            label={uploadingCCardPhoto ? "업로드 중..." : "자격증 사진 등록/재제출"}
            accept="image/*"
            onFilesChange={async (files) => {
              if (files.length === 0) return;
              setUploadingCCardPhoto(true);
              try {
                const path = await uploadInstructorDocument(files[0], diverId, "ccard");
                setCCardPhotoPath(path);
              } catch (err) {
                console.error("[DiverSafetyProfileCard] 자격증 사진 업로드 실패:", err);
                toast({ title: "자격증 사진 업로드에 실패했습니다", variant: "destructive" });
              } finally {
                setUploadingCCardPhoto(false);
              }
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label>보유 로그 수</Label>
          <Input type="number" min={0} value={logCount} onChange={(e) => setLogCount(e.target.value)} placeholder="예: 50" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>비상연락처 이름</Label>
            <Input
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              placeholder="비상연락처 이름"
            />
          </div>
          <div className="space-y-1.5">
            <Label>비상연락처 번호</Label>
            <Input
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>여행자/다이빙 보험 정보</Label>
          <Textarea
            value={insuranceInfo}
            onChange={(e) => setInsuranceInfo(e.target.value)}
            rows={2}
            placeholder="예: OO보험 여행자보험, 증권번호 12345"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1" onClick={handleSave} disabled={saving}>
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
