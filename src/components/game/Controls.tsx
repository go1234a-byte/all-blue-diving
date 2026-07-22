import { ChevronLeft, ChevronRight } from "lucide-react";

interface ControlsProps {
  onMoveStart: (dir: 1 | -1) => void;
  onMoveEnd: (dir: 1 | -1) => void;
  disabled?: boolean;
}

export function Controls({ onMoveStart, onMoveEnd, disabled }: ControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 pb-4">
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          if (!disabled) onMoveStart(-1);
        }}
        onPointerUp={() => onMoveEnd(-1)}
        onPointerLeave={() => onMoveEnd(-1)}
        onPointerCancel={() => onMoveEnd(-1)}
        disabled={disabled}
        style={{ touchAction: "none" }}
        className="flex h-[52px] items-center justify-center gap-2 rounded-lg border border-border bg-secondary text-sm font-bold text-secondary-foreground transition-transform active:scale-95 disabled:opacity-50"
      >
        <ChevronLeft className="h-6 w-6" />
        왼쪽
      </button>
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          if (!disabled) onMoveStart(1);
        }}
        onPointerUp={() => onMoveEnd(1)}
        onPointerLeave={() => onMoveEnd(1)}
        onPointerCancel={() => onMoveEnd(1)}
        disabled={disabled}
        style={{ touchAction: "none" }}
        className="flex h-[52px] items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-game-glow transition-transform active:scale-95 disabled:opacity-50"
      >
        오른쪽
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}
