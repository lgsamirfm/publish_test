import Link from "next/link";
import {
  Instagram,
  Send,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  Heart,
  Sparkles,
  ArrowLeft,
  BadgeCheck,
  MessageSquareHeart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/section-heading";
import { MotionDiv } from "@/components/motion-div";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata = {
  title: "تماس با من | بافخانه",
  description:
    "تماس با بافخانه — ارتباط از طریق اینستاگرام، تلگرام، واتساپ، تلفن و ایمیل. پاسخگویی صمیمی و سریع.",
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const CONTACTS = [
  {
    label: "اینستاگرام",
    value: "@bafkhaneh",
    href: "https://instagram.com/bafkhaneh",
    sub: "عکس‌های روزانه از بافت و سفارش‌ها",
    Icon: Instagram,
    color: "bg-gradient-to-br from-pink-500 to-orange-400",
  },
  {
    label: "تلگرام",
    value: "@bafkhaneh",
    href: "https://t.me/bafkhaneh",
    sub: "پاسخ سریع + ارسال فایل الگو",
    Icon: Send,
    color: "bg-[#229ED9]",
  },
  {
    label: "واتساپ",
    value: "۰۹۱۲-۳۴۵۶۷۸۹",
    href: "https://wa.me/989123456789",
    sub: "ارسال عکس سفارشی و ویدیو",
    Icon: MessageCircle,
    color: "bg-[#25D366]",
  },
  {
    label: "تماس تلفنی",
    value: "۰۲۱-۱۲۳۴۵۶۷۸",
    href: "tel:+982112345678",
    sub: "شنبه تا پنج‌شنبه ۱۰ تا ۱۸",
    Icon: Phone,
    color: "bg-primary",
  },
  {
    label: "ایمیل",
    value: "hello@bafkhaneh.ir",
    href: "mailto:hello@bafkhaneh.ir",
    sub: "پاسخ تا ۲۴ ساعت",
    Icon: Mail,
    color: "bg-secondary",
  },
  {
    label: "آدرس کارگاه",
    value: "تهران، خیابان هنر، کوچه کروشه",
    href: "#map",
    sub: "مراجعه حضوری فقط با هماهنگی",
    Icon: MapPin,
    color: "bg-accent text-accent-foreground",
  },
];

export default function ContactPage() {
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
                <BreadcrumbPage>تماس با من</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-accent/40">
        <div className="bg-knit absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
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
                <MessageSquareHeart className="size-3.5" />
                تماس با بافخانه
              </Badge>
              <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                بیا با هم <span className="text-primary">حرف بزنیم</span> ✿
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
                اگر سوالی درباره عروسک‌ها، سفارش خاص، الگوها یا حتی فقط می‌خوای
                سلام کنی، من اینجام! سریع‌ترین راه اینستاگرام و واتساپه ولی از هر
                راهی که دوست داری پیام بده — خودم جواب می‌دم.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <a href="https://wa.me/989123456789" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4" />
                    واتساپ مستقیم
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2 bg-background">
                  <a href="https://instagram.com/bafkhaneh" target="_blank" rel="noopener noreferrer">
                    <Instagram className="size-4" />
                    اینستاگرام
                  </a>
                </Button>
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                  <span className="size-2 animate-pulse rounded-full bg-green-500" />
                  معمولا تا ۲ ساعت جواب می‌دم
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                  <Clock className="size-3.5" />
                  ۱۰ صبح تا ۱۰ شب
                </span>
              </div>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-primary/10 blur-2xl" />
              <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card shadow-xl">
                <div className="p-2">
                  <div className="rounded-[1.6rem] bg-accent/40 p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <Heart className="size-6" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">من اینجام برای تو</p>
                        <p className="text-[11px] text-muted-foreground">یک نفر، یک قلاب، با عشق</p>
                      </div>
                      <BadgeCheck className="mr-auto size-5 text-primary" />
                    </div>

                    <div className="grid gap-3">
                      {CONTACTS.slice(0, 4).map(({ label, value, href, Icon }) => (
                        <a
                          key={label}
                          href={href}
                          target={href.startsWith("http") ? "_blank" : undefined}
                          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3 transition-all hover:border-primary/30 hover:shadow-md"
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Icon className="size-5" />
                          </span>
                          <div className="flex flex-col items-start leading-tight">
                            <span className="text-xs text-muted-foreground">{label}</span>
                            <span className="text-sm font-bold text-foreground">{value}</span>
                          </div>
                          <ArrowLeft className="mr-auto size-4 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
              <div className="absolute -bottom-4 left-6 flex items-center gap-3 rounded-2xl border border-border/70 bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary/50 text-secondary-foreground">
                  <Sparkles className="size-5" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-bold text-foreground">پاسخگویی صمیمی</p>
                  <p className="text-[11px] text-muted-foreground">خودم جواب می‌دم، نه ربات</p>
                </div>
              </div>
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* CONTACT GRID */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionDiv {...fadeUp} className="mx-auto max-w-3xl text-center">
            <SectionHeading
              align="center"
              eyebrow="راه‌های ارتباطی"
              title="از هر راهی دوست داری پیام بده"
              subtitle="برای سفارش خاص، سوال درباره الگوها یا همکاری، این راه‌ها سریع‌ترین هستند."
            />
          </MotionDiv>

          <MotionDiv {...fadeUp} className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CONTACTS.map(({ label, value, sub, href, Icon, color }) => (
              <Card
                key={label}
                className="group relative flex flex-col gap-4 rounded-2xl border-border/60 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span className={`flex size-12 items-center justify-center rounded-2xl text-white shadow-sm ${color.includes("gradient") || color.startsWith("bg-[#") || color.startsWith("bg-primary") ? color : "bg-accent text-accent-foreground"} ${color.includes("text-") ? "" : ""}`}>
                    <Icon className="size-6" />
                  </span>
                  <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">فعال</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-bold text-foreground">{label}</h3>
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {value}
                  </a>
                  <p className="text-xs leading-6 text-muted-foreground">{sub}</p>
                </div>
                <Button asChild size="sm" variant="outline" className="mt-auto gap-1.5 rounded-xl">
                  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
                    ارتباط
                    <ArrowLeft className="size-4" />
                  </a>
                </Button>
              </Card>
            ))}
          </MotionDiv>
        </div>
      </section>

      {/* WHY CONTACT / HOURS */}
      <section className="bg-secondary/30 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <MotionDiv {...fadeUp} className="lg:col-span-2">
              <Card className="rounded-2xl border-border/60 bg-card p-6 sm:p-8 shadow-sm">
                <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Clock className="size-5 text-primary" />
                  ساعات پاسخگویی
                </h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-accent/40 p-4">
                    <p className="text-xs font-bold text-accent-foreground">شنبه تا پنج‌شنبه</p>
                    <p className="mt-1 text-sm font-bold text-foreground">۱۰:۰۰ صبح تا ۱۰:۰۰ شب</p>
                    <p className="mt-1 text-xs text-muted-foreground">پیام‌ها معمولا زیر ۲ ساعت پاسخ داده می‌شن</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 p-4">
                    <p className="text-xs font-bold text-primary">جمعه و تعطیلات</p>
                    <p className="mt-1 text-sm font-bold text-foreground">۱۱:۰۰ صبح تا ۸:۰۰ شب</p>
                    <p className="mt-1 text-xs text-muted-foreground">کمی با تاخیر ولی حتما جواب می‌دم ✿</p>
                  </div>
                </div>
                <div id="map" className="mt-6 rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-center">
                  <MapPin className="mx-auto size-6 text-muted-foreground" />
                  <p className="mt-2 text-sm font-bold text-foreground">تهران، خیابان هنر، کوچه کروشه، کارگاه بافخانه</p>
                  <p className="mt-1 text-xs text-muted-foreground">مراجعه حضوری فقط با هماهنگی قبلی از طریق واتساپ یا تماس</p>
                </div>
              </Card>
            </MotionDiv>

            <MotionDiv {...fadeUp} className="flex flex-col gap-6">
              <Card className="rounded-2xl border-primary/20 bg-primary/5 p-6 shadow-sm">
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <BadgeCheck className="size-4 text-primary" />
                  قبل از پیام، اینو بخون
                </h4>
                <ul className="mt-4 space-y-3 text-xs leading-7 text-muted-foreground">
                  <li className="flex gap-2"><span className="text-primary">•</span> برای سفارش خاص، لطفا عکس نمونه + ابعاد تقریبی + رنگ مورد نظر رو بفرست.</li>
                  <li className="flex gap-2"><span className="text-primary">•</span> الگوها دیجیتال هستن، بعد از خرید لینک دانلود در حساب کاربری فعال می‌شه.</li>
                  <li className="flex gap-2"><span className="text-primary">•</span> اگر بسته‌ت آسیب دیده، تا ۲۴ ساعت عکس بفرست تا پیگیری کنم.</li>
                </ul>
              </Card>

              <Card className="rounded-2xl border-border/60 bg-card p-6 shadow-sm">
                <h4 className="text-sm font-bold text-foreground">شبکه‌های اجتماعی</h4>
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
                <p className="mt-4 text-xs leading-6 text-muted-foreground">هر روز استوری از مراحل بافت می‌ذارم — بیا ببین چطور عروسک‌هات ساخته می‌شن!</p>
              </Card>
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <MotionDiv {...fadeUp} className="flex flex-col items-center gap-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/15">
              <Heart className="size-7" />
            </span>
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">سفارش خاص داری؟</h2>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-primary-foreground/85 sm:text-base">
                رنگ، سایز یا حتی اسم عروسک رو خودت انتخاب کن! کافیه تو واتساپ یا اینستاگرام بهم پیام بدی تا با هم ایده‌ات رو به واقعیت تبدیل کنیم.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="gap-2 bg-background text-foreground hover:bg-background/90">
                <a href="https://wa.me/989123456789" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" />
                  شروع چت واتساپ
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link href="/products">
                  دیدن محصولات
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            </div>
          </MotionDiv>
        </div>
      </section>
    </div>
  );
}