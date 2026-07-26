import Link from "next/link";
import { Sparkles, Instagram, Mail, Phone, MapPin } from "lucide-react";

export function SiteFooter() {
  const year = new Date().toLocaleDateString("fa-IR", { year: "numeric" });
  return (
    <footer className="mt-auto border-t border-border/70 bg-accent/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-5" />
            </span>
            <span className="text-lg font-extrabold">بافخانه</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
            بافخانه، گوشهٔ کوچک منه. با عشق و حوصله، هر عروسک و کلیدچین رو خودم کروشه
            می‌کنم تا شادی هنر دستی رو به خانهٔ شما بفرستم.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <a
              href="https://instagram.com/bafkhaneh"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="اینستاگرام"
              className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-primary"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href="mailto:hello@bafkhaneh.ir"
              aria-label="ایمیل"
              className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-primary"
            >
              <Mail className="size-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-foreground">دسترسی سریع</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li><Link href="/products" className="hover:text-primary">محصولات</Link></li>
            <li><Link href="/patterns" className="hover:text-primary">الگوی کروشه</Link></li>
            <li><Link href="/about" className="hover:text-primary">درباره من</Link></li>
            <li><Link href="/cart" className="hover:text-primary">سبد خرید</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-foreground">ارتباط با من</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" />
              <span>۰۲۱-۱۲۳۴۵۶۷۸</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0" />
              <span>hello@bafkhaneh.ir</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              <span>تهران، خیابان هنر</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© {year} بافخانه — تمامی حقوق محفوظ است.</p>
          <p>ساخته‌شده با ❤️ و قلاب و نخ‌های رنگارنگ</p>
        </div>
      </div>
    </footer>
  );
}
