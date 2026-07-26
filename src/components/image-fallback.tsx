"use client";

import { useState } from "react";
import { CrochetHook } from "@/components/icons";
import { cn } from "@/lib/utils";

export function ImageFallback({
  src,
  alt,
  className,
  rounded = "rounded-2xl",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  rounded?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-accent/60 to-secondary/40 text-secondary-foreground",
          rounded,
          className
        )}
        aria-label={alt}
        role="img"
      >
        <CrochetHook className="size-10 opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", rounded, className)}
    />
  );
}
