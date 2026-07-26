import Link from "next/link";
import {
  Heart,
  Sparkles,
  ShieldCheck,
  Users,
  Flower2,
  ArrowLeft,
  Quote,
} from "lucide-react";
import { toFa } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/section-heading";
import { ImageFallback } from "@/components/image-fallback";
import { CrochetHook, CottonBall } from "@/components/icons";
import { MotionDiv } from "@/components/motion-div";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const STATS = [
  { value: 8, suffix: " سال", label: "تجربهٔ کروشه" },
  { value: 500, suffix: "+", label: "عروسک دست‌بافت" },
  { value: 800, suffix: "+", label: "مشتری خوشحال" },
  { value: 100, suffix: "٪", label: "ساخته‌شده با عشق" },
];

const VALUES = [
  {
    Icon: Heart,
    title: "ساخته‌شده با عشق",
    desc: "هر عروسک، هر کلیدچین، با دقت و حوصلهٔ بی‌نهایت توسط خودم کروشه می‌شود. من باور دارم دست‌ساز بودن، روح محصول است.",
  },
  {
    Icon: Flower2,
    title: "نخ پنبه مرغوب",
    desc: "فقط از نخ‌های پنبه رنگارنگ و ضد حساسیت استفاده می‌کنم تا عروسک‌هام نرم، امن و دوستدار پوست بچه‌ها باشه.",
  },
  {
    Icon: Users,
    title: "ارتباط مستقیم با من",
    desc: "شما مستقیم با سازنده‌اش حرف می‌زنید! هر سؤال، هر سفارش خاص، من خودم پاسخگو هستم.",
  },
  {
    Icon: ShieldCheck,
    title: "ضمانت رضایت",
    desc: "اگر عروسک یا کلیدچین به دل‌تان نشست نداشت، تعویض یا بازگشت وجهش تضمین هست.",
  },
];

