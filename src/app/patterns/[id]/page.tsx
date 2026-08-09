import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FileText, Download, Info, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/price";
import { SectionHeading } from "@/components/section-heading";
import { PatternGallery } from "@/components/pattern-gallery";
import { PatternCard } from "@/components/pattern-card";
import { BuyPatternButton } from "@/components/buy-pattern-button";
import { toFa, formatDate } from "@/lib/format";
import type { Pattern } from "@/lib/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

const DIFFICULTY_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  مبتدی: "secondary",
  متوسط: "default",
  پیشرفته: "destructive",
};

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const pattern = await db.pattern.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      // pdfUrl intentionally excluded
    },
  });
  if (!pattern) return { title: "الگو یافت نشد | بافخانه" };
  return {
    title: `${pattern.title} | الگوی بافت | بافخانه`,
    description: pattern.description?.slice(0, 150) || "الگوی بافت دستی",
  };
}

export default async function PatternDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const pattern = (await db.pattern.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      images: true,
      difficulty: true,
      yarnType: true,
      needleSize: true,
      gauge: true,
      featured: true,
      createdAt: true,
      // pdfUrl intentionally excluded — security risk
    },
  })) as Pattern | null;
  if (!pattern) notFound();

  const images = pattern.images
    ? pattern.images.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // 3 related patterns, excluding current
  const related = (await db.pattern.findMany({
    where: { id: { not: pattern.id } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 3,
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      images: true,
      difficulty: true,
      yarnType: true,
      needleSize: true,
      gauge: true,
      featured: true,
      createdAt: true,
      // pdfUrl intentionally excluded — security risk
    },
  })) as Pattern[];

  const totalPatterns = await db.pattern.count();

  const specs: { label: string; value: string }[] = [
    { label: "سطح", value: pattern.difficulty || "—" },
    { label: "نخ", value: pattern.yarnType || "—" },
    { label: "میل", value: pattern.needleSize || "—" },
    { label: "گیج / آهنگ", value: pattern.gauge || "—" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">خانه</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronLeft className="size-3.5" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/patterns">الگوی بافت</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronLeft className="size-3.5" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1 max-w-[60vw] sm:max-w-xs">
              {pattern.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <PatternGallery images={images} alt={pattern.title} />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={DIFFICULTY_VARIANT[pattern.difficulty] ?? "default"}>
              {pattern.difficulty}
            </Badge>
            {pattern.featured && (
              <Badge className="bg-primary text-primary-foreground">
                <Sparkles className="size-3" />
                ویژه
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              منتشر شده در {formatDate(pattern.createdAt)}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
            {pattern.title}
          </h1>

          <div className="flex items-baseline gap-2">
            <Price value={pattern.price} className="text-2xl" />
            <span className="text-xs text-muted-foreground">قیمت الگوی دیجیتال</span>
          </div>

          {pattern.description && (
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              {pattern.description}
            </p>
          )}

          {/* Spec table */}
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 text-sm">
            {specs.map((s) => (
              <div
                key={s.label}
                className="flex flex-col gap-1 bg-card p-4"
              >
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
                <dd className="font-semibold text-foreground">{s.value}</dd>
              </div>
            ))}
          </dl>

          {/* Buy */}
          <div className="flex flex-col gap-3">
            <BuyPatternButton
              pattern={{
                id: pattern.id,
                title: pattern.title,
                price: pattern.price,
                images: pattern.images,
              }}
            />
            <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs leading-6 text-foreground">
              <Download className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                این یک الگوی دیجیتال است. پس از تکمیل خرید، الگو در حساب
                کاربری شما قابل خواندن خواهد بود.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-14">
          <SectionHeading
            eyebrow="پیشنهادها"
            title="الگوهای مرتبط"
            subtitle="الگوهای دیگری که ممکن است برایتان جالب باشد."
          />
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PatternCard key={p.id} pattern={p} />
            ))}
          </div>
        </section>
      )}

      {/* Footer info */}
      <div className="mt-12 flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-5 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>
          همهٔ الگوهای بافخانه به‌صورت فایل دیجیتال ارائه می‌شوند و شامل
          راهنمای گام‌به‌گام، نوع نخ، شماره میل و گیج پیشنهادی هستند. در صورت
          نیاز به راهنمایی، با پشتیبانی ما در تماس باشید. تعداد کل الگوهای
          موجود: {toFa(totalPatterns)} الگو.
        </p>
        <FileText className="hidden size-5 shrink-0 text-muted-foreground sm:block" />
      </div>
    </div>
  );
}