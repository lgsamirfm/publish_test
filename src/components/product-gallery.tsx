"use client";

import { useState } from "react";
import { ImageFallback } from "@/components/image-fallback";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  alt: string;
  featured?: boolean;
};

export function ProductGallery({ images, alt, featured }: Props) {
  const [active, setActive] = useState(0);

  const list = images.length > 0 ? images : [""];
  const current = list[active] || list[0];

  return (
    <section aria-label="گالری تصاویر" className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-sm">
        <ImageFallback
          src={current}
          alt={alt}
          rounded="rounded-none"
          className="size-full"
        />
        {featured && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow">
            ویژه
          </span>
        )}
      </div>

      {list.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {list.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`تصویر ${toFa(i + 1)}`}
              aria-pressed={active === i}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border bg-muted transition-all",
                active === i
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border/70 hover:border-primary/60"
              )}
            >
              <ImageFallback
                src={src}
                alt={`${alt} - تصویر ${toFa(i + 1)}`}
                rounded="rounded-none"
                className="size-full"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
