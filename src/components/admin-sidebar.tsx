"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Scissors,
  ShoppingBag,
  Users,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/patterns", label: "الگوها", icon: Scissors },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingBag },
  { href: "/admin/users", label: "کاربران", icon: Users },
];

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/80 hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-6">
          <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className="mb-3 px-2 pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                مدیریت
              </span>
            </div>
            <NavList pathname={pathname} />
          </div>
        </div>
      </aside>

      {/* Mobile drawer trigger */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="mb-3 gap-2"
              aria-label="منوی مدیریت"
            >
              <Menu className="size-4" />
              منوی مدیریت
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-right">منوی مدیریت</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6">
              <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
