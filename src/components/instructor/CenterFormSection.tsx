import { useState } from "react";
import { Building2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/contexts/AppDataContext";
import { CENTER_FEATURE_OPTIONS } from "@/types";
import { cn } from "@/lib/utils";

interface CenterFormSectionProps {
  selectedCenterId: string;
  onSelectExisting: (centerId: string) => void;
  newCenterDraft: {
    name: string;
    address: string;
    googleMap: string;
    homepage: string;
    instagram: string;
    phone: string;
    features: string[];
  };
  onDraftChange: (draft: CenterFormSectionProps["newCenterDraft"]) => void;
  mode: "existing" | "new";
  onModeChange: (mode: "existing" | "new") => void;
}

/**
 * 투어 생성 폼에 삽입되는 "이용센터 정보" 섹션.
 * 기존에 등록된 센터를 선택하거나, 새 센터를 직접 등록할 수 있다.
 */
export function CenterFormSection({
  selectedCenterId,
  onSelectExisting,
  newCenterDraft,
  onDraftChange,
  mode,
  onModeChange,
}: CenterFormSectionProps) {
  const { centers } = useAppData();
  const [customFeature, setCustomFeature] = useState("");

  const toggleFeature = (feature: string) => {
    const features = newCenterDraft.features.includes(feature)
      ? newCenterDraft.features.filter((f) => f !== feature)
      : [...newCenterDraft.features, feature];
    onDraftChange({ ...newCenterDraft, features });
  };

  const addCustomFeature = () => {
    const trimmed = customFeature.trim();
    if (!trimmed || newCenterDraft.features.includes(trimmed)) return;
    onDraftChange({ ...newCenterDraft, features: [...newCenterDraft.features, trimmed] });
    setCustomFeature("");
  };

  const removeFeature = (feature: string) => {
    onDraftChange({ ...newCenterDraft, features: newCenterDraft.features.filter((f) => f !== feature) });
  };

  return (
    <div className="space-y-3 rounded-xl border-2 border-primary/40 p-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">이용센터 정보</h3>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onModeChange("existing")}
          className={cn(
            "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
            mode === "existing" ? "border-primary bg-secondary text-foreground" : "border-input text-muted-foreground",
          )}
        >
          기존 센터 선택
        </button>
        <button
          type="button"
          onClick={() => onModeChange("new")}
          className={cn(
            "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
            mode === "new" ? "border-primary bg-secondary text-foreground" : "border-input text-muted-foreground",
          )}
        >
          새 센터 등록
        </button>
      </div>

      {mode === "existing" ? (
        <div className="space-y-1.5">
          <Label>등록된 이용센터</Label>
          <Select value={selectedCenterId} onValueChange={onSelectExisting}>
            <SelectTrigger>
              <SelectValue placeholder="센터 선택" />
            </SelectTrigger>
            <SelectContent>
              {centers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>센터명</Label>
              <Input
                value={newCenterDraft.name}
                onChange={(e) => onDraftChange({ ...newCenterDraft, name: e.target.value })}
                placeholder="예: 모알보알 블루 다이브 센터"
              />
            </div>
            <div className="space-y-1.5">
              <Label>센터 주소</Label>
              <Input
                value={newCenterDraft.address}
                onChange={(e) => onDraftChange({ ...newCenterDraft, address: e.target.value })}
                placeholder="센터 주소를 입력해주세요"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Google Map 위치 (선택)</Label>
              <Input
                value={newCenterDraft.googleMap}
                onChange={(e) => onDraftChange({ ...newCenterDraft, googleMap: e.target.value })}
                placeholder="Google Map 공유 링크"
              />
            </div>
            <div className="space-y-1.5">
              <Label>홈페이지 (선택)</Label>
              <Input
                value={newCenterDraft.homepage}
                onChange={(e) => onDraftChange({ ...newCenterDraft, homepage: e.target.value })}
                placeholder="https://"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Instagram (선택)</Label>
              <Input
                value={newCenterDraft.instagram}
                onChange={(e) => onDraftChange({ ...newCenterDraft, instagram: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>연락처 (관리자만 확인)</Label>
              <Input
                value={newCenterDraft.phone}
                onChange={(e) => onDraftChange({ ...newCenterDraft, phone: e.target.value })}
                placeholder="센터 대표 연락처"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">센터 특징</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {CENTER_FEATURE_OPTIONS.map((feature) => (
                <label key={feature} className="flex items-center gap-1.5 text-xs text-foreground">
                  <Checkbox
                    checked={newCenterDraft.features.includes(feature)}
                    onCheckedChange={() => toggleFeature(feature)}
                  />
                  {feature}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                value={customFeature}
                onChange={(e) => setCustomFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomFeature();
                  }
                }}
                placeholder="직접 입력 (예: 반려동물 동반 가능)"
                className="h-8 flex-1 text-xs"
              />
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={addCustomFeature}>
                <Plus className="h-3.5 w-3.5" />
                추가
              </Button>
            </div>
            {newCenterDraft.features.filter((f) => !(CENTER_FEATURE_OPTIONS as readonly string[]).includes(f)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {newCenterDraft.features
                  .filter((f) => !(CENTER_FEATURE_OPTIONS as readonly string[]).includes(f))
                  .map((f) => (
                    <Badge key={f} variant="secondary" className="gap-1 pr-1 text-[10px]">
                      {f}
                      <button type="button" onClick={() => removeFeature(f)} aria-label={`${f} 제거`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
