"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ShoppingCart,
  User,
  Menu,
  ShieldCheck,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  ChevronDown,
  Heart,
  Layers,
  Leaf,
  Flame,
  Package,
  FileText,
  ChevronLeft,
  MessageCircle,
  Scale,
  Send,
  Instagram,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/store/cart";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import { toFa } from "@/lib/format";

type SessionUser = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: "ADMIN" | "CUSTOMER";
};

const PRODUCT_CATEGORIES = [
  { value: "عروسک و آمیگورومی", label: "عروسک و آمیگورومی", image: "/images/product-bear.png" },
  { value: "کلیدچین", label: "کلیدچین", image: "/images/product-heart-keychain.png" },
  { value: "گل کروشه", label: "گل کروشه", image: "/images/product-rose.png" },
  { value: "باجه گل", label: "باجه گل", image: "/images/product-bouquet.png" },
  { value: "لوازم تزئینی", label: "لوازم تزئینی", image: "/images/product-plantpot.png" },
] as const;

const PATTERN_LEVELS = [
  { value: "مبتدی", label: "مبتدی", desc: "شروع آسان", Icon: Leaf },
  { value: "متوسط", label: "متوسط", desc: "کمی تجربه", Icon: Layers },
  { value: "پیشرفته", label: "پیشرفته", desc: "حرفه‌ای", Icon: Flame },
] as const;

const ABOUT_LINKS = [
  { href: "/about", label: "درباره من", desc: "داستان بافخانه و ارزش‌ها", Icon: Heart },
  { href: "/contact", label: "تماس با من", desc: "اینستا، تلگرام، واتساپ", Icon: MessageCircle },
  { href: "/terms", label: "قوانین و مقررات", desc: "شرایط خرید و بازگشت", Icon: Scale },
] as const;

const NAV = [
  { href: "/", label: "خانه" },
  { href: "/products", label: "محصولات", type: "products" as const },
  { href: "/patterns", label: "الگوی کروشه", type: "patterns" as const },
  { href: "/about", label: "درباره من", type: "about" as const },
];

