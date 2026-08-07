import Link from "next/link";
import {
  Sparkles,
  Heart,
  Truck,
  ShieldCheck,
  Flower2,
  Home as HomeIcon,
  FileText,
  ArrowLeft,
  Mail,
  Gift,
} from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/section-heading";
import { ProductCard } from "@/components/product-card";
import { PatternCard } from "@/components/pattern-card";
import { ImageFallback } from "@/components/image-fallback";
import { HeroCarousel } from "@/components/hero-carousel";
import { CottonBall } from "@/components/icons";
import { MotionDiv } from "@/components/motion-div";
import type { Product, Pattern } from "@/lib/types";

const CATEGORIES = [
  { label: "عروسک و آمیگورومی", href: "/products?category=عروسک و آمیگورومی", Icon: Gift },
  { label: "کلیدچین", href: "/products?category=کلیدچین", Icon: Sparkles },
  { label: "گل کروشه", href: "/products?category=گل کروشه", Icon: Flower2 },
  { label: "باجه گل", href: "/products?category=باجه گل", Icon: Heart },
  { label: "لوازم تزئینی", href: "/products?category=لوازم تزئینی", Icon: HomeIcon },
  { label: "الگوی کروشه", href: "/patterns", Icon: FileText },
];

const FEATURES = [
  {
    Icon: Heart,
    title: "دست‌بافت با عشق",
    desc: "هر عروسک و کلیدچین با دقت و عشق توسط خودم کروشه می‌شود. عروسک‌هام رو مثل یه هدیه می‌سازم.",
  },
  {
    Icon: CottonBall,
    title: "نخ پنبه باکیفیت",
    desc: "فقط از مرغوب‌ترین نخ‌های پنبه رنگارنگ و ضد حساسیت استفاده می‌کنم.",
  },
  {
    Icon: Truck,
    title: "ارسال به سراسر ایران",
    desc: "سفارشتون رو خودم با عشق بسته‌بندی می‌کنم و می‌فرستم.",
  },
  {
    Icon: ShieldCheck,
    title: "ضمانت کیفیت",
    desc: "اگر راضی نبودید، تعویض یا بازگشت وجه تضمین می‌شه.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default async function HomePage() {
  const [featuredProducts, featuredPatterns] = await Promise.all([
    db.product.findMany({
      where: { featured: true },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    db.pattern.findMany({
      where: { featured: true },
      take: 3,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        images: true,
        difficulty: true,
        featured: true,
        createdAt: true,
        // pdfUrl intentionally excluded — security risk
      },
    }),
  ]);

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden bg-accent/40">
        <div className="bg-knit absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
            <MotionDiv
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-6 text-right"
            >
              <SectionHeading
                eyebrow="دسته‌بندی‌ها"
                title="دنبال چی می‌گردی؟"
                subtitle="عروسک‌ها، کلیدچین‌ها و گل‌های کروشه را بر اساس دسته مرور کنید."
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {CATEGORIES.map(({ label, href, Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="group flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
                  >
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-6" />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </MotionDiv>
            <MotionDiv
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              <HeroCarousel />
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionDiv {...fadeUp} className="flex flex-col gap-4">
            <SectionHeading
              eyebrow="منتخب بافخانه"
              title="محصولات ویژه"
              subtitle="تازه‌ترین و محبوب‌ترین عروسک‌ها، کلیدچین‌ها و گل‌های کروشه ما را ببینید."
            />
            <div className="ms-auto">
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <Link href="/products">
                  همه محصولات
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            </div>
          </MotionDiv>
          <MotionDiv
            {...fadeUp}
            className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {featuredProducts.length > 0 ? (
              featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p as Product} />
              ))
            ) : (
              <EmptyState
                text="هنوز محصول ویژه‌ای ثبت نشده است."
                href="/products"
                cta="مشاهده همه محصولات"
              />
            )}
          </MotionDiv>
        </div>
      </section>

      {/* FEATURED PATTERNS */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionDiv {...fadeUp} className="flex flex-col gap-4">
            <SectionHeading
              eyebrow="الگوهای کروشه"
              title="الگوی کروشه ویژه"
              subtitle="الگوهای کروشه آموزشی کاملاً تشریح‌شده برای سطح مبتدی تا پیشرفته."
            />
            <div className="ms-auto">
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <Link href="/patterns">
                  همه الگوها
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            </div>
          </MotionDiv>
          <MotionDiv
            {...fadeUp}
            className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {featuredPatterns.length > 0 ? (
              featuredPatterns.map((p) => (
                <PatternCard key={p.id} pattern={p as Pattern} />
              ))
            ) : (
              <EmptyState
                text="هنوز الگوی ویژه‌ای ثبت نشده است."
                href="/patterns"
                cta="مشاهده همه الگوها"
              />
            )}
          </MotionDiv>
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-accent/40 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionDiv {...fadeUp}>
            <SectionHeading
              align="center"
              eyebrow="چرا بافخانه؟"
              title="با عشق کروشه می‌کنم"
              subtitle="این یه فروشگاه نیست؛ گوشهٔ کوچک منه که با هر قلاب، شادی می‌سازم."
            />
          </MotionDiv>
          <MotionDiv
            {...fadeUp}
            className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {FEATURES.map(({ Icon, title, desc }) => (
              <Card
                key={title}
                className="flex flex-col items-start gap-3 rounded-2xl border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </span>
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{desc}</p>
              </Card>
            ))}
          </MotionDiv>
        </div>
      </section>

      {/* ABOUT TEASER */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionDiv
            {...fadeUp}
            className="grid items-center gap-10 lg:grid-cols-2"
          >
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-secondary/40 blur-2xl" />
                <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-lg">
                  <ImageFallback
                    src="/images/about.png"
                    alt="داستان بافخانه"
                    rounded="rounded-none"
                    className="aspect-[4/3] w-full"
                  />
                </div>
              </div>
            </div>
            <div className="order-1 flex flex-col gap-5 text-right lg:order-2">
              <Badge
                variant="secondary"
                className="w-fit gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
              >
                <Heart className="size-3.5" />
                داستان ما
              </Badge>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                از یک قلاب و نخ تا خانه‌ای از کروشه
              </h2>
              <p className="text-sm leading-8 text-muted-foreground sm:text-base">
                بافخانه از عشق یه دختر به هنر کروشه آغاز شد. با یه قلاب و نخ‌های
                رنگارنگ شروع کردم و امروز هر عروسکی که می‌سازم، یه تیکه از
                قلبمه.
              </p>
              <p className="text-sm leading-8 text-muted-foreground sm:text-base">
                من باور دارم کروشه دستی فقط یه محصول نیست؛ شادی و زیبایی‌ایه
                که با هر گره در خانه‌ها جای می‌گیره.
              </p>
              <div>
                <Button asChild size="lg" className="gap-2">
                  <Link href="/about">
                    بیشتر بدانید
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </MotionDiv>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <MotionDiv
            {...fadeUp}
            className="flex flex-col items-center gap-6 text-center"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/15">
              <Mail className="size-7" />
            </span>
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                بیا با هم شادی بسازیم ✿
              </h2>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-primary-foreground/85 sm:text-base">
                با ثبت‌نام در بافخانه، از الگوهای رایگان، تخفیف‌های ویژه و
                تازه‌ترین عروسک‌ها و کلیدچین‌ها باخبر شوید. هر سفارش یه هدیه از قلب منه.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="gap-2 bg-background text-foreground hover:bg-background/90"
              >
                <Link href="/signup">ثبت‌نام رایگان</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href="/patterns">مرور الگوهای کروشه</Link>
              </Button>
            </div>
          </MotionDiv>
        </div>
      </section>
    </div>
  );
}

function EmptyState({
  text,
  href,
  cta,
}: {
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="col-span-full flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Gift className="size-6" />
      </span>
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button asChild size="sm" variant="outline" className="gap-1.5">
        <Link href={href}>
          {cta}
          <ArrowLeft className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