const TIMELINE = [
  {
    year: "۱۳۹۶",
    title: "اولین قلاب و نخ",
    desc: "یک بعدازظهر زمستونی، مادرم یک قلاب و چند تکه نخ رنگارنگ بهم داد. از همون لحظه، عاشق کروشه شدم.",
  },
  {
    year: "۱۳۹۸",
    title: "اولین عروسکم",
    desc: "بعد از ماه‌ها تمرین، اولین عروسک خرگوشم رو کروشه کردم. قیافه‌اش کج بود ولی با عشق ساخته شده بود!",
  },
  {
    year: "۱۴۰۰",
    title: "دوستان به مشتری تبدیل شدند",
    desc: "دوستام عروسک‌هام رو می‌دیدن و سفارش می‌دادن. کم‌کم فهمیدم شاید این بیشتر از یه سرگرمیه.",
  },
  {
    year: "۱۴۰۲",
    title: "بافخانه آنلاین شد",
    desc: "با شجاعت و یک لپ‌تاپ، بافخانه رو آنلاین کردم تا عروسک‌هام رو به خانه‌های بیشتری بفرستم.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-border/60 bg-accent/20">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">خانه</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>درباره من</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ============== HERO ============== */}
      <section className="relative overflow-hidden bg-accent/40">
        <div className="bg-knit absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <MotionDiv
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-5 text-right"
            >
              <Badge
                variant="secondary"
                className="w-fit gap-1.5 rounded-full bg-secondary/70 px-3 py-1.5 text-xs font-medium text-secondary-foreground"
              >
                <Sparkles className="size-3.5" />
                دربارهٔ بافخانه
              </Badge>
              <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                من <span className="text-primary">عروسک‌ها</span> رو با عشق کروشه می‌کنم
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
                سلام! من سازندهٔ بافخانه‌ام. هر عروسک، هر کلیدچین و هر گل کروشه‌ای که
                اینجا می‌بینید، با دست‌ها و قلب خودم ساخته شده. امیدوارم عشقم به
                کروشه، لبخند رو لبونتون بیاره.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/products">
                    مشاهده محصولات
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="gap-2 bg-background"
                >
                  <Link href="/patterns">الگوی کروشه</Link>
                </Button>
              </div>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-primary/10 blur-2xl" />
              <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-xl">
                <ImageFallback
                  src="/images/about.png"
                  alt="داستان بافخانه"
                  rounded="rounded-none"
                  className="aspect-[16/10] w-full"
                />
              </div>
              <div className="absolute -bottom-4 left-6 flex items-center gap-3 rounded-2xl border border-border/70 bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CottonBall className="size-5" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-bold text-foreground">
                    از سال ۱۳۹۶
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    با عشق کروشه می‌کنم
                  </p>
                </div>
              </div>
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* ============== STATS ============== */}
      <section className="border-b border-border/60 bg-background py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionDiv
            {...fadeUp}
            className="grid grid-cols-2 gap-6 sm:grid-cols-4"
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-1 text-center"
              >
                <span className="text-3xl font-extrabold text-primary sm:text-4xl">
                  {toFa(s.value)}
                  {s.suffix}
                </span>
                <span className="text-xs text-muted-foreground sm:text-sm">
                  {s.label}
                </span>
              </div>
            ))}
          </MotionDiv>
        </div>
      </section>

      {/* ============== STORY ============== */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionDiv {...fadeUp} className="mx-auto max-w-3xl text-center">
            <SectionHeading
              align="center"
              eyebrow="داستان من"
              title="از یک قلاب و نخ تا بافخانه"
              subtitle="داستان بافخانه، داستان یه دختره که با قلاب و نخ‌های رنگارنگ، شادی می‌سازه."
            />
          </MotionDiv>

          <MotionDiv
            {...fadeUp}
            className="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-2"
          >
            <div className="flex flex-col gap-5 text-right">
              <p className="text-sm leading-8 text-muted-foreground sm:text-base">
                من یه دخترم که عاشق کروشه‌ام. همه‌چیز از یه بعدازظهر زمستونی شروع
                شد؛ مادرم یه قلاب کوچیک و چند تکه نخ رنگارنگ بهم داد و نشست کنارم
                یادم داد چطور گره بزنم. از همون لحظه، عالمِ نخ‌ها و قلاب دنیای من شد.
              </p>
              <p className="text-sm leading-8 text-muted-foreground sm:text-base">
                اول فقط برای سرگرمی کروشه می‌زدم — یه عروسک خرگوش، یه گل رز کوچیک،
                یه کلیدچین قلبی. اما کم‌کم دوستام و فامیلم شروع کردن به سفارش
                دادن و من فهمیدم که کروشه فقط سرگرمی نیست، راهی برای رسوندن شادی
                به دل بقیه‌ست.
              </p>
              <p className="text-sm leading-8 text-muted-foreground sm:text-base">
                امروز بافخانه گوشهٔ کوچک منه؛ جایی که هر روز با یه فنجون چای و
                یه قلاب، عروسک‌ها و گل‌های جدید می‌سازم. هر تکی از اونا رو با دقت
                و عشق کروشه می‌کنم، انگار که برای خودم می‌سازمش. چون واقعاً همینطوره.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Card className="relative overflow-hidden rounded-2xl border-border/60 bg-card p-6 shadow-sm">
                <Quote className="absolute -left-2 -top-2 size-16 text-accent" />
                <p className="relative text-base font-medium leading-8 text-foreground sm:text-lg">
                  «هر عروسکی که می‌سازم، یه تیکه از قلبمه. وقتی می‌بینم لبخند رو لب
                  کسی میاره، احساس می‌کنم کل دنیا ارزشش رو داره.»
                </p>
                <div className="relative mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CrochetHook className="size-5" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-foreground">
                      سازندهٔ بافخانه
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      عروسک‌سازِ کروشه‌زن ✿
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="flex flex-col items-center gap-2 rounded-2xl border-border/60 bg-accent/40 p-5 text-center shadow-sm">
                  <Heart className="size-6 text-primary" />
                  <p className="text-sm font-bold text-foreground">
                    ساخته‌شده با عشق
                  </p>
                </Card>
                <Card className="flex flex-col items-center gap-2 rounded-2xl border-border/60 bg-accent/40 p-5 text-center shadow-sm">
                  <Sparkles className="size-6 text-primary" />
                  <p className="text-sm font-bold text-foreground">
                    یک نفر، یک قلاب
                  </p>
                </Card>
              </div>
            </div>
          </MotionDiv>
        </div>
      </section>

      {/* ============== VALUES ============== */}
      <section className="bg-secondary/30 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionDiv {...fadeUp}>
            <SectionHeading
              align="center"
              eyebrow="ارزش‌های من"
              title="چرا عروسک‌هام فرق دارن"
              subtitle="چند اصل ساده که در هر عروسک و هر کلیدچینی که می‌سازم رعایت می‌کنم."
            />
          </MotionDiv>
          <MotionDiv
            {...fadeUp}
            className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {VALUES.map(({ Icon, title, desc }) => (
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

      {/* ============== TIMELINE ============== */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionDiv {...fadeUp}>
            <SectionHeading
              align="center"
              eyebrow="مسیر من"
              title="از کجا شروع کردم"
              subtitle="نگاهی به نقطه‌های مهم داستان بافخانه؛ از قلاب اول تا امروز."
            />
          </MotionDiv>

          <MotionDiv
            {...fadeUp}
            className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {TIMELINE.map((t, i) => (
              <div
                key={t.year}
                className="relative flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
              >
                <span className="absolute -top-3 right-5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow">
                  {t.year}
                </span>
                <span className="mt-2 flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <span className="text-sm font-extrabold text-primary">
                    {toFa(i + 1)}
                  </span>
                </span>
                <h3 className="text-base font-bold text-foreground">{t.title}</h3>
                <p className="text-xs leading-6 text-muted-foreground">
                  {t.desc}
                </p>
              </div>
            ))}
          </MotionDiv>
        </div>
      </section>

      {/* ============== CTA ============== */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <MotionDiv
            {...fadeUp}
            className="flex flex-col items-center gap-6 text-center"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/15">
              <CottonBall className="size-7" />
            </span>
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                یه عروسک دست‌بافت، یه هدیه از قلب
              </h2>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-primary-foreground/85 sm:text-base">
                از میان عروسک‌ها، کلیدچین‌ها و گل‌های کروشه‌ای که با عشق ساختم انتخاب
                کنید. هر کدومشون منتظرن تا به خانهٔ شما بیان.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="gap-2 bg-background text-foreground hover:bg-background/90"
              >
                <Link href="/products">
                  مشاهده محصولات
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href="/patterns">مرور الگوها</Link>
              </Button>
            </div>
          </MotionDiv>
        </div>
      </section>
    </div>
  );
}
