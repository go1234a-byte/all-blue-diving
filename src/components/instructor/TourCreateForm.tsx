import { useState } from "react";
import { CalendarIcon, ClipboardCopy, ClipboardList, FileStack, Plus, RotateCcw, Settings2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FileDropzone } from "@/components/auth/FileDropzone";
import { CenterFormSection } from "@/components/instructor/CenterFormSection";
import { TourPledgeAgreement } from "@/components/instructor/TourPledgeAgreement";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { uploadImageFile, uploadImageFiles } from "@/lib/uploadImage";
import {
  COUNTRIES_SITES,
  SCUBA_CERT_LABELS,
  FREEDIVING_CERT_LABELS,
  TOUR_INCLUSIONS,
  TOUR_EXCLUSIONS,
  STANDARD_TOUR_OPTION_DEFS,
} from "@/lib/constants";
import { formatDateKR, isPastDate, toISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type {
  ActivityType,
  CertificationLevel,
  TourItineraryDay,
  TourOption,
  UnderMinParticipantsPolicy,
} from "@/types";

interface TourCreateFormProps {
  instructorId: string;
  onCreated: () => void;
}

const EMPTY_ITINERARY_DAY = (dayNumber: number): TourItineraryDay => ({
  dayNumber,
  title: `${dayNumber}일차`,
  briefing: "",
  diving: "",
  meals: "",
  freeTime: "",
});

function DatePickerField({
  label,
  value,
  onChange,
  disablePast = true,
}: {
  label: string;
  value?: Date;
  onChange: (d: Date | undefined) => void;
  disablePast?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start font-normal", !value && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? formatDateKR(toISODate(value)) : "날짜 선택"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            disabled={disablePast ? (d) => isPastDate(toISODate(d)) : undefined}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const EMPTY_CENTER_DRAFT = {
  name: "",
  address: "",
  googleMap: "",
  homepage: "",
  instagram: "",
  phone: "",
  features: [] as string[],
};

export function TourCreateForm({ instructorId, onCreated }: TourCreateFormProps) {
  const { addTour, addCenter } = useAppData();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [country, setCountry] = useState<string>("");
  const [site, setSite] = useState<string>("");
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [certificationLevel, setCertificationLevel] = useState<CertificationLevel>("ow");
  const [basePrice, setBasePrice] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("6");
  const [minParticipants, setMinParticipants] = useState("2");
  // 최소 인원 미달 시 진행/취소 결정은 더 이상 투어 생성 시점에 정하지 않고,
  // 출발 30일 전 자동 마감 시점에 강사가 대시보드에서 직접 선택한다(기본값은 DB not null 제약을 위한 값).
  const underMinPolicy: UnderMinParticipantsPolicy = "cancel";
  const [pledgeSignerName, setPledgeSignerName] = useState("");
  const [pledgeAgreed, setPledgeAgreed] = useState(false);
  const [pledgeSignature, setPledgeSignature] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [deadline, setDeadline] = useState<Date>();
  const [meetingPoint, setMeetingPoint] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [itineraryDays, setItineraryDays] = useState<TourItineraryDay[]>([EMPTY_ITINERARY_DAY(1)]);
  const [mainImage, setMainImage] = useState<File[]>([]);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [inclusions, setInclusions] = useState<string[]>(TOUR_INCLUSIONS);
  const [exclusions, setExclusions] = useState<string[]>(TOUR_EXCLUSIONS);
  const [customInclusionInput, setCustomInclusionInput] = useState("");
  const [customExclusionInput, setCustomExclusionInput] = useState("");
  const [prepNotes, setPrepNotes] = useState("");
  const [customOptions, setCustomOptions] = useState<TourOption[]>(() =>
    STANDARD_TOUR_OPTION_DEFS.map((def, i) => ({
      id: `std-${i}`,
      name: def.name,
      price: def.defaultPrice,
      isActive: false,
    })),
  );
  const [centerMode, setCenterMode] = useState<"existing" | "new">("existing");
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [newCenterDraft, setNewCenterDraft] = useState(EMPTY_CENTER_DRAFT);
  const [submitting, setSubmitting] = useState(false);

  const toggleOptionActive = (id: string) => {
    setCustomOptions((prev) => prev.map((o) => (o.id === id ? { ...o, isActive: !o.isActive } : o)));
  };

  const updateOptionPrice = (id: string, price: string) => {
    setCustomOptions((prev) => prev.map((o) => (o.id === id ? { ...o, price: Number(price) || 0 } : o)));
  };

  const updateOptionName = (id: string, name: string) => {
    setCustomOptions((prev) => prev.map((o) => (o.id === id ? { ...o, name } : o)));
  };

  const addCustomOptionRow = () => {
    setCustomOptions((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, name: "", price: 0, isActive: true },
    ]);
  };

  const removeCustomOptionRow = (id: string) => {
    setCustomOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const updateItineraryDay = (index: number, patch: Partial<TourItineraryDay>) => {
    setItineraryDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const addItineraryDay = () => {
    setItineraryDays((prev) => [...prev, EMPTY_ITINERARY_DAY(prev.length + 1)]);
  };

  const removeItineraryDay = (index: number) => {
    setItineraryDays((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const toggleInclusion = (item: string) => {
    setInclusions((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  const toggleExclusion = (item: string) => {
    setExclusions((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  const removeInclusion = (item: string) => {
    setInclusions((prev) => prev.filter((i) => i !== item));
  };

  const removeExclusion = (item: string) => {
    setExclusions((prev) => prev.filter((i) => i !== item));
  };

  const addCustomInclusion = () => {
    const value = customInclusionInput.trim();
    if (!value) return;
    if (inclusions.includes(value)) {
      toast({ title: "이미 추가된 항목입니다", variant: "destructive" });
      return;
    }
    setInclusions((prev) => [...prev, value]);
    setCustomInclusionInput("");
  };

  const addCustomExclusion = () => {
    const value = customExclusionInput.trim();
    if (!value) return;
    if (exclusions.includes(value)) {
      toast({ title: "이미 추가된 항목입니다", variant: "destructive" });
      return;
    }
    setExclusions((prev) => [...prev, value]);
    setCustomExclusionInput("");
  };

  const loadDefaultTemplate = () => {
    setInclusions(TOUR_INCLUSIONS);
    setExclusions(TOUR_EXCLUSIONS);
    toast({ title: "기본 템플릿을 불러왔습니다" });
  };

  const resetInclusionsExclusions = () => {
    setInclusions([]);
    setExclusions([]);
  };

  const copyInclusionsExclusions = async () => {
    const lines = [
      "📌 포함 및 불포함 사항",
      "",
      "[포함]",
      ...inclusions.map((item) => `• ${item}`),
      "",
      "[불포함]",
      ...exclusions.map((item) => `• ${item}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast({ title: "클립보드에 복사되었습니다" });
    } catch {
      toast({ title: "복사에 실패했습니다", variant: "destructive" });
    }
  };

  const toggleActivity = (type: ActivityType) => {
    setActivityTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const showScubaLevels = activityTypes.length === 0 || activityTypes.includes("scuba");
  const showFreedivingLevels = activityTypes.length === 0 || activityTypes.includes("freediving");

  const sites = country ? COUNTRIES_SITES[country] ?? [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingFields: string[] = [];
    if (!title) missingFields.push("투어명");
    if (!country) missingFields.push("국가");
    if (!site) missingFields.push("다이브 사이트");
    if (activityTypes.length === 0) missingFields.push("액티비티 종류");
    if (!startDate) missingFields.push("투어 출발일");
    if (!endDate) missingFields.push("투어 종료일");
    if (!deadline) missingFields.push("투어모집 마감일");
    if (!basePrice) missingFields.push("기본가");
    if (mainImage.length === 0) missingFields.push("대표 이미지");
    if (!meetingPoint.trim()) missingFields.push("집합 장소");
    if (!meetingTime.trim()) missingFields.push("집합 시간");
    if (itineraryDays.length === 0 || itineraryDays.some((d) => !d.title.trim())) {
      missingFields.push("투어 일정");
    }
    if (missingFields.length > 0) {
      toast({
        title: "필수 항목을 입력해주세요",
        description: `다음 항목이 비어있어요: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    if (centerMode === "existing" && !selectedCenterId) {
      toast({ title: "이용센터를 선택해주세요", variant: "destructive" });
      return;
    }
    if (centerMode === "new" && (!newCenterDraft.name.trim() || !newCenterDraft.address.trim())) {
      toast({ title: "센터명과 센터 주소는 필수입니다", variant: "destructive" });
      return;
    }
    if (!pledgeSignerName.trim() || !pledgeAgreed || !pledgeSignature) {
      toast({ title: "강사 서약서 작성(이름/동의/서명)을 완료해주세요", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let centerId = selectedCenterId;
      if (centerMode === "new") {
        const center = await addCenter({
          name: newCenterDraft.name.trim(),
          country,
          address: newCenterDraft.address.trim(),
          googleMap: newCenterDraft.googleMap.trim() || undefined,
          homepage: newCenterDraft.homepage.trim() || undefined,
          instagram: newCenterDraft.instagram.trim() || undefined,
          phone: newCenterDraft.phone.trim() || undefined,
          features: newCenterDraft.features,
        });
        centerId = center.id;
      }

      const mainUrl = await uploadImageFile(mainImage[0], "tours");
      const galleryUrls = galleryImages.length > 0 ? await uploadImageFiles(galleryImages, "tours") : [];

      await addTour({
        instructorId,
        centerId,
        title,
        country,
        site,
        activityTypes,
        certificationLevel,
        mainImageUrl: mainUrl,
        galleryUrls,
        startDate: toISODate(startDate),
        endDate: toISODate(endDate),
        recruitmentDeadline: toISODate(deadline),
        basePrice: Number(basePrice),
        waterTempC: 0,
        visibilityM: 0,
        maxParticipants: Number(maxParticipants) || 1,
        minParticipants: Number(minParticipants) || 1,
        underMinPolicy,
        description,
        inclusions,
        exclusions,
        prepNotes,
        customOptions: customOptions.filter((o) => o.name.trim() && o.price > 0),
        pledgeSignerName: pledgeSignerName.trim(),
        pledgeAgreedAt: new Date().toISOString(),
        pledgeSignatureDataUrl: pledgeSignature,
        meetingPoint: meetingPoint.trim(),
        meetingTime: meetingTime.trim(),
        itineraryDays,
      });

      toast({ title: "투어가 등록되었습니다!" });
      onCreated();
    } catch (err) {
      toast({
        title: "투어 등록에 실패했습니다",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label>투어명</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 모알보알 사딘런 스쿠버 투어" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>국가</Label>
          <Select value={country} onValueChange={(v) => { setCountry(v); setSite(""); }}>
            <SelectTrigger><SelectValue placeholder="국가 선택" /></SelectTrigger>
            <SelectContent>
              {Object.keys(COUNTRIES_SITES).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>다이브 사이트</Label>
          <Select value={site} onValueChange={setSite} disabled={!country}>
            <SelectTrigger><SelectValue placeholder="사이트 선택" /></SelectTrigger>
            <SelectContent>
              {sites.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>액티비티 종류</Label>
          <div className="flex h-10 items-center gap-4">
            <label className="flex items-center gap-1.5 text-sm">
              <Checkbox checked={activityTypes.includes("scuba")} onCheckedChange={() => toggleActivity("scuba")} />
              스쿠버다이빙
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <Checkbox checked={activityTypes.includes("freediving")} onCheckedChange={() => toggleActivity("freediving")} />
              프리다이빙
            </label>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>필요 인증 등급</Label>
          <Select value={certificationLevel} onValueChange={(v) => setCertificationLevel(v as CertificationLevel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {showScubaLevels && (
                <SelectGroup>
                  <SelectLabel>스쿠버다이빙</SelectLabel>
                  {Object.entries(SCUBA_CERT_LABELS).map(([k, v]) => (
                    <SelectItem key={`scuba-${k}`} value={k}>{v}</SelectItem>
                  ))}
                </SelectGroup>
              )}
              {showFreedivingLevels && (
                <SelectGroup>
                  <SelectLabel>프리다이빙</SelectLabel>
                  {Object.entries(FREEDIVING_CERT_LABELS).map(([k, v]) => (
                    <SelectItem key={`free-${k}`} value={k}>{v}</SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <DatePickerField label="투어 출발일" value={startDate} onChange={setStartDate} />
        <DatePickerField label="투어 종료일" value={endDate} onChange={setEndDate} />
        <DatePickerField label="투어모집 마감일" value={deadline} onChange={setDeadline} />
      </div>

      <div className="space-y-3 rounded-xl border border-border p-3">
        <Label>집합 정보 (필수)</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">집합 장소</Label>
            <Input
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              placeholder="예: 세부 막탄공항 1층 출국장"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">집합 시간</Label>
            <Input
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              placeholder="예: 출발일 오전 9시"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-3">
        <div className="flex items-center justify-between">
          <Label>투어 일정 (필수, 최소 1일차)</Label>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItineraryDay}>
            <Plus className="h-3.5 w-3.5" />
            일차 추가
          </Button>
        </div>
        <div className="space-y-3">
          {itineraryDays.map((day, index) => (
            <div key={index} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={day.title}
                  onChange={(e) => updateItineraryDay(index, { title: e.target.value })}
                  className="h-8 flex-1 font-semibold"
                  placeholder="예: 1일차 - 입도 및 오리엔테이션"
                />
                {itineraryDays.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-destructive"
                    onClick={() => removeItineraryDay(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <Textarea
                value={day.briefing}
                onChange={(e) => updateItineraryDay(index, { briefing: e.target.value })}
                placeholder="브리핑 (선택)"
                className="min-h-12 text-sm"
              />
              <Textarea
                value={day.diving}
                onChange={(e) => updateItineraryDay(index, { diving: e.target.value })}
                placeholder="다이빙 일정 (선택)"
                className="min-h-12 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>기본가 (원)</Label>
          <Input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="890000" />
        </div>
        <div className="space-y-1.5">
          <Label>최대 인원</Label>
          <Input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} placeholder="8" />
        </div>
        <div className="space-y-1.5">
          <Label>최소 인원</Label>
          <Input type="number" value={minParticipants} onChange={(e) => setMinParticipants(e.target.value)} placeholder="2" />
        </div>
      </div>

      <div className="space-y-1 rounded-xl border border-primary/30 bg-primary/5 p-3">
        <Label>최소 인원 미달 시 처리</Label>
        <p className="text-xs text-muted-foreground break-keep">
          투어 출발일 30일 전, 확정 예약 인원이 최소 인원 미만이면 모집이 자동으로 마감됩니다. 이후 강사
          대시보드에서 &quot;그대로 진행&quot; 또는 &quot;취소(전액환불)&quot;를 직접 선택하시면 됩니다.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>투어 소개</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="투어 코스, 준비물, 유의사항 등을 소개해주세요" />
      </div>

      <CenterFormSection
        selectedCenterId={selectedCenterId}
        onSelectExisting={setSelectedCenterId}
        newCenterDraft={newCenterDraft}
        onDraftChange={setNewCenterDraft}
        mode={centerMode}
        onModeChange={setCenterMode}
      />

      <div className="space-y-3 rounded-xl border-2 border-primary/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <ClipboardList className="h-4 w-4 text-primary" />
            포함 및 불포함 사항 설정
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={loadDefaultTemplate}>
              <FileStack className="h-3 w-3" />
              기본 템플릿 불러오기
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={copyInclusionsExclusions}>
              <ClipboardCopy className="h-3 w-3" />
              복사하기
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={resetInclusionsExclusions}>
              <RotateCcw className="h-3 w-3" />
              초기화
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
          <div className="space-y-2 border-b border-primary/30 pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">포함 (체크된 항목만 반영)</p>
            <div className="space-y-1.5">
              {TOUR_INCLUSIONS.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox checked={inclusions.includes(item)} onCheckedChange={() => toggleInclusion(item)} />
                  {item}
                </label>
              ))}
              {inclusions
                .filter((item) => !TOUR_INCLUSIONS.includes(item))
                .map((item) => (
                  <div key={item} className="flex items-center justify-between gap-2 rounded-md bg-secondary/60 px-2 py-1 text-sm text-foreground">
                    <span className="truncate">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeInclusion(item)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
            </div>
            <div className="flex gap-1.5 pt-1">
              <Input
                value={customInclusionInput}
                onChange={(e) => setCustomInclusionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomInclusion();
                  }
                }}
                placeholder="직접 추가할 포함 항목 입력"
                className="h-8 text-xs"
              />
              <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1 text-xs" onClick={addCustomInclusion}>
                <Plus className="h-3 w-3" />
                추가
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">불포함 (체크된 항목만 반영)</p>
            <div className="space-y-1.5">
              {TOUR_EXCLUSIONS.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox checked={exclusions.includes(item)} onCheckedChange={() => toggleExclusion(item)} />
                  {item}
                </label>
              ))}
              {exclusions
                .filter((item) => !TOUR_EXCLUSIONS.includes(item))
                .map((item) => (
                  <div key={item} className="flex items-center justify-between gap-2 rounded-md bg-secondary/60 px-2 py-1 text-sm text-foreground">
                    <span className="truncate">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeExclusion(item)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
            </div>
            <div className="flex gap-1.5 pt-1">
              <Input
                value={customExclusionInput}
                onChange={(e) => setCustomExclusionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomExclusion();
                  }
                }}
                placeholder="직접 추가할 불포함 항목 입력"
                className="h-8 text-xs"
              />
              <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1 text-xs" onClick={addCustomExclusion}>
                <Plus className="h-3 w-3" />
                추가
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>강사 추천 준비물</Label>
        <Textarea
          value={prepNotes}
          onChange={(e) => setPrepNotes(e.target.value)}
          placeholder="[강사 추천 준비물] - 개인 장비 소지자 필수 품목, 수영복, 선크림 등 자유롭게 작성하세요."
          rows={4}
        />
      </div>

      <div className="space-y-3 rounded-xl border-2 border-primary/40 p-4">
        <div className="space-y-1">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Settings2 className="h-4 w-4 text-primary" />
            투어 유료 옵션 추가 설정 (지역별 상이)
          </h3>
          <p className="text-xs text-muted-foreground">
            토글을 켜고 금액을 입력하면 사용자 결제 화면에 해당 옵션이 노출됩니다.
          </p>
        </div>
        <div className="space-y-2">
          {customOptions.map((option, index) => {
            const isStandard = index < STANDARD_TOUR_OPTION_DEFS.length;
            return (
              <div
                key={option.id}
                className="flex flex-wrap items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 sm:flex-nowrap"
              >
                <Switch checked={option.isActive} onCheckedChange={() => toggleOptionActive(option.id)} />
                {isStandard ? (
                  <span className="min-w-0 flex-1 break-keep text-sm text-foreground">{option.name}</span>
                ) : (
                  <Input
                    value={option.name}
                    onChange={(e) => updateOptionName(option.id, e.target.value)}
                    placeholder="옵션명 (예: 수중카메라 대여)"
                    className="min-w-0 flex-1"
                  />
                )}
                <div className="flex w-full items-center gap-1.5 sm:w-40">
                  <Input
                    type="number"
                    value={option.price || ""}
                    onChange={(e) => updateOptionPrice(option.id, e.target.value)}
                    placeholder="금액 (원)"
                    disabled={!option.isActive}
                    className="min-w-0"
                  />
                  {!isStandard && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-destructive"
                      onClick={() => removeCustomOptionRow(option.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addCustomOptionRow}>
          <Plus className="h-3.5 w-3.5" />
          옵션 커스텀 추가
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label>다이브센터 메인 사진 (필수, 1장)</Label>
        <FileDropzone label="메인 사진 업로드" accept="image/*" onFilesChange={setMainImage} />
      </div>

      <div className="space-y-1.5">
        <Label>투어 코스 및 다이브 사이트 갤러리 (최대 5장)</Label>
        <FileDropzone label="갤러리 이미지 업로드 (리프/보트 사진)" multiple maxFiles={5} accept="image/*" onFilesChange={setGalleryImages} />
      </div>

      <TourPledgeAgreement
        signerName={pledgeSignerName}
        onSignerNameChange={setPledgeSignerName}
        agreed={pledgeAgreed}
        onAgreedChange={setPledgeAgreed}
        signature={pledgeSignature}
        onSignatureChange={setPledgeSignature}
      />

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? "등록 중..." : "투어 등록하기"}
      </Button>
    </form>
  );
}
