import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

interface SignaturePadProps {
  onChange: (dataUrl: string | undefined) => void;
}

export function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // 캔버스의 실제 내부 해상도를 CSS로 렌더링되는 크기(w-full이라 기기마다 다름)에 맞춰
  // 동기화한다. 예전엔 width={400}(고정)인데 CSS는 w-full(가변)이라, 화면 폭이 정확히
  // 400px가 아닌 대부분의 실제 모바일 기기에서 손가락 위치와 실제로 그려지는 위치가
  // 어긋났다(가장자리로 갈수록 어긋남이 커짐) — 그게 "서명이 안 될 때가 있다"로 느껴진
  // 원인이었다. devicePixelRatio까지 반영해 화질도 또렷하게 만든다.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "hsl(210, 100%, 20%)";
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSigned(true);
  };

  const end = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasSigned) {
      onChange(canvas.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSigned(false);
      onChange(undefined);
    }
  };

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-md border border-input bg-background">
        <canvas
          ref={canvasRef}
          className="h-[140px] w-full touch-none"
          onPointerDown={start}
          onPointerMove={draw}
          onPointerUp={end}
          onPointerLeave={end}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          위 영역에 서명해주세요 (플랫폼 이용 동의)
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={clear} className="gap-1 text-xs">
          <Eraser className="h-3.5 w-3.5" />
          지우기
        </Button>
      </div>
    </div>
  );
}
