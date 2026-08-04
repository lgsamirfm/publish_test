import Link from "next/link";
import { FileText, Info, ChevronLeft, SearchX } from "lucide-react";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/section-heading";
import { PatternCard } from "@/components/pattern-card";
import { PatternFilters } from "@/components/pattern-filters";
import { toFa } from "@/lib/format";
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

const DIFFICULTIES = new Set(["مبتدی", "متوسط", "پیشرفته"]);

type SearchParams = Promise<{ q?: string; difficulty?: string; sort?: string }>;

export default async function PatternsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const difficulty = sp.difficulty?.trim() || "";
  const sort = sp.sort?.trim() || "newest";

  const where: { title?: { contains: string }; difficulty?: string } = {};
  if (q) where.title = { contains: q };
  if (difficulty && DIFFICULTIES.has(difficulty)) where.difficulty = difficulty;

  const orderBy =
    sort === "price-asc"
      ? { price: "asc" as const }
      : sort === "price-desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const patterns = (await db.pattern.findMany({
    where,
    orderBy,
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
            <BreadcrumbPage>الگوی کروشه</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <SectionHeading
        eyebrow="الگوی کروشه"
        title="الگوهای کروشه"
        subtitle="الگوهای کروشه قابل خواندن در PDF؛ از پروژه‌های مبتدی تا آمیگورومی‌های پیشرفته. پس از خرید، فایل الگو در حساب کاربری شما قابل خواندن است."
      />

      {/* Info banner */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>
          پس از خرید، فایل PDF الگو در حساب کاربری شما قابل خواندن است. هر الگو
          شامل راهنمای گام‌به‌گام، نوع نخ، شماره قلاب و گیج پیشنهادی است.
        </p>
      </div>

      {/* Filters */}
      <div className="mt-6">
        <PatternFilters q={q} difficulty={difficulty} sort={sort} />
      </div>

      {/* Result meta */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {patterns.length > 0
            ? `${toFa(patterns.length)} الگو یافت شد`
            : "نتیجه‌ای یافت نشد"}
        </span>
        {(q || (difficulty && DIFFICULTIES.has(difficulty))) && (
          <span>
            فیلترها: {q && `«${q}»`}
            {q && difficulty && "، "}
            {difficulty && DIFFICULTIES.has(difficulty) && difficulty}
          </span>
        )}
      </div>

      {/* Grid */}
      {patterns.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {patterns.map((p) => (
            <PatternCard key={p.id} pattern={p} />
          ))}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-card/50 p-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <SearchX className="size-6" />
          </span>
          <h3 className="text-lg font-bold text-foreground">
            الگویی مطابق فیلتر شما یافت نشد
          </h3>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            کلمهٔ جستجو یا سطح دیگری را امتحان کنید، یا همهٔ الگوها را ببینید.
          </p>
          <Link
            href="/patterns"
            className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <FileText className="size-4" />
            مشاهدهٔ همهٔ الگوها
          </Link>
        </div>
      )}
    </div>
  );
}