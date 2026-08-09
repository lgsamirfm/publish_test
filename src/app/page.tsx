import Link from "next/link";
import {
  Heart,
  Truck,
  ShieldCheck,
  ArrowLeft,
  Mail,
  Gift,
  ShoppingBag,
  Instagram,
  Send,
  MessageCircle

} from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getOwnedPatternIds } from "@/lib/ownership";
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
  { label: "عروسک و آمیگورومی", href: "/products?category=عروسک و آمیگورومی", image: "/images/product-bear.png" },
  { label: "کلیدچین", href: "/products?category=کلیدچین", image: "/images/product-heart-keychain.png" },
  { label: "گل کروشه", href: "/products?category=گل کروشه", image: "/images/product-rose.png" },
  { label: "باجه گل", href: "/products?category=باجه گل", image: "/images/product-bouquet.png" },
  { label: "لوازم تزئینی", href: "/products?category=لوازم تزئینی", image: "/images/product-plantpot.png" },
  { label: "الگوی کروشه", href: "/patterns", image: "/images/pattern-bear.png" },
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
      take: 4,
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

  // Which patterns has the logged-in user already purchased? (paid orders only)
  const session = await getSession();
  const ownedIds = session ? await getOwnedPatternIds(session.id) : [];

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
              <div className="flex justify-start">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/products">
                    همه محصولات
                    <ShoppingBag className="size-5" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {CATEGORIES.map(({ label, href, image }) => (
                  <Link
                    key={label}
                    href={href}
                    className="group flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
                  >
                    <span className="relative block size-14 overflow-hidden rounded-2xl bg-accent">
                      <ImageFallback
                        src={image}
                        alt={label}
                        rounded="rounded-none"
                        className="size-full transition-transform duration-300 group-hover:scale-110"
                      />
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
            className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4"
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
            className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {featuredPatterns.length > 0 ? (
              featuredPatterns.map((p) => (
                <PatternCard key={p.id} pattern={p as Pattern} owned={ownedIds.includes(p.id)} />
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
               می‌خوای چیزی خاص بسازی؟ ✿
              </h2>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-primary-foreground/85 sm:text-base">
               برای عروسک، گل یا هر کالای سفارشی دلخواهت پیام بده؛ هر ایده‌ای رو با دست می‌سازم. همین حالا تماس بگیر.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="gap-2 bg-background text-foreground hover:bg-background/90"
              >
                <Link href="/contact">تماس با من</Link>
              </Button>
              <div className="mt-4 flex gap-2">
                  <a href="https://instagram.com/bafkhaneh" target="_blank" rel="noopener noreferrer" className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 text-white shadow-sm transition-transform hover:scale-105">
                    <Instagram className="size-5" />
                  </a>
                  <a href="https://t.me/bafkhaneh" target="_blank" rel="noopener noreferrer" className="flex size-11 items-center justify-center rounded-xl bg-[#229ED9] text-white shadow-sm transition-transform hover:scale-105">
                    <Send className="size-5" />
                  </a>
                  <a href="https://wa.me/989123456789" target="_blank" rel="noopener noreferrer" className="flex size-11 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-sm transition-transform hover:scale-105">
                    <MessageCircle className="size-5" />
                  </a>
                  <a href="mailto:hello@bafkhaneh.ir" className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-sm transition-transform hover:scale-105">
                    <Mail className="size-5" />
                  </a>
                </div>
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