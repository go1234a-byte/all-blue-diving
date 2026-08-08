import { useState } from "react";
import { FileCheck2, Pencil, Plus, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileDropzone } from "@/components/auth/FileDropzone";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { INSTRUCTOR_LANGUAGE_OPTIONS, INSTRUCTOR_SPECIALTY_OPTIONS } from "@/lib/constants";
import {
  uploadImageFile,
  uploadInstructorDocument,
  uploadInstructorDocuments,
  getInstructorDocumentSignedUrl,
} from "@/lib/uploadImage";
import type { InstructorProfile, Profile } from "@/types";

interface InstructorProfileEditCardProps {
  instructor: InstructorProfile;
  profile?: Profile;
}

function DocStatusRow({
  label,
  path,
  countLabel,
  loading,
  onView,
}: {
  label: string;
  path?: string;
  countLabel?: string;
  loading?: boolean;
  onView: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-secondary px-2.5 py-1.5 text-xs">
      <span className="flex min-w-0 items-center gap-1 truncate text-secondary-foreground">
        {path && <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-success" />}
        <span className="truncate">
          {label}
          {countLabel ? ` (${countLabel})` : ""}
        </span>
      </span>
      {path ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-6 shrink-0 px-2 text-[10px]"
          onClick={onView}
          disabled={loading}
        >
          {loading ? "불러오는 중..." : "보기"}
        </Button>
      ) : (
        <span className="shrink-0 text-muted-foreground">미제출</span>
      )}
    </div>
  );
}

/**
 * 강사 마이페이지의 "내 정보 수정" 카드.
 * 다이버 마이페이지의 C-Card 업로드 카드처럼 강사도 자신의 정보(이름/연락처/소속/소개/자격증)를
 * 직접 수정할 수 있게 한다.
 */
