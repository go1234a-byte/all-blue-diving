import { useState } from "react";
import { cn } from "@/lib/utils";
import { handleImageFallback, IMAGE_PLACEHOLDER } from "@/lib/image";

interface TourGalleryProps {
  mainImageUrl: string;
  galleryUrls: string[];
  title: string;
}

export function TourGallery({ mainImageUrl, galleryUrls, title }: TourGalleryProps) {
  const images = [mainImageUrl, ...galleryUrls];
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-2">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
        <img
          src={images[active] || IMAGE_PLACEHOLDER}
          alt={title}
          onError={handleImageFallback}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((url, i) => (
          <button
            key={url + i}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
              active === i ? "border-primary" : "border-transparent opacity-70",
            )}
          >
            <img src={url || IMAGE_PLACEHOLDER} alt="" onError={handleImageFallback} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
