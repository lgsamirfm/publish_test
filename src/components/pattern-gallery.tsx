"use client";

import { useState } from "react";
import { ImageFallback } from "@/components/image-fallback";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  alt: string;
};

export function PatternGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : [""];
  const current = list[active] ?? "";

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-sm">
        <ImageFallback
          src={current}
          alt={alt}
          rounded="rounded-2xl"
          className="size-full"
        />
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`تصویر ${i + 1}`}
              aria-pressed={i === active}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted transition-all sm:size-20",
                i === active
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border/70 opacity-80 hover:opacity-100"
              )}
            >
              <ImageFallback
                src={src}
                alt={`${alt} - تصویر ${i + 1}`}
                rounded="rounded-lg"
                className="size-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
