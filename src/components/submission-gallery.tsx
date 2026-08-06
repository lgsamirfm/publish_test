"use client";

import { useState } from "react";
import { ImageFallback } from "@/components/image-fallback";
import { cn } from "@/lib/utils";
import { toFa } from "@/lib/format";
import { X } from "lucide-react";

type Props = {
  images: string[];
  alt: string;
};

/**
 * Horizontal-strip gallery for the "ارسالی های شما" (user submissions) section.
 * - Maintains the website's rounded-2xl / border / shadow style.
 * - Tapping a thumbnail opens a lightweight full-size overlay (no extra deps).
 * - Pure client component so the lightbox works without extra API calls.
 */
export function SubmissionGallery({ images, alt }: Props) {
  const [active, setActive] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-persian"
        role="list"
        aria-label="ارسالی های شما"
      >
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            role="listitem"
            aria-label={`تصویر ${toFa(i + 1)}`}
            className={cn(
              "group relative size-20 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted shadow-sm transition-all hover:border-primary/60 hover:shadow sm:size-24",
              "focus:outline-none focus:ring-2 focus:ring-primary/40"
            )}
          >
            <ImageFallback
              src={src}
              alt={`${alt} - ارسالی ${toFa(i + 1)}`}
              rounded="rounded-xl"
              className="size-full transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {/* Lightbox overlay */}
      {active !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="پیش‌نمایش تصویر"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActive(null);
            }}
            aria-label="بستن"
            className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
          >
            <X className="size-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((cur) =>
                    cur === null ? null : (cur - 1 + images.length) % images.length
                  );
                }}
                aria-label="تصویر قبلی"
                className="absolute right-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
              >
                <ChevronRight className="size-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((cur) =>
                    cur === null ? null : (cur + 1) % images.length
                  );
                }}
                aria-label="تصویر بعدی"
                className="absolute left-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
              >
                <ChevronLeft className="size-5" />
              </button>
            </>
          )}
          <div
            className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl border border-border/70 bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageFallback
              src={images[active]}
              alt={`${alt} - ارسالی ${toFa(active + 1)}`}
              rounded="rounded-2xl"
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}