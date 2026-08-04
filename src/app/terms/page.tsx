import Link from "next/link";
import {
  Scale,
  Users,
  Mail,
  ShieldCheck,
  FileText,
  UserCircle,
  ShoppingBag,
  Truck,
  PackageX,
  RefreshCcw,
  FileSearch,
  Tag,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Heart,
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
  title: "قوانین و مقررات | بافخانه",
  description:
    "شرایط و قوانین خرید از فروشگاه اینترنتی بافخانه — قوانین عمومی، حریم خصوصی، ثبت سفارش، ارسال، بازگشت کالا و قیمت‌گذاری.",
};

const SECTIONS = [
  { id: "intro", label: "مقدمه و پذیرش قوانین", Icon: AlertCircle },
  { id: "general", label: "قوانین عمومی", Icon: Scale },
  { id: "user-def", label: "تعریف مشتری یا کاربر", Icon: Users },
  { id: "electronic", label: "ارتباطات الکترونیکی", Icon: Mail },
  { id: "privacy", label: "حریم خصوصی", Icon: ShieldCheck },
  { id: "intellectual", label: "مالکیت معنوی و الگوهای کروشه", Icon: FileText },
  { id: "account", label: "حساب کاربری", Icon: UserCircle },
  { id: "order", label: "ثبت و پردازش سفارش", Icon: ShoppingBag },
  { id: "shipping", label: "نحوه ارسال و تحویل", Icon: Truck },
  { id: "damage", label: "خسارت در هنگام حمل و نقل", Icon: PackageX },
  { id: "return", label: "بازگشت و تعویض کالا", Icon: RefreshCcw },
  { id: "content", label: "محتوای سایت", Icon: FileSearch },
  { id: "pricing", label: "سیاست قیمت‌گذاری", Icon: Tag },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function TermsPage() {
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
                <BreadcrumbPage>قوانین و مقررات</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-accent/40">
        <div className="bg-knit absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <MotionDiv
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge
              variant="secondary"
              className="mx-auto mb-4 gap-1.5 rounded-full bg-secondary/70 px-3 py-1.5 text-xs font-medium text-secondary-foreground"
            >
              <Scale className="size-3.5" />
              قوانین و مقررات بافخانه
            </Badge>
            <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.6rem]">
              شرایط و قوانین خرید از{" "}
              <span className="text-primary">بافخانه</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
              دوست عزیز؛ برای تجربه‌ای بهتر و شفاف‌تر از خرید عروسک‌های دست‌بافت،
              کلیدچین‌ها و الگوهای کروشه، لطفاً موارد زیر را با دقت مطالعه
              کنید. ورود و خرید از بافخانه به معنای آگاهی و پذیرش کامل این
              قوانین است.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1">
                <span className="size-2 rounded-full bg-green-500" />
                آخرین به‌روزرسانی: ۱۳ مرداد ۱۴۰۴
              </span>
            </div>
          </MotionDiv>
        </div>
      </section>

      {/* MAIN */}
      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Mobile TOC - shown on top for responsive */}
          <MotionDiv {...fadeUp} className="mb-6 lg:hidden">
            <Card className="rounded-2xl border-border/60 bg-card p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <FileSearch className="size-4 text-primary" />
                پرش سریع به بخش‌ها
              </h3>
              <div className="flex flex-wrap gap-2">
                {SECTIONS.map(({ id, label }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="rounded-full border border-border/60 bg-background px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground hover:border-primary/30"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </Card>
          </MotionDiv>

          <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
            {/* TOC Sidebar - Desktop only */}
            <MotionDiv
              {...fadeUp}
              className="hidden lg:sticky lg:top-24 lg:block"
            >
              <Card className="rounded-2xl border-border/60 bg-card p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                  <FileSearch className="size-4 text-primary" />
                  فهرست مطالب
                </h3>
                <nav className="flex flex-col gap-1">
                  {SECTIONS.map(({ id, label, Icon }) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Icon className="size-4 shrink-0 opacity-70 group-hover:opacity-100" />
                      {label}
                    </a>
                  ))}
                </nav>
                <div className="mt-6 rounded-xl bg-primary/5 p-4">
                  <p className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
                    <Heart className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    بافخانه یک کارگاه کوچک خانگیه، نه یک فروشگاه بزرگ. همه قوانین
                    با نگاه منصفانه و دوستانه تنظیم شده تا هم از حقوق شما و هم از
                    زحمت دست‌سازها محافظت بشه.
                  </p>
                </div>
              </Card>
            </MotionDiv>

            {/* Content */}
            <div className="flex flex-col gap-6">
              {/* Notice */}
              <MotionDiv {...fadeUp}>
                <Card className="rounded-2xl border-primary/20 bg-primary/5 p-5 shadow-sm">
                  <div className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <AlertCircle className="size-5" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <h2 className="text-sm font-bold text-foreground">
                        پذیرش قوانین به معنای توافق قبلی است
                      </h2>
                      <p className="text-xs leading-7 text-muted-foreground sm:text-sm">
                        ورود به سایت بافخانه، استفاده از پروفایل شخصی، مرور
                        الگوها و محصولات و ثبت هر سفارش، به معنای آگاه بودن از
                        تمام شرایط این صفحه و پذیرش کامل آن‌هاست. این صفحه
                        جایگزین کلیه توافق‌های قبلی محسوب می‌شود و در صورت بروز
                        تغییر، نسخه جدید در همین صفحه منتشر خواهد شد.
                      </p>
                    </div>
                  </div>
                </Card>
              </MotionDiv>

              {/* Sections */}
              <div className="flex flex-col gap-6">
                <MotionDiv {...fadeUp} id="intro" className="scroll-mt-28">
                  <Card className="rounded-2xl border-border/60 p-6 shadow-sm sm:p-8">
                    <SectionBadge Icon={AlertCircle} label="بخش ۱" />
                    <h2 className="mt-3 text-xl font-extrabold text-foreground">مقدمه و پذیرش قوانین</h2>
                    <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground">
                      <p>کاربر گرامی، خوش آمدید به بافخانه! بافخانه فروشگاه آنلاین عروسک‌های آمیگورومی، کلیدچین، گل کروشه، باجه گل و الگوهای آموزشی کروشه است که به صورت کاملاً دست‌بافت و خانگی توسط یک نفر اداره می‌شود.</p>
                      <p>با ورود به سایت و استفاده از خدمات بافخانه، شما تأیید می‌کنید که شرایط و قوانین زیر را به طور کامل خوانده‌اید و پذیرفته‌اید. همچنین ثبت سفارش در هر زمان به منزله پذیرش مجدد و کامل این قوانین است.</p>
                      <p>اگر با بخشی از این قوانین موافق نیستید، لطفاً از ثبت سفارش خودداری کنید و از طریق بخش ارتباط با ما، سؤال خود را بپرسید.</p>
                    </div>
                  </Card>
                </MotionDiv>

                <MotionDiv {...fadeUp} id="general" className="scroll-mt-28">
                  <Card className="rounded-2xl border-border/60 p-6 shadow-sm sm:p-8">
                    <SectionBadge Icon={Scale} label="بخش ۲" />
                    <h2 className="mt-3 text-xl font-extrabold text-foreground">قوانین عمومی</h2>
                    <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground">
                      <p>کلیه اصول و رویه‌های بافخانه منطبق با قوانین جمهوری اسلامی ایران، قانون تجارت الکترونیک و قانون حمایت از حقوق مصرف‌کنندگان است.</p>
                      <ul className="list-disc space-y-2 pr-5 marker:text-primary">
                        <li>کاربران موظف به رعایت قوانین و شئونات کاربری و اخلاقی در هنگام استفاده از سایت، ثبت نظر و ارتباط با پشتیبانی هستند.</li>
                        <li>در صورت تغییر در قوانین، رویه‌ها یا سرویس‌های بافخانه، تغییرات در همین صفحه منتشر و به اطلاع کاربران خواهد رسید. ادامه استفاده از سایت به معنای پذیرش قوانین جدید است.</li>
                        <li>بافخانه یک کسب‌وکار کوچک خانگی است؛ لطفاً در نظر داشته باشید ظرفیت تولید روزانه محدود است و برخی سفارش‌های خاص ممکن است نیاز به زمان‌بندی مجدد داشته باشد.</li>
                      </ul>
                    </div>
                  </Card>
                </MotionDiv>

                <MotionDiv {...fadeUp} id="user-def" className="scroll-mt-28">
                  <Card className="rounded-2xl border-border/60 p-6 shadow-sm sm:p-8">
                    <SectionBadge Icon={Users} label="بخش ۳" />
                    <h2 className="mt-3 text-xl font-extrabold text-foreground">تعریف مشتری یا کاربر</h2>
                    <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground">
                      <p>مشتری یا کاربر به شخصی گفته می‌شود که با اطلاعات کاربری صحیح (نام، شماره موبایل، ایمیل) در بافخانه ثبت‌نام کرده و به قصد مشاهده، خرید محصول فیزیکی (عروسک، کلیدچین، گل، باجه گل، لوازم تزئینی) یا خرید الگوی دیجیتال کروشه اقدام می‌کند.</p>
                      <p>هر کاربر فقط مجاز به داشتن یک حساب کاربری است. در صورت مشاهده فعالیت مشکوک یا استفاده از ربات برای خرید الگوها، بافخانه حق مسدودسازی حساب را دارد.</p>
                    </div>
                  </Card>
                </MotionDiv>

                <MotionDiv {...fadeUp} id="electronic" className="scroll-mt-28">
                  <Card className="rounded-2xl border-border/60 p-6 shadow-sm sm:p-8">
                    <SectionBadge Icon={Mail} label="بخش ۴" />
                    <h2 className="mt-3 text-xl font-extrabold text-foreground">ارتباطات الکترونیکی</h2>
                    <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground">
                      <p>هر گونه ارتباط با بافخانه به صورت الکترونیکی انجام می‌شود؛ شامل ثبت سفارش، دریافت کد پیگیری، پاسخ پشتیبانی و اطلاع از وضعیت ارسال از طریق ایمیل، پیامک و پنل کاربری.</p>
                      <ul className="list-disc space-y-2 pr-5 marker:text-primary">
                        <li>با ثبت سفارش، شما موافقت خود را برای دریافت پیامک و ایمیل‌های مرتبط با سفارش (تأیید، ارسال، کد پیگیری) اعلام می‌کنید.</li>
                        <li>برای اطلاع‌رسانی جشنواره‌ها، آموزش‌های جدید کروشه و تخفیف‌های فصلی، ممکن است بافخانه برای شما ایمیل یا پیامک ارسال کند. در هر زمان می‌توانید از طریق پروفایل کاربری یا لینک لغو اشتراک، دریافت خبرنامه را لغو کنید.</li>
                        <li>تنها مرجع رسمی ارتباطی بافخانه آدرس <span className="font-bold text-foreground">bafkhaneh.ir</span> و ایمیل <span className="font-bold text-foreground">hello@bafkhaneh.ir</span> است.</li>
                      </ul>
                    </div>
                  </Card>
                </MotionDiv>

                <MotionDiv {...fadeUp} id="privacy" className="scroll-mt-28">
                  <Card className="rounded-2xl border-border/60 p-6 shadow-sm sm:p-8">
                    <SectionBadge Icon={ShieldCheck} label="بخش ۵" />
                    <h2 className="mt-3 text-xl font-extrabold text-foreground">سیاست‌های حریم خصوصی</h2>
                    <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground">
                      <p>بافخانه به اطلاعات خصوصی شما احترام می‌گذارد و خود را متعهد به محافظت از آن می‌داند.</p>
                      <ul className="list-disc space-y-2 pr-5 marker:text-primary">
                        <li>اطلاعات ثبت شده مانند نام، آدرس، شماره موبایل و ایمیل، فقط برای پردازش سفارش، ارسال محصول و پشتیبانی استفاده می‌شود و در اختیار شخص ثالث قرار نمی‌گیرد.</li>
                        <li>تمامی پرداخت‌ها از طریق درگاه‌های امن بانکی انجام می‌شود و بافخانه هیچ دسترسی به اطلاعات کارت بانکی شما ندارد.</li>
                        <li>ما از تکنولوژی‌های امنیتی برای حفظ اطلاعات حساب کاربری شما استفاده می‌کنیم، با این حال مسئولیت حفظ رمز عبور بر عهده خود کاربر است.</li>
                      </ul>
                    </div>
                  </Card>
                </MotionDiv>

                <MotionDiv {...fadeUp} id="intellectual" className="scroll-mt-28">
                  <Card className="rounded-2xl border-border/60 p-6 shadow-sm sm:p-8">
                    <SectionBadge Icon={FileText} label="بخش ۶" />
                    <h2 className="mt-3 text-xl font-extrabold text-foreground">مالکیت معنوی و الگوهای کروشه</h2>
                    <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground">
                      <p>تمام محتوای تولید شده در بافخانه شامل متن‌ها، عکس‌ها، ویدیوها، لوگو، طراحی عروسک‌ها و به ویژه <span className="font-bold text-foreground">فایل‌های PDF الگوی کروشه</span>، جزو اموال معنوی بافخانه محسوب می‌شود.</p>
                      <ul className="list-disc space-y-2 pr-5 marker:text-primary">
                        <li>هرگونه کپی، بازنشر، فروش مجدد یا اشتراک‌گذاری الگوهای خریداری شده (حتی به صورت رایگان در شبکه‌های اجتماعی) بدون اجازه کتبی، غیرمجاز و دارای پیگرد قانونی است.</li>
                        <li>شما با خرید الگو، اجازه استفاده شخصی و بافت محصول برای خود یا فروش محصول بافته شده (با ذکر منبع: الگو از بافخانه) را دارید، اما اجازه فروش خودِ الگو را ندارید.</li>
                        <li>استفاده از اسکریپت‌ها، ربات‌ها، داده‌کاوی و استخراج اطلاعات محصولات و قیمت‌ها بدون اجازه رسمی ممنوع است.</li>
                      </ul>
                      <div className="rounded-xl bg-amber-500/10 p-4 text-[13px] leading-7 text-amber-900 dark:text-amber-100">
                        <span className="font-bold">نکته مهم درباره الگوها:</span> الگوهای دیجیتال ماه‌ها زمان برای طراحی و نگارش صرف شده‌اند. لطفاً با حمایت از خرید قانونی، به ادامه تولید آموزش‌های باکیفیت کمک کنید. ✿
                      </div>
                    </div>
                  </Card>
                </MotionDiv>

                <MotionDiv {...fadeUp} id="account" className="scroll-mt-28">
                  <Card className="rounded-2xl border-border/60 p-6 shadow-sm sm:p-8">
                    <SectionBadge Icon={UserCircle} label="بخش ۷" />
                    <h2 className="mt-3 text-xl font-extrabold text-foreground">حساب کاربری و مسئولیت‌ها</h2>
                    <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground">
                      <ul className="list-disc space-y-2 pr-5 marker:text-primary">
                        <li>کاربر موظف است اطلاعات خود را صحیح و کامل وارد کند. مسئولیت تمام فعالیت‌هایی که با حساب کاربری شما انجام می‌شود بر عهده خود شماست.</li>
                        <li>بافخانه محصولاتی مناسب برای همه سنین عرضه می‌کند، اما برای افراد زیر ۱۸ سال، ثبت سفارش و پرداخت باید با اطلاع و رضایت والدین یا قیم قانونی باشد.</li>
                        <li>در صورت فراموشی رمز عبور، از بخش «فراموشی رمز عبور» استفاده کنید. لینک بازیابی فقط به شماره یا ایمیل ثبت شده ارسال خواهد شد.</li>
                      </ul>
                    </div>
                  </Card>
                </MotionDiv>

                <MotionDiv {...fadeUp} id="order" className="scroll-mt-28">
                  <Card className="rounded-2xl border-border/60 p-6 shadow-sm sm:p-8">
                    <SectionBadge Icon={ShoppingBag} label="بخش ۸" />
                    <h2 className="mt-3 text-xl font-extrabold text-foreground">ثبت و پردازش سفارش</h2>
                    <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground">
                      <p>امکان ثبت سفارش در بافخانه به صورت ۲۴ ساعته و در تمام روزهای هفته وجود دارد. پردازش سفارش‌ها در روزهای کاری (شنبه تا پنج‌شنبه) و اولین روز بعد از تعطیلات رسمی انجام می‌شود.</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-accent/30 p-4">
                          <h4 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-foreground"><Heart className="size-4 text-primary" />محصولات فیزیکی</h4>
                          <p className="text-xs leading-7">عروسک‌ها و کلیدچین‌ها دست‌بافت هستند. زمان آماده‌سازی بین ۲ تا ۷ روز کاری (بسته به موجودی و سفارشی بودن) متغیر است. پس از ثبت، کد سفارش پیامک می‌شود و در پنل «سفارش‌های من» قابل پیگیری است.</p>
                        </div>
                        <div className="rounded-xl bg-secondary/30 p-4">
                          <h4 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-foreground"><FileText className="size-4 text-primary" />الگوهای دیجیتال</h4>
                          <p className="text-xs leading-7">پس از پرداخت موفق، فایل PDF الگو بلافاصله در حساب کاربری شما در بخش «الگوهای خریداری شده» فعال می‌شود و قابل دانلود است.</p>
                        </div>
                      </div>
                      <ul className="list-disc space-y-2 pr-5 marker:text-primary">
                        <li>لطفاً آدرس و شماره تماس را دقیق وارد کنید. در صورت ناقص بودن اطلاعات، سفارش قابل ارسال نخواهد بود.</li>
                        <li>اگر موجودی محصول فیزیکی پس از ثبت سفارش به اتمام برسد، حق لغو سفارش یا پیشنهاد کالای جایگزین برای بافخانه محفوظ است و وجه در صورت عدم تمایل شما عودت داده می‌شود.</li>
                        <li>بافخانه حق توقف فروش یا عدم پذیرش سفارش جدید را بدون اطلاع قبلی دارد، اما سفارش‌های ثبت شده قبلی پردازش خواهند شد.</li>
                      </ul>
                    </div>
                  </Card>
                </MotionDiv>

                <MotionDiv {...fadeUp} id="shipping" className="scroll-mt-28">
                  <Card className="rounded-2xl border-border/60 p-6 shadow-sm sm:p-8">
                    <SectionBadge Icon={Truck} label="بخش ۹" />
                    <h2 className="mt-3 text-xl font-extrabold text-foreground">نحوه ارسال و تحویل</h2>
                    <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground">
                      <p>من تمام تلاشم را می‌کنم که هر عروسک را با عشق بسته‌بندی کنم و سالم به دست شما برسانم.</p>
                      <ul className="list-disc space-y-2 pr-5 marker:text-primary">
                        <li>بسته‌بندی‌ها استاندارد، حباب‌دار و دوستدار محیط زیست است. برای باجه گل و محصولات بزرگ‌تر، از کارتن سخت استفاده می‌شود.</li>
                        <li>ارسال از طریق پست پیشتاز، تیپاکس یا پیک (برای تهران) بر اساس انتخاب شما در سبد خرید انجام می‌شود.</li>
                        <li>هزینه ارسال بر اساس وزن، ابعاد و شهر مقصد در مرحله ثبت سفارش نمایش داده می‌شود.</li>
                        <li>الگوهای کروشه نیازی به ارسال فیزیکی ندارند و به صورت آنی پس از پرداخت در دسترس شما قرار می‌گیرند.</li>
                      </ul>
                    </div>
                  </Card>
                </MotionDiv>

                <MotionDiv {...fadeUp} id="damage" className="scroll-mt-28">
                  <Card className="rounded-2xl border-border/60 p-6 shadow-sm sm:p-8">
                    <SectionBadge Icon={PackageX} label="بخش ۱۰" />
                    <h2 className="mt-3 text-xl font-extrabold text-foreground">خسارت در هنگام حمل و نقل</h2>
                    <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground">
                      <p>بافخانه نهایت دقت را برای تحویل سالم سفارش‌ها دارد، اما پس از تحویل مرسوله به شرکت حمل و نقل و اعلام بارنامه، مسئولیت حمل بر عهده شرکت مربوطه است.</p>
                      <ul className="list-disc space-y-2 pr-5 marker:text-primary">
                        <li>لطفاً در هنگام تحویل، بسته را جلوی مأمور پست باز و سلامت ظاهری آن را بررسی کنید و از مأمور رسید بگیرید.</li>
                        <li>هرگونه آسیب ناشی از حمل (پارگی، له‌شدگی شدید، مفقودی) باید حداکثر تا ۲۴ ساعت کاری پس از تحویل، با ارسال عکس و صورت‌جلسه شرکت حمل، به پشتیبانی بافخانه گزارش شود.</li>
                        <li>در صورت تأیید شرکت حمل، بافخانه برای جبران خسارت، تعمیر یا ارسال مجدد محصول اقدام خواهد کرد.</li>
                      </ul>
                    </div>
                  </Card>
                </MotionDiv>

                <MotionDiv {...fadeUp} id="return" className="scroll-mt-28">
                  <Card className="rounded-2xl border-border/60 p-6 shadow-sm sm:p-8">
                    <SectionBadge Icon={RefreshCcw} label="بخش ۱۱" />
                    <h2 className="mt-3 text-xl font-extrabold text-foreground">سرویس بازگشت و تعویض کالا</h2>
                    <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-border/60 p-4">
                          <h4 className="text-sm font-bold text-foreground">محصولات فیزیکی (عروسک، کلیدچین، گل)</h4>
                          <ul className="mt-2 list-disc space-y-1.5 pr-4 text-xs leading-7 marker:text-primary">
                            <li>وجود نقص فنی یا مغایرت واضح با سفارش ثبت شده</li>
                            <li>گزارش تا ۴۸ ساعت پس از تحویل با عکس و فیلم</li>
                            <li>کالا استفاده نشده و در بسته‌بندی اولیه باشد</li>
                            <li>سفارش‌های سفارشی و شخصی‌سازی شده قابل بازگشت نیستند</li>
                          </ul>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                          <h4 className="text-sm font-bold text-foreground">الگوهای دیجیتال کروشه</h4>
                          <ul className="mt-2 list-disc space-y-1.5 pr-4 text-xs leading-7 marker:text-primary">
                            <li>به دلیل ماهیت دیجیتال و دسترسی آنی، پس از دانلود یا مشاهده، امکان بازگشت وجه وجود ندارد</li>
                            <li>در صورت مشکل در دانلود یا خرابی فایل، پشتیبانی تا ۷ روز فایل را مجدداً در اختیار شما قرار می‌دهد</li>
                            <li>لطفاً قبل از خرید، سطح دشواری الگو را بررسی کنید</li>
                          </ul>
                        </div>
                      </div>
                      <p>برای استفاده از سرویس بازگشت، ابتدا با پشتیبانی تماس بگیرید. پس از تأیید کارشناس بافخانه، کالا را به همراه فاکتور ارسال کنید. هزینه ارسال بازگشت در صورت تأیید نقص از سمت بافخانه، بر عهده بافخانه است.</p>
                      <p>اگر کالای آسیب‌دیده ناموجود باشد، امکان تعویض با کالای مشابه یا عودت کامل مبلغ (بدون احتساب نوسان قیمت) وجود دارد.</p>
                    </div>
                  </Card>
                </MotionDiv>

                <MotionDiv {...fadeUp} id="content" className="scroll-mt-28">
                  <Card className="rounded-2xl border-border/60 p-6 shadow-sm sm:p-8">
                    <SectionBadge Icon={FileSearch} label="بخش ۱۲" />
                    <h2 className="mt-3 text-xl font-extrabold text-foreground">محتوای سایت</h2>
                    <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground">
                      <p>بافخانه برای تولید محتوا از منابع اصلی، تجربه شخصی بافت و مشخصات واقعی نخ‌ها و محصولات استفاده می‌کند و نهایت دقت را برای صحت اطلاعات به کار می‌گیرد، اما تضمین نمی‌کند که تمامی توضیحات بدون خطا باشد.</p>
                      <ul className="list-disc space-y-2 pr-5 marker:text-primary">
                        <li>رنگ محصولات در عکس ممکن است به دلیل نور و مانیتور، تا ۱۰٪ تفاوت داشته باشد. این موضوع شامل بازگشت نمی‌شود.</li>
                        <li>اگر تفاوت توضیحات با محصول دریافتی اساسی باشد، کالا باید استفاده نشده و در حالت اولیه بازگردانده شود تا شامل بازگشت شود.</li>
                        <li>بافخانه مسئولیتی در قبال حذف صفحات، لینک‌های موقت یا اختلال ناشی از عوامل خارج از کنترل (قطعی اینترنت، مشکلات مخابراتی) ندارد، اما تلاش می‌کند سرویس را پایدار نگه دارد.</li>
                        <li>بخش نظرات و پرسش و پاسخ برای تبادل نظر دوستانه است. از ثبت محتوای توهین‌آمیز، تبلیغاتی یا نامرتبط خودداری کنید.</li>
                      </ul>
                    </div>
                  </Card>
                </MotionDiv>

                <MotionDiv {...fadeUp} id="pricing" className="scroll-mt-28">
                  <Card className="rounded-2xl border-border/60 p-6 shadow-sm sm:p-8">
                    <SectionBadge Icon={Tag} label="بخش ۱۳" />
                    <h2 className="mt-3 text-xl font-extrabold text-foreground">سیاست قیمت‌گذاری</h2>
                    <div className="mt-4 space-y-4 text-sm leading-8 text-muted-foreground">
                      <p>قیمت‌گذاری در بافخانه بر اساس اصول مشتری‌مداری، احتساب هزینه نخ پنبه مرغوب، ساعت‌ها زمان بافت دستی، هزینه بسته‌بندی و حفظ قیمت منصفانه انجام می‌شود.</p>
                      <ul className="list-disc space-y-2 pr-5 marker:text-primary">
                        <li>قیمت محصولات فیزیکی به صورت خرده‌فروشی و با احتساب دستمزد هنر دست تعیین شده است.</li>
                        <li>قیمت الگوهای کروشه با توجه به سطح دشواری، تعداد صفحات آموزش و ویدیوهای همراه تعیین می‌شود.</li>
                        <li>هزینه بسته‌بندی، ارسال و بیمه حمل به صورت جداگانه در سبد خرید محاسبه و نمایش داده می‌شود.</li>
                        <li>با توجه به نوسانات بازار نخ و لوازم جانبی، بافخانه مجبور است قیمت‌ها را به‌روز نگه دارد. امکان اعلام قیمت قطعی قبل از ثبت نهایی وجود ندارد و قیمت لحظه ثبت، ملاک است.</li>
                        <li>در موارد نادر مانند اشتباه قیمتی یا اتمام موجودی پس از ثبت، بافخانه موظف است در اسرع وقت موضوع را اطلاع دهد و در صورت عدم امکان تأمین، مبلغ را عودت دهد.</li>
                        <li>اگر پس از ثبت سفارش، قیمت محصول کاهش یابد، ما قیمت جدید را برای شما اعمال خواهیم کرد — چون رضایت شما مهم‌تره! ✿</li>
                      </ul>
                    </div>
                  </Card>
                </MotionDiv>

                <MotionDiv {...fadeUp}>
                  <Card className="rounded-2xl border-primary/20 bg-accent/30 p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                          <Sparkles className="size-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-foreground">سؤالی درباره قوانین دارید؟</h3>
                          <p className="text-xs text-muted-foreground">من خودم پاسخگو هستم — با عشق و حوصله</p>
                        </div>
                      </div>
                      <p className="text-sm leading-8 text-muted-foreground">
                        اگر بعد از مطالعه این صفحه، هنوز ابهامی برایتان باقی مانده یا شرایط خاصی برای سفارش سفارشی دارید، خوشحال می‌شوم باهاتون صحبت کنم. مرجع رسمی بافخانه فقط سایت <span className="font-bold text-foreground">www.bafkhaneh.ir</span> و آدرس‌های درج شده در بخش ارتباط با ماست. بافخانه هیچ سایت دیگری با آدرس مشابه ندارد.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button asChild size="sm" className="gap-2">
                          <Link href="/about">درباره من<ArrowLeft className="size-4" /></Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="gap-2 bg-background">
                          <Link href="/products">مشاهده محصولات</Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </MotionDiv>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionBadge({ Icon, label }: { Icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-accent-foreground">
      <Icon className="size-3.5" />{label}
    </span>
  );
}