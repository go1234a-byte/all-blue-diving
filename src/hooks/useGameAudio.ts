import { useEffect, useRef } from "react";
import { GameAudioEngine } from "@/lib/game/audio";

export function useGameAudio() {
  const engineRef = useRef<GameAudioEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new GameAudioEngine();
  }

  useEffect(() => {
    const engine = engineRef.current;
    return () => {
      engine?.dispose();
    };
  }, []);

  return engineRef.current;
}