export function InstructorProfileEditCard({ instructor, profile }: InstructorProfileEditCardProps) {
  const { updateInstructorProfile, submitInstructorDocumentCorrection } = useAppData();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [name, setName] = useState(instructor.name);
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [agency, setAgency] = useState(instructor.agency ?? "");
  const [level, setLevel] = useState(instructor.level ?? "");
  const [totalLogs, setTotalLogs] = useState(String(instructor.totalLogs ?? 0));
  const [experienceYears, setExperienceYears] = useState(String(instructor.experienceYears ?? 0));
  const [bio, setBio] = useState(instructor.bio ?? "");
  const [licenseFileNames, setLicenseFileNames] = useState<string[]>(instructor.licenseFileNames);
  const [avatarUrl, setAvatarUrl] = useState(instructor.avatarUrl ?? "");
  const [languages, setLanguages] = useState<string[]>(instructor.languages ?? []);
  const [customLanguageInput, setCustomLanguageInput] = useState("");
  const [specialtyTags, setSpecialtyTags] = useState<string[]>(instructor.specialtyTags ?? []);
  const [customSpecialtyInput, setCustomSpecialtyInput] = useState("");
  const [teachingPhilosophy, setTeachingPhilosophy] = useState(instructor.teachingPhilosophy ?? "");
  const [favoriteDiving, setFavoriteDiving] = useState(instructor.favoriteDiving ?? "");
  const [snsInstagram, setSnsInstagram] = useState(instructor.snsInstagram ?? "");
  const [snsYoutube, setSnsYoutube] = useState(instructor.snsYoutube ?? "");
  const [snsFacebook, setSnsFacebook] = useState(instructor.snsFacebook ?? "");
  const [snsBlog, setSnsBlog] = useState(instructor.snsBlog ?? "");
  const [snsHomepage, setSnsHomepage] = useState(instructor.snsHomepage ?? "");

  // 제출 서류(신분증/자격증/통장사본) 실제 storage 경로 + 정산 계좌 정보. 예전에는 이
  // 카드의 "강사 자격증 서류" 수정 UI가 파일명만 저장하고 실제 파일은 업로드하지 않는
  // 반쪽짜리 기능이었고, 신분증/통장사본/계좌정보는 애초에 마이페이지에서 수정할 방법
  // 자체가 없었다. 여기서부터 실제 업로드 + 서명 URL 열람 + 관리자 재확인 요청까지 처리한다.
  const [licenseFilePaths, setLicenseFilePaths] = useState<string[]>(instructor.licenseFilePaths ?? []);
  const [idDocumentPath, setIdDocumentPath] = useState(profile?.idDocumentPath ?? "");
  const [bankbookPath, setBankbookPath] = useState(profile?.bankbookPath ?? "");
  const [bankbookFileName, setBankbookFileName] = useState(profile?.bankbookFileName ?? "");
  const [bankName, setBankName] = useState(profile?.bankName ?? "");
  const [accountHolder, setAccountHolder] = useState(profile?.accountHolder ?? "");
  const [accountNumber, setAccountNumber] = useState(profile?.accountNumber ?? "");
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingBankbook, setUploadingBankbook] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  const handleViewDocument = async (path: string, label: string) => {
    setViewingDoc(label);
    const url = await getInstructorDocumentSignedUrl(path);
    setViewingDoc(null);
    if (!url) {
      toast({ title: `${label} 파일을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.`, variant: "destructive" });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  };
  const addCustomLanguage = () => {
    const trimmed = customLanguageInput.trim();
    if (!trimmed || languages.includes(trimmed)) return;
    setLanguages((prev) => [...prev, trimmed]);
    setCustomLanguageInput("");
  };
  const removeLanguage = (lang: string) => {
    setLanguages((prev) => prev.filter((l) => l !== lang));
  };

  const toggleSpecialtyTag = (tag: string) => {
    setSpecialtyTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };
  const addCustomSpecialtyTag = () => {
    const trimmed = customSpecialtyInput.trim();
    if (!trimmed || specialtyTags.includes(trimmed)) return;
    setSpecialtyTags((prev) => [...prev, trimmed]);
    setCustomSpecialtyInput("");
  };
  const removeSpecialtyTag = (tag: string) => {
    setSpecialtyTags((prev) => prev.filter((t) => t !== tag));
  };

  const resetForm = () => {
    setName(instructor.name);
    setPhone(profile?.phone ?? "");
    setAgency(instructor.agency ?? "");
    setLevel(instructor.level ?? "");
    setTotalLogs(String(instructor.totalLogs ?? 0));
    setExperienceYears(String(instructor.experienceYears ?? 0));
    setBio(instructor.bio ?? "");
    setLicenseFileNames(instructor.licenseFileNames);
    setLicenseFilePaths(instructor.licenseFilePaths ?? []);
    setIdDocumentPath(profile?.idDocumentPath ?? "");
    setBankbookPath(profile?.bankbookPath ?? "");
    setBankbookFileName(profile?.bankbookFileName ?? "");
    setBankName(profile?.bankName ?? "");
    setAccountHolder(profile?.accountHolder ?? "");
    setAccountNumber(profile?.accountNumber ?? "");
    setAvatarUrl(instructor.avatarUrl ?? "");
    setLanguages(instructor.languages ?? []);
    setCustomLanguageInput("");
    setSpecialtyTags(instructor.specialtyTags ?? []);
    setCustomSpecialtyInput("");
    setTeachingPhilosophy(instructor.teachingPhilosophy ?? "");
    setFavoriteDiving(instructor.favoriteDiving ?? "");
    setSnsInstagram(instructor.snsInstagram ?? "");
    setSnsYoutube(instructor.snsYoutube ?? "");
    setSnsFacebook(instructor.snsFacebook ?? "");
    setSnsBlog(instructor.snsBlog ?? "");
    setSnsHomepage(instructor.snsHomepage ?? "");
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
        level: level.trim(),
        totalLogs: Number(totalLogs) || 0,
        experienceYears: Number(experienceYears) || 0,
        bio: bio.trim(),
        licenseFileNames,
        avatarUrl,
        languages,
        specialtyTags,
        teachingPhilosophy: teachingPhilosophy.trim(),
        favoriteDiving: favoriteDiving.trim(),
        snsInstagram: snsInstagram.trim(),
        snsYoutube: snsYoutube.trim(),
        snsFacebook: snsFacebook.trim(),
        snsBlog: snsBlog.trim(),
        snsHomepage: snsHomepage.trim(),
      });

      // 신분증/자격증/통장사본/정산계좌 정보 중 하나라도 실제로 바뀌었으면 별도로
      // "서류 수정요청"으로 접수한다 — 이미 인증된 강사라면 관리자 강사 승인 큐에
      // 다시 노출되어 재확인을 받아야 하기 때문에, 일반 프로필 정보 저장과는 분리한다.
      const originalLicensePaths = instructor.licenseFilePaths ?? [];
      const licensePathsChanged =
        licenseFilePaths.length !== originalLicensePaths.length ||
        licenseFilePaths.some((p, i) => p !== originalLicensePaths[i]);
      const documentChanges: Parameters<typeof submitInstructorDocumentCorrection>[1] = {};
      if (licensePathsChanged) {
        documentChanges.licenseFileNames = licenseFileNames;
        documentChanges.licenseFilePaths = licenseFilePaths;
      }
      if (idDocumentPath && idDocumentPath !== (profile?.idDocumentPath ?? "")) {
        documentChanges.idDocumentPath = idDocumentPath;
      }
      if (bankbookPath && bankbookPath !== (profile?.bankbookPath ?? "")) {
        documentChanges.bankbookPath = bankbookPath;
        documentChanges.bankbookFileName = bankbookFileName;
      }
      if (bankName.trim() !== (profile?.bankName ?? "")) documentChanges.bankName = bankName.trim();
      if (accountHolder.trim() !== (profile?.accountHolder ?? "")) documentChanges.accountHolder = accountHolder.trim();
      if (accountNumber.trim() !== (profile?.accountNumber ?? "")) documentChanges.accountNumber = accountNumber.trim();

      const hasDocumentChanges = Object.keys(documentChanges).length > 0;
      if (hasDocumentChanges) {
        await submitInstructorDocumentCorrection(instructor.id, documentChanges);
      }

      toast({
        title: "정보가 저장되었습니다",
        description: hasDocumentChanges
          ? "제출 서류/계좌 정보가 변경되어 관리자 재확인이 필요합니다. 확인 전까지는 기존 인증 상태가 유지됩니다."
          : undefined,
      });
      setEditing(false);
    } catch (error) {
      console.error(error);
      toast({ title: "저장에 실패했습니다. 잠시 후 다시 시도해주세요.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-foreground">내 정보</h3>
              {instructor.documentsPendingReview && (
                <Badge variant="secondary" className="text-[10px]">
                  서류 수정요청 확인중
                </Badge>
              )}
            </div>
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
            <div>
              <p className="text-muted-foreground">레벨</p>
              <p className="font-medium text-foreground">{instructor.level || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">누적 다이빙 로그</p>
              <p className="font-medium text-foreground">{instructor.totalLogs ?? 0}회</p>
            </div>
            <div>
              <p className="text-muted-foreground">경력</p>
              <p className="font-medium text-foreground">{instructor.experienceYears ?? 0}년</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">소개</p>
              <p className="whitespace-pre-line font-medium text-foreground">{instructor.bio || "-"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">전문 분야</p>
              {instructor.specialtyTags && instructor.specialtyTags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {instructor.specialtyTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="font-medium text-foreground">-</p>
              )}
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">사용 언어</p>
              <p className="font-medium text-foreground">
                {instructor.languages && instructor.languages.length > 0 ? instructor.languages.join(", ") : "-"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">교육 철학</p>
              <p className="whitespace-pre-line font-medium text-foreground">{instructor.teachingPhilosophy || "-"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">좋아하는 다이빙</p>
              <p className="whitespace-pre-line font-medium text-foreground">{instructor.favoriteDiving || "-"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">SNS</p>
              <p className="font-medium text-foreground">
                {[instructor.snsInstagram, instructor.snsYoutube, instructor.snsFacebook, instructor.snsBlog, instructor.snsHomepage].filter(
                  Boolean,
                ).length > 0
                  ? "등록됨"
                  : "-"}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">제출 서류</p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <DocStatusRow
                label="신분증 사본"
                path={profile?.idDocumentPath}
                loading={viewingDoc === "신분증 사본"}
                onView={() => profile?.idDocumentPath && handleViewDocument(profile.idDocumentPath, "신분증 사본")}
              />
              <DocStatusRow
                label="자격증"
                path={instructor.licenseFilePaths && instructor.licenseFilePaths.length > 0 ? instructor.licenseFilePaths[0] : undefined}
                countLabel={instructor.licenseFileNames.length > 0 ? `${instructor.licenseFileNames.length}건` : undefined}
                loading={viewingDoc === "자격증"}
                onView={() =>
                  instructor.licenseFilePaths?.[0] && handleViewDocument(instructor.licenseFilePaths[0], "자격증")
                }
              />
              <DocStatusRow
                label="통장 사본"
                path={profile?.bankbookPath}
                loading={viewingDoc === "통장 사본"}
                onView={() => profile?.bankbookPath && handleViewDocument(profile.bankbookPath, "통장 사본")}
              />
            </div>
            {(profile?.bankName || profile?.accountHolder || profile?.accountNumber) && (
              <p className="text-xs text-muted-foreground">
                정산 계좌: {profile?.bankName || "-"} {profile?.accountHolder || ""} {profile?.accountNumber || ""}
              </p>
            )}
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
            <AvatarImage src={avatarUrl || undefined} alt={name} />
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>다이빙협회 소속</Label>
            <Input value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="예: PADI, SSI, CMAS" />
          </div>
          <div className="space-y-1.5">
            <Label>레벨</Label>
            <Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="예: MSDT, OWSI" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>누적 다이빙 로그 수</Label>
            <Input
              type="number"
              min={0}
              value={totalLogs}
              onChange={(e) => setTotalLogs(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>경력 (년)</Label>
            <Input
              type="number"
              min={0}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              placeholder="예: 5"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>소개</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="다이버들에게 보여질 자기소개를 입력해주세요" />
        </div>

        <div className="space-y-1.5">
          <Label>교육 철학 (선택)</Label>
          <Textarea
            value={teachingPhilosophy}
            onChange={(e) => setTeachingPhilosophy(e.target.value)}
            rows={2}
            placeholder="다이빙을 가르칠 때 중요하게 생각하는 것을 적어주세요"
          />
        </div>

        <div className="space-y-1.5">
          <Label>좋아하는 다이빙 (선택)</Label>
          <Textarea
            value={favoriteDiving}
            onChange={(e) => setFavoriteDiving(e.target.value)}
            rows={2}
            placeholder="예: 고요한 새벽 다이빙, 마크로 생물 관찰 등"
          />
        </div>

        <div className="space-y-2">
          <Label>전문 분야 (선택)</Label>
          <p className="text-xs text-muted-foreground">강사 프로필에 배지 형태로 노출됩니다.</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {INSTRUCTOR_SPECIALTY_OPTIONS.map((tagOption) => (
              <label key={tagOption} className="flex items-center gap-1.5 text-xs text-foreground">
                <Checkbox checked={specialtyTags.includes(tagOption)} onCheckedChange={() => toggleSpecialtyTag(tagOption)} />
                {tagOption}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              value={customSpecialtyInput}
              onChange={(e) => setCustomSpecialtyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomSpecialtyTag();
                }
              }}
              placeholder="직접 입력 (예: 딥다이빙)"
              className="h-8 flex-1 text-xs"
            />
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={addCustomSpecialtyTag}>
              <Plus className="h-3.5 w-3.5" />
              추가
            </Button>
          </div>
          {specialtyTags.filter((t) => !(INSTRUCTOR_SPECIALTY_OPTIONS as readonly string[]).includes(t)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {specialtyTags
                .filter((t) => !(INSTRUCTOR_SPECIALTY_OPTIONS as readonly string[]).includes(t))
                .map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 pr-1 text-[10px]">
                    {t}
                    <button type="button" onClick={() => removeSpecialtyTag(t)} aria-label={`${t} 제거`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>사용 언어 (선택)</Label>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {INSTRUCTOR_LANGUAGE_OPTIONS.map((langOption) => (
              <label key={langOption} className="flex items-center gap-1.5 text-xs text-foreground">
                <Checkbox checked={languages.includes(langOption)} onCheckedChange={() => toggleLanguage(langOption)} />
                {langOption}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              value={customLanguageInput}
              onChange={(e) => setCustomLanguageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomLanguage();
                }
              }}
              placeholder="직접 입력 (예: 태국어)"
              className="h-8 flex-1 text-xs"
            />
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={addCustomLanguage}>
              <Plus className="h-3.5 w-3.5" />
              추가
            </Button>
          </div>
          {languages.filter((l) => !(INSTRUCTOR_LANGUAGE_OPTIONS as readonly string[]).includes(l)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {languages
                .filter((l) => !(INSTRUCTOR_LANGUAGE_OPTIONS as readonly string[]).includes(l))
                .map((l) => (
                  <Badge key={l} variant="secondary" className="gap-1 pr-1 text-[10px]">
                    {l}
                    <button type="button" onClick={() => removeLanguage(l)} aria-label={`${l} 제거`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>SNS 링크 (선택)</Label>
          <Input value={snsInstagram} onChange={(e) => setSnsInstagram(e.target.value)} placeholder="Instagram URL" />
          <Input value={snsYoutube} onChange={(e) => setSnsYoutube(e.target.value)} placeholder="YouTube URL" />
          <Input value={snsFacebook} onChange={(e) => setSnsFacebook(e.target.value)} placeholder="Facebook URL" />
          <Input value={snsBlog} onChange={(e) => setSnsBlog(e.target.value)} placeholder="블로그 URL" />
          <Input value={snsHomepage} onChange={(e) => setSnsHomepage(e.target.value)} placeholder="홈페이지 URL" />
        </div>

        <div className="space-y-1.5">
          <Label>강사 자격증 서류</Label>
          <p className="text-[11px] text-muted-foreground">
            자격증을 다시 제출하면 관리자 재확인이 필요합니다.
          </p>
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
                    onClick={() => {
                      setLicenseFileNames((prev) => prev.filter((_, i) => i !== index));
                      setLicenseFilePaths((prev) => prev.filter((_, i) => i !== index));
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <FileDropzone
            label={uploadingLicense ? "업로드 중..." : "자격증 파일 추가"}
            accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.heic,.heif"
            multiple
            maxFiles={5}
            onFilesChange={async (files) => {
              if (files.length === 0) return;
              setUploadingLicense(true);
              try {
                const paths = await uploadInstructorDocuments(files, instructor.profileId, "license");
                setLicenseFileNames((prev) => [...prev, ...files.map((f) => f.name)]);
                setLicenseFilePaths((prev) => [...prev, ...paths]);
              } catch (err) {
                console.error("[InstructorProfileEditCard] 자격증 업로드 실패:", err);
                toast({ title: "자격증 파일 업로드에 실패했습니다", variant: "destructive" });
              } finally {
                setUploadingLicense(false);
              }
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label>신분증 사본</Label>
          <p className="text-[11px] text-muted-foreground">
            다시 제출하면 관리자 재확인이 필요합니다.
          </p>
          {idDocumentPath ? (
            <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-1.5 text-xs">
              <span className="flex items-center gap-1.5 text-secondary-foreground">
                <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-success" />
                제출됨
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px]"
                disabled={viewingDoc === "신분증 사본"}
                onClick={() => handleViewDocument(idDocumentPath, "신분증 사본")}
              >
                {viewingDoc === "신분증 사본" ? "불러오는 중..." : "보기"}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">아직 제출되지 않았습니다.</p>
          )}
          <FileDropzone
            label={uploadingId ? "업로드 중..." : "신분증 사본 다시 제출"}
            accept="image/*,.pdf,.jpg,.jpeg,.png,.heic,.heif"
            onFilesChange={async (files) => {
              if (files.length === 0) return;
              setUploadingId(true);
              try {
                const path = await uploadInstructorDocument(files[0], instructor.profileId, "id");
                setIdDocumentPath(path);
              } catch (err) {
                console.error("[InstructorProfileEditCard] 신분증 업로드 실패:", err);
                toast({ title: "신분증 사본 업로드에 실패했습니다", variant: "destructive" });
              } finally {
                setUploadingId(false);
              }
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label>통장 사본 및 정산 계좌 정보</Label>
          <p className="text-[11px] text-muted-foreground">
            계좌 정보나 통장 사본을 변경하면 관리자 재확인이 필요합니다.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="은행명" />
            <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="예금주" />
            <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="계좌번호" />
          </div>
          {bankbookPath ? (
            <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-1.5 text-xs">
              <span className="flex items-center gap-1.5 truncate text-secondary-foreground">
                <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-success" />
                <span className="truncate">{bankbookFileName || "통장 사본"}</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 shrink-0 px-2 text-[10px]"
                disabled={viewingDoc === "통장 사본"}
                onClick={() => handleViewDocument(bankbookPath, "통장 사본")}
              >
                {viewingDoc === "통장 사본" ? "불러오는 중..." : "보기"}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">아직 제출되지 않았습니다.</p>
          )}
          <FileDropzone
            label={uploadingBankbook ? "업로드 중..." : "통장 사본 다시 제출"}
            accept="image/*,.pdf,.jpg,.jpeg,.png,.heic,.heif"
            onFilesChange={async (files) => {
              if (files.length === 0) return;
              setUploadingBankbook(true);
              try {
                const path = await uploadInstructorDocument(files[0], instructor.profileId, "bankbook");
                setBankbookPath(path);
                setBankbookFileName(files[0].name);
              } catch (err) {
                console.error("[InstructorProfileEditCard] 통장사본 업로드 실패:", err);
                toast({ title: "통장 사본 업로드에 실패했습니다", variant: "destructive" });
              } finally {
                setUploadingBankbook(false);
              }
            }}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1"
            onClick={handleSave}
            disabled={saving || uploadingAvatar || uploadingLicense || uploadingId || uploadingBankbook}
          >
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
