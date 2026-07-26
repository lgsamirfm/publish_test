import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { Price } from "@/components/price";
import { SectionHeading } from "@/components/section-heading";
import { ProductGallery } from "@/components/product-gallery";
import { AddToCartButton } from "@/components/add-to-cart-button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Heart,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { CottonBall } from "@/components/icons";
import { toFa } from "@/lib/format";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return { title: "محصول یافت نشد | بافخانه" };
  return {
    title: `${product.name} | بافخانه`,
    description: product.description?.slice(0, 150) || "محصولات کروشه دستی بافخانه",
  };
}

const FEATURES = [
  { icon: CottonBall, label: "نخ پنبه باکیفیت و ضد حساسیت" },
  { icon: Heart, label: "دست‌بافت با عشق و حوصله" },
  { icon: ShieldCheck, label: "ضمانت اصالت و کیفیت" },
  { icon: Truck, label: "ارسال به سراسر کشور" },
];

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const product = (await db.product.findUnique({
    where: { id },
  })) as Product | null;

  if (!product) notFound();

  const images = product.images?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  const related = (await db.product.findMany({
    where: {
      category: product.category,
      NOT: { id: product.id },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  })) as Product[];

  const inStock = product.stock > 0;

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
            <BreadcrumbLink asChild>
              <Link href="/products">محصولات</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Gallery (shows ALL images, clickable thumbnails) */}
        <ProductGallery
          images={images}
          alt={product.name}
          featured={product.featured}
        />

        {/* Info */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[11px]">
              {product.category}
            </Badge>
            {product.featured && (
              <Badge className="bg-primary text-primary-foreground">
                محصول ویژه
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-3">
            <Price value={product.price} className="text-2xl" />
            {product.stock > 0 && product.stock <= 5 && (
              <span className="text-xs text-amber-600">
                تنها {toFa(product.stock)} عدد باقی مانده
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="size-4" />
                موجود در انبار
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-destructive">
                <span className="size-2 rounded-full bg-destructive" />
                ناموجود
              </span>
            )}
          </div>

          <Separator />

          {product.description && (
            <div className="text-sm leading-7 text-muted-foreground">
              <h2 className="mb-2 text-sm font-semibold text-foreground">
                توضیحات محصول
              </h2>
              <p>{product.description}</p>
            </div>
          )}

          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              images: product.images,
              stock: product.stock,
              variants: product.variants,
            }}
          />

          <Separator />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 rounded-xl bg-accent/50 px-3 py-2.5 text-xs text-accent-foreground"
              >
                <f.icon className="size-4 text-primary" />
                {f.label}
              </div>
            ))}
          </div>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-label="محصولات مرتبط">
          <SectionHeading
            eyebrow="پیشنهادها"
            title="محصولات مرتبط"
            subtitle="منتخبی دیگر از همین دسته‌بندی که شاید دوست داشته باشید."
            className="mb-6"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
