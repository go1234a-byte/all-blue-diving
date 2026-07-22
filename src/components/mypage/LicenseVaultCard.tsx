import { useState } from "react";
import { FileCheck2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileDropzone } from "@/components/auth/FileDropzone";

/**
 * 다이버용 디지털 자격증(C-Card) 보관함.
 * 업로드 상태를 로컬에서만 시뮬레이션한다 (실 파일 스토리지 연동은 범위 밖).
 */
export function LicenseVaultCard() {
  const [uploaded, setUploaded] = useState(false);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">디지털 라이센스 보관함 (C-Card)</h3>
          <Badge variant={uploaded ? "default" : "secondary"} className="gap-1">
            {uploaded ? <FileCheck2 className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
            {uploaded ? "제출 완료" : "미제출"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          보유하신 다이빙 자격증(Open Water 이상)을 업로드하면 투어 예약 시 빠르게 인증받을 수 있습니다.
        </p>
        <FileDropzone
          label="C-Card 업로드"
          accept=".pdf,.jpg,.png"
          onFilesChange={(files) => setUploaded(files.length > 0)}
        />
      </CardContent>
    </Card>
  );
}