export function SiteHeader({ initialUser }: { initialUser?: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(initialUser ?? null);
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const totalItems = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null));
  }, [pathname]);

  const clearCart = useCart((s) => s.clear);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearCart();
    setUser(null);
    router.replace("/");
    router.refresh();
  }

  const [currentCategory, setCurrentCategory] = useState("");
  const [currentDifficulty, setCurrentDifficulty] = useState("");
  const [productsOpen, setProductsOpen] = useState(false);
  const [patternsOpen, setPatternsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      setCurrentCategory(sp.get("category") || "");
      setCurrentDifficulty(sp.get("difficulty") || "");
    }
  }, [pathname]);

  useEffect(() => {
    setProductsOpen(false);
    setPatternsOpen(false);
    setAboutOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-tight text-foreground">
              بافخانه
            </span>
            <span className="text-[10px] text-muted-foreground">خانهٔ کروشه دستی</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            if (item.type === "products") {
              return (
                <div
                  key={item.href}
                  className="relative group"
                  onMouseEnter={() => setProductsOpen(true)}
                  onMouseLeave={() => setProductsOpen(false)}
                >
                  <Link
                    href={item.href}
                    onClick={() => setProductsOpen(false)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "size-3.5 shrink-0 opacity-60 transition-transform duration-200",
                        productsOpen ? "rotate-180" : "group-hover:rotate-180"
                      )}
                    />
                  </Link>
                  <div
                    className={cn(
                      "absolute right-0 top-[calc(100%+8px)] z-50 transition-all duration-200",
                      productsOpen
                        ? "visible translate-y-0 opacity-100"
                        : "invisible translate-y-2 opacity-0 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
                    )}
                  >
                    <div className="absolute -top-3 right-0 h-3 w-full" />
                      <div className="min-w-[440px] max-w-[92vw] overflow-hidden rounded-2xl border border-border/60 bg-card p-2 shadow-xl">
                      <div className="p-1">
                        <Link
                          href="/products"
                          onClick={() => setProductsOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Package className="size-4" />
                          </span>
                          <div className="flex flex-col items-start leading-tight">
                            <span className="font-bold">همه محصولات</span>
                            <span className="text-[11px] text-muted-foreground">نمایش کل فروشگاه</span>
                          </div>
                        </Link>
                      </div>
                      <div className="my-1 h-px bg-border/60" />
                      <div className="px-1 py-1">
                        <p className="px-3 pb-2 text-[11px] font-bold tracking-wider text-muted-foreground">دسته‌بندی‌ها</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {PRODUCT_CATEGORIES.map(({ value, label, image }) => {
                            const activeCat = currentCategory === value && pathname.startsWith("/products");
                            return (
                              <Link
                                key={value}
                                href={`/products?category=${encodeURIComponent(value)}`}
                                onClick={() => setProductsOpen(false)}
                                className={cn(
                                   "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                                  activeCat
                                    ? "bg-accent text-accent-foreground"
                                    : "text-foreground hover:bg-accent/70 hover:text-accent-foreground"
                                )}
                              >
                                <span className="size-9 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-card">
                                  <img src={image} alt={label} className="h-full w-full object-cover" loading="lazy" />
                                </span>
                                {label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-1 rounded-xl bg-primary/5 p-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
                          <Heart className="size-3" /> پیشنهاد بافخانه
                        </p>
                        <p className="mt-1 text-xs leading-6 text-muted-foreground">
                          عروسک‌های آمیگورومی دست‌بافت با نخ پنبه ضد حساسیت — هدیه‌ای از قلب!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (item.type === "patterns") {
              return (
                <div
                  key={item.href}
                  className="relative group"
                  onMouseEnter={() => setPatternsOpen(true)}
                  onMouseLeave={() => setPatternsOpen(false)}
                >
                  <Link
                    href={item.href}
                    onClick={() => setPatternsOpen(false)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "size-3.5 shrink-0 opacity-60 transition-transform duration-200",
                        patternsOpen ? "rotate-180" : "group-hover:rotate-180"
                      )}
                    />
                  </Link>
                  <div
                    className={cn(
                      "absolute right-0 top-[calc(100%+8px)] z-50 transition-all duration-200",
                      patternsOpen
                        ? "visible translate-y-0 opacity-100"
                        : "invisible translate-y-2 opacity-0 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
                    )}
                  >
                    <div className="absolute -top-3 right-0 h-3 w-full" />
                    <div className="min-w-[300px] overflow-hidden rounded-2xl border border-border/60 bg-card p-2 shadow-xl">
                      <div className="p-1">
                        <Link
                          href="/patterns"
                          onClick={() => setPatternsOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary/40 text-secondary-foreground">
                            <FileText className="size-4" />
                          </span>
                          <div className="flex flex-col items-start leading-tight">
                            <span className="font-bold">همه الگوها</span>
                            <span className="text-[11px] text-muted-foreground">مرور همه آموزش‌های کروشه</span>
                          </div>
                        </Link>
                      </div>
                      <div className="my-1 h-px bg-border/60" />
                      <div className="px-1 py-1">
                        <p className="px-3 pb-2 text-[11px] font-bold tracking-wider text-muted-foreground">سطح دشواری</p>
                        <div className="grid gap-1">
                          {PATTERN_LEVELS.map(({ value, label, desc, Icon }) => {
                            const activeDiff = currentDifficulty === value && pathname.startsWith("/patterns");
                            return (
                              <Link
                                key={value}
                                href={`/patterns?difficulty=${encodeURIComponent(value)}`}
                                onClick={() => setPatternsOpen(false)}
                                className={cn(
                                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                                  activeDiff
                                    ? "bg-accent text-accent-foreground"
                                    : "text-foreground hover:bg-accent/70 hover:text-accent-foreground"
                                )}
                              >
                                <span className="flex items-center gap-2.5">
                                  <span className={cn("flex size-8 items-center justify-center rounded-lg", activeDiff ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground")}>
                                    <Icon className="size-4" />
                                  </span>
                                  <span className="flex flex-col items-start leading-tight">
                                    <span>{label}</span>
                                    <span className="text-[11px] text-muted-foreground">{desc}</span>
                                  </span>
                                </span>
                                <ChevronLeft className="size-3.5 opacity-40" />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-1 rounded-xl bg-secondary/30 p-3">
                        <p className="text-xs leading-6 text-muted-foreground">
                          <span className="font-bold text-foreground">✿ نکته:</span> بعد از خرید، PDF الگو بلافاصله در حساب کاربری شما فعال می‌شود.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (item.type === "about") {
              return (
                <div
                  key={item.href}
                  className="relative group"
                  onMouseEnter={() => setAboutOpen(true)}
                  onMouseLeave={() => setAboutOpen(false)}
                >
                  <Link
                    href={item.href}
                    onClick={() => setAboutOpen(false)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "size-3.5 shrink-0 opacity-60 transition-transform duration-200",
                        aboutOpen ? "rotate-180" : "group-hover:rotate-180"
                      )}
                    />
                  </Link>
                  <div
                    className={cn(
                      "absolute right-0 top-[calc(100%+8px)] z-50 transition-all duration-200",
                      aboutOpen
                        ? "visible translate-y-0 opacity-100"
                        : "invisible translate-y-2 opacity-0 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
                    )}
                  >
                    <div className="absolute -top-3 right-0 h-3 w-full" />
                    <div className="min-w-[300px] overflow-hidden rounded-2xl border border-border/60 bg-card p-2 shadow-xl">
                      <div className="px-1 py-1">
                        <p className="px-3 pb-2 text-[11px] font-bold tracking-wider text-muted-foreground">درباره بافخانه</p>
                        <div className="grid gap-1">
                          {ABOUT_LINKS.map(({ href, label, desc, Icon }) => {
                            const active = pathname === href || (href !== "/about" && pathname.startsWith(href));
                            return (
                              <Link
                                key={href}
                                href={href}
                                onClick={() => setAboutOpen(false)}
                                className={cn(
                                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                                  active
                                    ? "bg-accent text-accent-foreground"
                                    : "text-foreground hover:bg-accent/70 hover:text-accent-foreground"
                                )}
                              >
                                <span className={cn("flex size-9 items-center justify-center rounded-xl", active ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground")}>
                                  <Icon className="size-4" />
                                </span>
                                <span className="flex flex-col items-start leading-tight">
                                  <span className="font-bold">{label}</span>
                                  <span className="text-[11px] text-muted-foreground">{desc}</span>
                                </span>
                                <ChevronLeft className="mr-auto size-3.5 opacity-40" />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-1 rounded-xl bg-accent/40 p-3">
                        <div className="flex items-center gap-2">
                          <a
                            href="https://instagram.com/bafkhaneh"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setAboutOpen(false)}
                            aria-label="اینستاگرام بافخانه"
                            className="flex size-7 items-center justify-center rounded-lg bg-background transition-all hover:scale-110 hover:shadow-sm"
                          >
                            <Instagram className="size-4 text-pink-500" />
                          </a>
                          <a
                            href="https://t.me/bafkhaneh"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setAboutOpen(false)}
                            aria-label="تلگرام بافخانه"
                            className="flex size-7 items-center justify-center rounded-lg bg-background transition-all hover:scale-110 hover:shadow-sm"
                          >
                            <Send className="size-4 text-[#229ED9]" />
                          </a>
                          <a
                            href="https://wa.me/989123456789"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setAboutOpen(false)}
                            aria-label="واتساپ بافخانه"
                            className="flex size-7 items-center justify-center rounded-lg bg-background transition-all hover:scale-110 hover:shadow-sm"
                          >
                            <MessageCircle className="size-4 text-[#25D366]" />
                          </a>
                          <span className="mr-auto text-[11px] text-muted-foreground">بافخانه در شبکه‌های اجتماعی</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Link href="/cart" className="relative">
            <Button variant="ghost" size="icon" aria-label="سبد خرید">
              <ShoppingCart className="size-5" />
            </Button>
            {mounted && totalItems > 0 && (
              <span className="absolute -top-0.5 -left-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {toFa(totalItems)}
              </span>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            aria-label="تغییر تم"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>

          {user ? (
            <div className="hidden items-center gap-1.5 sm:flex">
              {user.role === "ADMIN" && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">
                    <ShieldCheck className="size-4" />
                    پیشخوان مدیریت
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href="/account">
                  <User className="size-4" />
                  {user.name.split(" ")[0]}
                </Link>
              </Button>
              <Button onClick={logout} variant="ghost" size="icon" aria-label="خروج">
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">ورود</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">ثبت‌نام</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="منو">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto">
              <SheetHeader className="pr-12">
                <SheetTitle className="text-right">بافخانه</SheetTitle>
              </SheetHeader>

              <div className="mt-4 flex flex-col gap-4 px-4 pb-8">
                <div className="flex flex-col gap-1">
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === "/" ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent"
                    )}
                  >
                    خانه
                  </Link>

                  {/* Products mobile */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between rounded-xl px-3 py-2.5">
                      <Link href="/products" onClick={() => setOpen(false)} className="text-sm font-bold text-foreground">
                        محصولات
                      </Link>
                      <span className="text-[11px] text-muted-foreground">دسته‌بندی‌ها</span>
                    </div>
                    <div className="mr-2 flex flex-col gap-1 border-r-2 border-border/60 pr-2">
                      <Link href="/products" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                        <Package className="size-4" />
                        همه محصولات
                      </Link>
                      {PRODUCT_CATEGORIES.map(({ value, label, image }) => (
                        <Link
                          key={value}
                          href={`/products?category=${encodeURIComponent(value)}`}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                            currentCategory === value && pathname.startsWith("/products")
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <span className="size-6 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-card">
                            <img src={image} alt={label} className="h-full w-full object-cover" loading="lazy" />
                          </span>
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Patterns mobile */}
                  <div className="mt-1 flex flex-col">
                    <div className="flex items-center justify-between rounded-xl px-3 py-2.5">
                      <Link href="/patterns" onClick={() => setOpen(false)} className="text-sm font-bold text-foreground">
                        الگوی کروشه
                      </Link>
                      <span className="text-[11px] text-muted-foreground">سطح‌ها</span>
                    </div>
                    <div className="mr-2 flex flex-col gap-1 border-r-2 border-border/60 pr-2">
                      <Link href="/patterns" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                        <FileText className="size-4" />
                        همه الگوها
                      </Link>
                      {PATTERN_LEVELS.map(({ value, label, Icon }) => (
                        <Link
                          key={value}
                          href={`/patterns?difficulty=${encodeURIComponent(value)}`}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                            currentDifficulty === value && pathname.startsWith("/patterns")
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <Icon className="size-4" />
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* About mobile - with terms & contact */}
                  <div className="mt-1 flex flex-col">
                    <div className="flex items-center justify-between rounded-xl px-3 py-2.5">
                      <Link href="/about" onClick={() => setOpen(false)} className="text-sm font-bold text-foreground">
                        درباره من
                      </Link>
                      <span className="text-[11px] text-muted-foreground">اطلاعات</span>
                    </div>
                    <div className="mr-2 flex flex-col gap-1 border-r-2 border-border/60 pr-2">
                      {ABOUT_LINKS.map(({ href, label, Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                            pathname === href || (href !== "/about" && pathname.startsWith(href))
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <Icon className="size-4" />
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="my-1 h-px bg-border" />

                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent w-full"
                >
                  {mounted && theme === "dark" ? (
                    <>
                      <Sun className="size-4" /> حالت روز
                    </>
                  ) : (
                    <>
                      <Moon className="size-4" /> حالت شب
                    </>
                  )}
                </button>

                {user ? (
                  <>
                    {user.role === "ADMIN" && (
                      <Link href="/admin" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
                        پیشخوان مدیریت
                      </Link>
                    )}
                    <Link href="/account" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
                      حساب کاربری
                    </Link>
                    <button
                      onClick={() => {
                        setOpen(false);
                        logout();
                      }}
                      className="rounded-xl px-3 py-2.5 text-right text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      خروج از حساب
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
                      ورود
                    </Link>
                    <Link href="/signup" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
                      ثبت‌نام
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}