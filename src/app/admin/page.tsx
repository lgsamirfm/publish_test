"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Scissors,
  ShoppingBag,
  Users,
  Wallet,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImageFallback } from "@/components/image-fallback";
import {
  StatusBadge,
  StockBadge,
} from "@/components/admin/status-badge";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { formatPrice, formatDateTime, toFa } from "@/lib/format";

type Stats = {
  counts: {
    products: number;
    patterns: number;
    orders: number;
    users: number;
  };
  revenue: number;
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
    itemsCount: number;
    user: { id: string; name: string; email: string } | null;
  }>;
  lowStock: Array<{
    id: string;
    name: string;
    images: string;
    category: string;
    stock: number;
    price: number;
  }>;
  ordersByStatus: Record<string, number>;
  ordersLast7Days: Array<{ date: string; count: number }>;
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "oklch(0.78 0.13 75)",
  PAID: "oklch(0.70 0.13 150)",
  SHIPPED: "oklch(0.70 0.10 240)",
  DELIVERED: "oklch(0.70 0.10 180)",
  CANCELLED: "oklch(0.62 0.20 25)",
};

function shortId(id: string) {
  return id.slice(-6).toUpperCase();
}

function faDateLabel(iso: string) {
  const d = new Date(iso);
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      weekday: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return toFa(d.getDate());
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        if (!res.ok) throw new Error("خطا در دریافت آمار");
        const data = (await res.json()) as Stats;
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "خطا");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = stats
    ? [
        {
          label: "محصولات",
          value: toFa(stats.counts.products),
          icon: Package,
          tint: "bg-primary/10 text-primary",
        },
        {
          label: "الگوها",
          value: toFa(stats.counts.patterns),
          icon: Scissors,
          tint: "bg-secondary/40 text-secondary-foreground",
        },
        {
          label: "سفارش‌ها",
          value: toFa(stats.counts.orders),
          icon: ShoppingBag,
          tint: "bg-accent text-accent-foreground",
        },
        {
          label: "کاربران",
          value: toFa(stats.counts.users),
          icon: Users,
          tint: "bg-primary/10 text-primary",
        },
        {
          label: "درآمد کل",
          value: formatPrice(stats.revenue),
          icon: Wallet,
          tint: "bg-emerald-100 text-emerald-700",
          wide: true,
        },
      ]
    : [];

  const statusChartData = stats
    ? (Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((k) => ({
        name: ORDER_STATUS_LABELS[k],
        key: k,
        count: stats.ordersByStatus[k] ?? 0,
      }))
    : [];

  const weekChartData = stats
    ? stats.ordersLast7Days.map((d) => ({
        name: faDateLabel(d.date),
        count: d.count,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">داشبورد</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          نمای کلی فروشگاه بافخانه
        </p>
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))
              : statCards.map((c) => {
                  const Icon = c.icon;
                  return (
                    <Card
                      key={c.label}
                      className={
                        c.wide
                          ? "col-span-2 rounded-2xl lg:col-span-2"
                          : "rounded-2xl"
                      }
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <span
                          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${c.tint}`}
                        >
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">
                            {c.label}
                          </div>
                          <div className="truncate text-lg font-bold text-foreground">
                            {c.value}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-4 text-primary" />
                  سفارش‌های هفت روز گذشته
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full rounded-xl" />
                ) : (
                  <div className="h-64 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={weekChartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="oklch(0.88 0.022 75)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "oklch(0.5 0.02 60)" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: "oklch(0.5 0.02 60)" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "oklch(0.92 0.045 75 / 0.5)" }}
                          contentStyle={{
                            borderRadius: "0.75rem",
                            border: "1px solid oklch(0.88 0.022 75)",
                            fontSize: "12px",
                            fontFamily: "inherit",
                          }}
                          formatter={(v: number) => [toFa(v), "تعداد"]}
                        />
                        <Bar
                          dataKey="count"
                          fill="oklch(0.60 0.15 38)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingBag className="size-4 text-primary" />
                  سفارش‌ها بر اساس وضعیت
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full rounded-xl" />
                ) : (
                  <div className="h-64 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={statusChartData}
                        layout="vertical"
                        margin={{ top: 10, right: 10, left: 30, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="oklch(0.88 0.022 75)"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: "oklch(0.5 0.02 60)" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "oklch(0.5 0.02 60)" }}
                          tickLine={false}
                          axisLine={false}
                          width={70}
                        />
                        <Tooltip
                          cursor={{ fill: "oklch(0.92 0.045 75 / 0.5)" }}
                          contentStyle={{
                            borderRadius: "0.75rem",
                            border: "1px solid oklch(0.88 0.022 75)",
                            fontSize: "12px",
                            fontFamily: "inherit",
                          }}
                          formatter={(v: number) => [toFa(v), "تعداد"]}
                        />
                        <Bar
                          dataKey="count"
                          radius={[0, 6, 6, 0]}
                          maxBarSize={28}
                        >
                          {statusChartData.map((entry) => (
                            <Cell
                              key={entry.key}
                              fill={
                                STATUS_COLORS[entry.key as OrderStatus] ??
                                "oklch(0.60 0.15 38)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent orders + low stock */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="rounded-2xl lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">سفارش‌های اخیر</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/orders" className="gap-1">
                    مشاهده همه
                    <ArrowLeft className="size-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : stats?.recentOrders.length ? (
                  <div className="max-h-96 overflow-auto scrollbar-persian">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">شناسه</TableHead>
                          <TableHead className="text-right">مشتری</TableHead>
                          <TableHead className="text-right">مبلغ</TableHead>
                          <TableHead className="text-right">وضعیت</TableHead>
                          <TableHead className="text-right">تاریخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.recentOrders.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell className="font-mono text-xs">
                              {toFa(shortId(o.id))}
                            </TableCell>
                            <TableCell className="text-sm">
                              {o.user?.name ?? "—"}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {formatPrice(o.total)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={o.status} />
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {formatDateTime(o.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    هنوز سفارشی ثبت نشده است.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="size-4 text-amber-600" />
                  محصولات کم‌موجود
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/products" className="gap-1">
                    مدیریت
                    <ArrowLeft className="size-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                ) : stats?.lowStock.length ? (
                  <div className="max-h-96 space-y-2 overflow-auto scrollbar-persian">
                    {stats.lowStock.map((p) => {
                      const img = p.images
                        ?.split(",")
                        .filter(Boolean)[0];
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-2"
                        >
                          <ImageFallback
                            src={img}
                            alt={p.name}
                            className="size-12 shrink-0"
                            rounded="rounded-lg"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-foreground">
                              {p.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {p.category}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <StockBadge stock={p.stock} />
                            <span className="text-xs font-bold text-foreground">
                              موجودی: {toFa(p.stock)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    همهٔ محصولات موجودی کافی دارند.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
