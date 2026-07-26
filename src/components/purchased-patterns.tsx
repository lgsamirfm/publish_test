"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Scissors, Eye, Loader2, FileText, X, Lock, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageFallback } from "@/components/image-fallback";
import {
  DifficultyBadge,
  FeaturedBadge,
} from "@/components/admin/status-badge";
import { formatPrice, toFa } from "@/lib/format";

type PurchasedPattern = {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string;
  difficulty: string;
  yarnType: string;
  needleSize: string;
  gauge: string;
  featured: boolean;
  createdAt: string;
};

type PatternContent = {
  id: string;
  title: string;
  description: string;
  images: string;
  difficulty: string;
  yarnType: string;
  needleSize: string;
  gauge: string;
  hasContent: boolean; // whether an HTML file exists (actual URL never exposed)
};

export default function PurchasedPatterns() {
  const [patterns, setPatterns] = useState<PurchasedPattern[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [content, setContent] = useState<PatternContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.40);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const applyZoom = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;

      // Remove any previously injected zoom style
      const existingStyle = doc.getElementById("__pattern-zoom");
      if (existingStyle) existingStyle.remove();

      // Inject a style that zooms the <html> element content
      const style = doc.createElement("style");
      style.id = "__pattern-zoom";
      style.textContent = `
        html {
          zoom: ${zoom};
        }
        /* Firefox fallback (supports zoom since v126, but just in case) */
        @supports not (zoom: 1) {
          html {
            transform: scale(${zoom});
            transform-origin: top left;
            width: ${100 / zoom}%;
            height: ${100 / zoom}%;
          }
        }
      `;
      doc.head.appendChild(style);

      // Apply protection directly via DOM properties (works even with
      // sandbox="allow-same-origin" since no <script> runs inside the iframe)
      doc.oncontextmenu = () => false;
      doc.ondragstart = () => false;
      doc.onselectstart = () => false;

      // Block Ctrl+S and Ctrl+U inside the iframe
      const blockKeys = (e: KeyboardEvent) => {
        if (e.ctrlKey && (e.key === "s" || e.key === "S" || e.key === "u" || e.key === "U")) {
          e.preventDefault();
        }
      };
      // Remove old listener if re-applying
      doc.removeEventListener("keydown", blockKeys);
      doc.addEventListener("keydown", blockKeys);
    } catch {
      // Cross-origin or not yet loaded — ignore
    }
  }, [zoom]);

  // Re-apply zoom whenever it changes (and iframe is already loaded)
  useEffect(() => {
    applyZoom();
  }, [applyZoom]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/user/purchased-patterns");
        if (!res.ok) throw new Error("خطا در دریافت الگوها");
        const data = await res.json();
        setPatterns(data.patterns ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function openViewer(patternId: string) {
    try {
      setContentLoading(true);
      setContentError(null);
      setViewerOpen(true);

      const res = await fetch(`/api/user/patterns/${patternId}/content`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "خطا در دریافت محتوای الگو");
      }
      const data = await res.json();
      setContent(data.pattern);
    } catch (e) {
      setContentError(e instanceof Error ? e.message : "خطا");
    } finally {
      setContentLoading(false);
    }
  }

  function closeViewer() {
    setViewerOpen(false);
    setContent(null);
    setContentError(null);
    setZoom(0.40);
  }

  function zoomIn() {
    setZoom((z) => Math.min(z + 0.05, 3));
  }

  function zoomOut() {
    setZoom((z) => Math.max(z - 0.05, 0));
  }

  function resetZoom() {
    setZoom(0.40);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (patterns.length === 0) {
    return null;
  }

  return (
    <>
      {/* Purchased Patterns Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Scissors className="size-5 text-primary" />
            الگوهای خریداری شده
          </h2>
          <span className="text-sm text-muted-foreground">
            {toFa(patterns.length)} الگو
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patterns.map((p) => {
            const img = p.images?.split(",").filter(Boolean)[0];
            return (
              <Card
                key={p.id}
                className="group cursor-pointer border-border/70 transition-all hover:shadow-md hover:border-primary/30"
                onClick={() => openViewer(p.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <ImageFallback
                      src={img}
                      alt={p.title}
                      className="size-16 shrink-0 rounded-xl"
                      rounded="rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {p.title}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <DifficultyBadge difficulty={p.difficulty} />
                        {p.featured && <FeaturedBadge featured={p.featured} />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatPrice(p.price)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full gap-2 group-hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      openViewer(p.id);
                    }}
                  >
                    <Eye className="size-3.5" />
                    مشاهده الگو
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pattern Viewer Modal */}
      <Dialog open={viewerOpen} onOpenChange={(o) => !o && closeViewer()}>
        <DialogContent
          className="sm:max-w-4xl pt-10 select-none"
          onContextMenu={(e) => e.preventDefault()}
          
        >
          <DialogHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div className="flex items-center gap-2 min-w-0">
              <DialogTitle className="flex items-center gap-2 truncate">
                <FileText className="size-5 text-primary shrink-0" />
                {contentLoading
                  ? "در حال بارگذاری..."
                  : content?.title ?? "الگو"}
              </DialogTitle>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              {/* <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={closeViewer}
              >
                <X className="size-4" />
              </Button> */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={zoomOut}
                  disabled={zoom <= 0.2}
                  title="کوچک‌نمایی"
                >
                  <ZoomOut className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={resetZoom}
                  title="بازنشانی بزرگ‌نمایی"
                >
                  <span className="text-xs font-medium leading-none">
                    {toFa(Math.round(zoom * 100))}%
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={zoomIn}
                  disabled={zoom >= 3}
                  title="بزرگ‌نمایی"
                >
                  <ZoomIn className="size-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <DialogDescription>
            محتوای الگو فقط قابل مشاهده است و قابل دانلود نیست.
          </DialogDescription>

          {contentLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-[60vh] w-full rounded-xl" />
            </div>
          ) : contentError ? (
            <div className="py-8 text-center">
              <p className="text-sm text-destructive">{contentError}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={closeViewer}
              >
                بستن
              </Button>
            </div>
          ) : content ? (
            <div className="space-y-3">
              {content.hasContent ? (
                /* HTML Content Viewer — iframe loads from authenticated API */
                <div
                  className="relative rounded-xl border border-border/50 overflow-auto"
                  style={{ height: "70vh" }}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <iframe
                    ref={iframeRef}
                    src={`/api/user/patterns/${content.id}/html`}
                    className="w-full h-[70vh] rounded-xl"
                    title={content.title}
                    sandbox="allow-same-origin"
                    onLoad={applyZoom}
                  />
                </div>
              ) : (
                /* No HTML file — show description & images fallback */
                <div className="space-y-4">
                  {content.images && (
                    <div className="flex flex-wrap gap-2">
                      {content.images.split(",").filter(Boolean).map((img, i) => (
                        <ImageFallback
                          key={i}
                          src={img}
                          alt={`${content.title} - تصویر ${i + 1}`}
                          className="size-24 rounded-xl object-cover"
                          rounded="rounded-xl"
                        />
                      ))}
                    </div>
                  )}
                  {content.description ? (
                    <div className="whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm leading-relaxed text-foreground text-right">
                      {content.description}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-muted/40 p-6 text-center">
                      <FileText className="mx-auto size-10 text-muted-foreground" />
                      <p className="mt-3 text-sm text-muted-foreground">
                        محتوای اضافی برای این الگو ثبت نشده است.
                      </p>
                    </div>
                  )}

                  {/* Specs grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {content.difficulty && (
                      <div className="flex items-center gap-2">
                        <DifficultyBadge difficulty={content.difficulty} />
                      </div>
                    )}
                    {content.yarnType && (
                      <div className="rounded-lg bg-muted/40 p-2">
                        <span className="text-xs text-muted-foreground">نوع نخ: </span>
                        <span className="font-medium text-foreground">{content.yarnType}</span>
                      </div>
                    )}
                    {content.needleSize && (
                      <div className="rounded-lg bg-muted/40 p-2">
                        <span className="text-xs text-muted-foreground">سایز قلاب: </span>
                        <span className="font-medium text-foreground">{content.needleSize}</span>
                      </div>
                    )}
                    {content.gauge && (
                      <div className="rounded-lg bg-muted/40 p-2">
                        <span className="text-xs text-muted-foreground">gauge: </span>
                        <span className="font-medium text-foreground">{content.gauge}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notice banner */}
              <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
                <Lock className="size-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">
                  برای حفظ حقوق سازنده، الگو فقط قابل مشاهده است و قابل
                  دانلود نیست. لطفاً از بازنشر الگو خودداری کنید.
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}