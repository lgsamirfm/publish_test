"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart, User, Menu, ShieldCheck, LogOut, Sparkles, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  email: string;
  role: "ADMIN" | "CUSTOMER";
};

const NAV = [
  { href: "/", label: "خانه" },
  { href: "/products", label: "محصولات" },
  { href: "/patterns", label: "الگوی کروشه" },
  { href: "/about", label: "درباره من" },
];

export function SiteHeader({ initialUser }: { initialUser?: SessionUser | null }) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(initialUser ?? null);
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const totalItems = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  // Re-fetch on client-side navigation (e.g. after login/logout elsewhere).
  // The initial render already uses the server-provided initialUser, so there
  // is no flash of login/signup buttons.
  useEffect(() => {
    // Skip the very first run — initialUser already holds the correct state.
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
    window.location.href = "/";
  }

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
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
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

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="تغییر تم"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? (
              <Sun className="size-5" />
            ) : (
              <Moon className="size-5" />
            )}
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

          {/* Mobile menu — button on the left, drawer opens from the left */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="منو">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader className="pr-12">
                <SheetTitle className="text-right">بافخانه</SheetTitle>
              </SheetHeader>
              <div className="mt-2 flex flex-col gap-1 px-4 pb-6">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-2 h-px bg-border" />
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent w-full"
                >
                  {mounted && theme === "dark" ? (
                    <><Sun className="size-4" /> حالت روز</>
                  ) : (
                    <><Moon className="size-4" /> حالت شب</>
                  )}
                </button>
                {user ? (
                  <>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                      >
                        پیشخوان مدیریت
                      </Link>
                    )}
                    <Link
                      href="/account"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      حساب کاربری
                    </Link>
                    <button
                      onClick={() => {
                        setOpen(false);
                        logout();
                      }}
                      className="rounded-lg px-3 py-2.5 text-right text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      خروج از حساب
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      ورود
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                    >
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
