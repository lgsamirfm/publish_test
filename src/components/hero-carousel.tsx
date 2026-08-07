"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ImageFallback } from "@/components/image-fallback";
import { CrochetHook } from "@/components/icons";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

const SLIDES = [
  { src: "/images/hero.png", alt: "بافخانه — عروسک و کلیدچین کروشه" },
  { src: "/images/product-bear.png", alt: "عروسک آمیگورومی خرس کروشه" },
  { src: "/images/product-bouquet.png", alt: "دسته‌گل کروشه" },
];

/** How long each photo stays on screen before auto-changing (ms). */
const AUTOPLAY_INTERVAL = 5000;

/**
 * One carousel slide.
 *
 * Images are served through Next's image optimizer (fresh URL + re-encoded
 * with the correct content type), fetched eagerly, and preloaded — so all
 * three photos are guaranteed to be loaded regardless of browser or cache
 * state. If an image still fails, the site's branded placeholder is shown
 * instead of a blank area.
 */
function HeroSlide({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <ImageFallback
        src={null}
        alt={alt}
        rounded="rounded-none"
        className="aspect-[4/3] w-full"
      />
    );
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 55vw, 100vw"
        loading="eager"
        onError={() => setFailed(true)}
        className="object-cover"
      />
    </div>
  );
}

export function HeroCarousel() {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoplay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (!api) return;
    timerRef.current = setInterval(() => {
      api.scrollNext();
    }, AUTOPLAY_INTERVAL);
  }, [api, stopAutoplay]);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
      // Restart the countdown after any change (auto or manual),
      // so a manual swipe gives the user the full interval again.
      startAutoplay();
    };

    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    // Pause while the user is dragging / touching the slides.
    api.on("pointerDown", stopAutoplay);
    api.on("pointerUp", startAutoplay);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
      api.off("pointerDown", stopAutoplay);
      api.off("pointerUp", startAutoplay);
      stopAutoplay();
    };
  }, [api, startAutoplay, stopAutoplay]);

  return (
    <div className="relative">
      {/* Preload the off-screen slides so the browser always fetches them. */}
      <link rel="preload" as="image" href={SLIDES[1].src} />
      <link rel="preload" as="image" href={SLIDES[2].src} />

      <div
        className="absolute -inset-3 -z-10 rounded-[2rem] bg-primary/10 blur-2xl"
        aria-hidden
      />
      <Carousel
        setApi={setApi}
        opts={{ loop: true, direction: "rtl" }}
        onMouseEnter={stopAutoplay}
        onMouseLeave={startAutoplay}
        className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-xl"
      >
        <CarouselContent className="ml-0">
          {SLIDES.map((slide) => (
            <CarouselItem key={slide.src} className="pl-0">
              <HeroSlide src={slide.src} alt={slide.alt} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Prev / next arrows (RTL: previous on the right, next on the left) */}
        <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 items-center justify-between">
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            aria-label="تصویر قبلی"
            className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-background/85 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background hover:text-primary"
          >
            <ArrowRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            aria-label="تصویر بعدی"
            className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-background/85 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background hover:text-primary"
          >
            <ArrowLeft className="size-4" />
          </button>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border/60 bg-background/85 px-2.5 py-1.5 shadow-md backdrop-blur">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => api?.scrollTo(i)}
              aria-label={`تصویر ${toFa(i + 1)}`}
              aria-current={current === i}
              className={cn(
                "size-2 rounded-full transition-colors duration-300",
                current === i
                  ? "bg-primary"
                  : "bg-muted-foreground/40 hover:bg-muted-foreground/70"
              )}
            />
          ))}
        </div>
      </Carousel>

      {/* Floating brand badge — outside the carousel so it isn't clipped
          by the carousel's overflow-hidden and sits in front of it */}
      <div className="absolute -bottom-4 right-6 z-10 flex items-center gap-3 rounded-2xl border border-border/70 bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CrochetHook className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-foreground">بافخانه</p>
          <p className="text-[11px] text-muted-foreground">خانهٔ کروشه دستی</p>
        </div>
      </div>
    </div>
  );
}
