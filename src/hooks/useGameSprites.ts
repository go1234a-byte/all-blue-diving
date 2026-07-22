import { useEffect, useRef, useState } from "react";
import { SPRITES, type SpriteKey } from "@/lib/game/sprites";

type ImageMap = Partial<Record<SpriteKey, HTMLImageElement>>;

export function useGameSprites() {
  const [images, setImages] = useState<ImageMap>({});
  const imagesRef = useRef<ImageMap>({});

  useEffect(() => {
    let cancelled = false;
    const entries = Object.entries(SPRITES) as [SpriteKey, string][];

    entries.forEach(([key, src]) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        if (cancelled) return;
        imagesRef.current = { ...imagesRef.current, [key]: img };
        setImages(imagesRef.current);
      };
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return images;
}
