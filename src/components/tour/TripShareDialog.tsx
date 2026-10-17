import { useEffect, useState } from "react";
import { CalendarPlus, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { buildTripIcs, renderTripImage, shareOrDownloadFile } from "@/lib/tripImage";
import type { Tour } from "@/types";

interface TripShareDialogProps {
  tour: Tour;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 예약한 투어면 캘린더 추가 버튼도 보여준다. */
  showCalendar?: boolean;
}

/**
 * 일정 이미지 미리보기 + 저장/공유 + 캘린더 추가.
 * 미리보기를 먼저 보여주는 이유: 앱(WebView)에선 파일 다운로드가 막히는 경우가 있어,
 * 그때도 이미지를 길게 눌러 저장할 수 있게 하려는 것.
 */
export function TripShareDialog({ tour, open, onOpenChange, showCalendar }: TripShareDialogProps) {
  const { toast } = useToast();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    let objectUrl: string | null = null;
    setFailed(false);
    renderTripImage(tour)
      .then((b) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setUrl(objectUrl);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setBlob(null);
      setUrl(null);
    };
  }, [open, tour]);

  const safeName = tour.title.replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 40);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>일정 이미지로 공유</DialogTitle>
          <DialogDescription>카톡·인스타에 올리기 좋은 세로 이미지예요. 이미지를 길게 눌러 저장할 수도 있어요.</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-xl border border-border bg-secondary/40" style={{ aspectRatio: "4 / 5" }}>
          {url ? (
            <img src={url} alt={`${tour.title} 일정 이미지`} className="h-full w-full object-contain" />
          ) : failed ? (
            <p className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
              이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.
            </p>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <Button
            disabled={!blob}
            onClick={async () => {
              if (!blob) return;
              const r = await shareOrDownloadFile(blob, `ALLBLUE_${safeName}.png`, tour.title);
              if (r === "downloaded") toast({ title: "이미지를 저장했어요" });
            }}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            저장 · 공유하기
          </Button>
          {showCalendar && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={async () => {
                const r = await shareOrDownloadFile(buildTripIcs(tour), `ALLBLUE_${safeName}.ics`, tour.title);
                if (r === "downloaded") toast({ title: "캘린더 파일을 받았어요", description: "파일을 열면 내 캘린더에 추가됩니다." });
              }}
            >
              <CalendarPlus className="h-4 w-4" />
              내 캘린더에 추가 (출발 7일 전 알림)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
