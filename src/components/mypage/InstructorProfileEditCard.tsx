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
      toast({ title: "정보가 저장되었습니다" });
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
