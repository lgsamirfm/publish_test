import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import {
  ProductFilters,
  ProductFiltersSkeleton,
} from "@/components/product-filters";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PackageSearch } from "lucide-react";
import { toFa } from "@/lib/format";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; category?: string; sort?: string }>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const category = sp.category && sp.category !== "all" ? sp.category : "";
  const sort = sp.sort ?? "newest";

  const where: {
    name?: { contains: string };
    category?: string;
  } = {};
  if (q) where.name = { contains: q };
  if (category) where.category = category;

  const orderBy =
    sort === "price-asc"
      ? { price: "asc" as const }
      : sort === "price-desc"
      ? { price: "desc" as const }
      : { createdAt: "desc" as const };

  const products = (await db.product.findMany({
    where,
    orderBy,
  })) as Product[];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">خانه</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>محصولات</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <SectionHeading
        eyebrow="فروشگاه"
        title="محصولات کروشه"
        subtitle="مجموعه‌ای از عروسک‌های آمیگورومی، کلیدچین‌های جذاب و گل‌های کروشه ماندگار بافخانه."
        className="mb-8"
      />

      <Suspense fallback={<ProductFiltersSkeleton />}>
        <ProductFilters q={q} category={category || "all"} sort={sort} />
      </Suspense>

      <div className="mt-4 mb-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {products.length > 0
            ? `${toFa(products.length)} محصول یافت شد`
            : "نتیجه‌ای یافت نشد"}
        </span>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card/50 p-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-accent text-secondary-foreground">
            <PackageSearch className="size-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            محصولی برای نمایش وجود ندارد
          </h3>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            با تغییر فیلترها یا عبارت جستجو دوباره تلاش کنید. شاید دسته‌بندی
            دیگری مورد علاقه‌تان باشد.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
