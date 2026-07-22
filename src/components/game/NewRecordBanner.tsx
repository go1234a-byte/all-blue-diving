import { useEffect, useState } from "react";
import { PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewRecordBannerProps {
  active: boolean;
}

interface DustParticle {
  id: number;
  x: number;
  y: number;
  angle: number;
}

let dustIdCounter = 0;

export function NewRecordBanner({ active }: NewRecordBannerProps) {
  const [particles, setParticles] = useState<DustParticle[]>([]);

  useEffect(() => {
    if (!active) return;
    const burst = Array.from({ length: 14 }, () => ({
      id: ++dustIdCounter,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 0,
      angle: Math.random() * 360,
    }));
    setParticles(burst);
    const timer = setTimeout(() => setParticles([]), 1500);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-x-0 top-16 flex justify-center">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute h-1.5 w-1.5 rounded-full bg-game-gold"
            style={{
              left: `${p.x}%`,
              animation: `dust-burst 1.2s ease-out forwards`,
              transform: `rotate(${p.angle}deg)`,
            }}
          />
        ))}
      </div>
      <div
        className={cn(
          "animate-[record-pop_1.5s_ease-out] rounded-xl border-4 border-game-gold bg-black/80 px-6 py-4 text-center",
        )}
        style={{ boxShadow: "0 0 40px hsl(var(--game-gold) / 0.7)" }}
      >
        <p
          className="flex items-center justify-center gap-2 text-2xl font-black tracking-wider text-game-gold"
          style={{ textShadow: "0 0 12px hsl(var(--game-gold)), 0 0 24px hsl(var(--game-gold) / 0.6)" }}
        >
          <PartyPopper className="h-6 w-6" />
          NEW RECORD!
          <PartyPopper className="h-6 w-6 scale-x-[-1]" />
        </p>
      </div>
      <style>
        {`
          @keyframes record-pop {
            0% { transform: scale(0.5); opacity: 0; }
            15% { transform: scale(1.15); opacity: 1; }
            25% { transform: scale(1); }
            85% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0; }
          }
          @keyframes dust-burst {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(60px) scale(0.3); }
          }
        `}
      </style>
    </div>
  );
}
