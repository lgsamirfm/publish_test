import { redirect } from "next/navigation";
import Link from "next/link";
import {
  User as UserIcon,
  Mail,
  ShoppingBag,
  Package,
  CalendarClock,
  ChevronLeft,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Receipt,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatPrice, toFa } from "@/lib/format";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_VARIANT,
  type PaymentStatus,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LogoutButton } from "@/components/logout-button";
import PurchasedPatterns from "@/components/purchased-patterns";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "در انتظار",
  PAID: "پرداخت‌شده",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELLED: "لغوشده",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  PAID: "default",
  SHIPPED: "secondary",
  DELIVERED: "default",
  CANCELLED: "destructive",
};

const STATUS_ICON: Record<string, typeof Clock> = {
  PENDING: Clock,
  PAID: CheckCircle2,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: XCircle,
};

function shortId(id: string): string {
  return id.slice(-6).toUpperCase();
}

export default async function AccountPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/account");
  }

  const orders = await db.order.findMany({
    where: { userId: session.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const totalSpent = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + o.total + o.shippingCost, 0);
  const totalItems = orders.reduce(
    (sum, o) => sum + o.items.reduce((n, i) => n + i.quantity, 0),
    0
  );

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">خانه</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>حساب کاربری</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
              حساب کاربری
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              اطلاعات حساب و سفارش‌های شما.
            </p>
          </div>
          <LogoutButton label="خروج از حساب" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* User info */}
          <Card className="border-border/70">
            <CardHeader className="gap-1.5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserIcon className="size-5" />
                </span>
                اطلاعات کاربری
              </CardTitle>
              <CardDescription>
                حساب {session.role === "ADMIN" ? "مدیر" : "مشتری"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <UserIcon className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">نام</div>
                  <div className="font-medium text-foreground">
                    {session.name}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-muted-foreground">ایمیل</div>
                  <div
                    className="truncate font-medium text-foreground"
                    dir="ltr"
                  >
                    {session.email}
                  </div>
                </div>
              </div>
              {session.role === "ADMIN" && (
                <Button asChild variant="outline" className="mt-2 w-full">
                  <Link href="/admin">
                    <Sparkles className="size-4" />
                    پیشخوان مدیریت
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border-border/70">
            <CardHeader className="gap-1.5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex size-9 items-center justify-center rounded-xl bg-secondary/40 text-secondary-foreground">
                  <ShoppingBag className="size-5" />
                </span>
                آمار سفارش‌ها
              </CardTitle>
              <CardDescription>خلاصهٔ فعالیت‌های شما</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <div className="text-xs text-muted-foreground">سفارش‌ها</div>
                <div className="mt-1 text-lg font-bold">
                  {toFa(orders.length)}
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <div className="text-xs text-muted-foreground">اقلام</div>
                <div className="mt-1 text-lg font-bold">{toFa(totalItems)}</div>
              </div>
              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <div className="text-xs text-muted-foreground">پرداخت‌شده</div>
                <div className="mt-1 text-sm font-bold leading-tight">
                  {formatPrice(totalSpent)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchased Patterns */}
          <div className="lg:col-span-3">
            <PurchasedPatterns />
          </div>

          {/* Orders section */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                سفارش‌های من
              </h2>
              {orders.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {toFa(orders.length)} سفارش
                </span>
              )}
            </div>

            {orders.length === 0 ? (
              <Card className="border-dashed border-border/70">
                <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                    <Package className="size-7" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">
                      هنوز سفارشی ثبت نکرده‌اید.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      از محصولات و الگوهای بافخانه دیدن کنید و اولین سفارش خود
                      را ثبت کنید.
                    </p>
                  </div>
                  <Button asChild size="lg">
                    <Link href="/products">
                      مشاهدهٔ محصولات
                      <ChevronLeft className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const itemCount = order.items.reduce(
                    (n, i) => n + i.quantity,
                    0
                  );
                  const StatusIcon =
                    STATUS_ICON[order.status] ?? Clock;
                  const grandTotal = order.total + order.shippingCost;

                  return (
                    <Card
                      key={order.id}
                      className="border-border/70 transition-shadow hover:shadow-md"
                    >
                      <CardHeader className="gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                              <Package className="size-5" />
                            </span>
                            <div>
                              <CardTitle className="text-base">
                                سفارش #{toFa(shortId(order.id))}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-1.5">
                                <CalendarClock className="size-3.5" />
                                {formatDateTime(order.createdAt)}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={STATUS_VARIANT[order.status] ?? "outline"}>
                              <StatusIcon className="size-3 ml-1" />
                              {STATUS_LABEL[order.status] ?? order.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Payment info row */}
                        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-4 py-3 text-sm">
                          <Receipt className="size-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            روش پرداخت:
                          </span>
                          <span className="font-medium text-foreground">
                            {order.paymentMethod
                              ? PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? order.paymentMethod
                              : "نامشخص"}
                          </span>
                          <Separator
                            orientation="vertical"
                            className="mx-1 h-4"
                          />
                          <span className="text-muted-foreground">
                            وضعیت پرداخت:
                          </span>
                          <Badge
                            variant={
                              PAYMENT_STATUS_VARIANT[
                                (order.paymentStatus || "UNPAID") as PaymentStatus
                              ] ?? "outline"
                            }
                            className="text-[11px]"
                          >
                            {PAYMENT_STATUS_LABELS[
                              (order.paymentStatus || "UNPAID") as PaymentStatus
                            ] ?? order.paymentStatus}
                          </Badge>
                          {order.transactionId && (
                            <>
                              <Separator
                                orientation="vertical"
                                className="mx-1 h-4"
                              />
                              <span className="text-muted-foreground">
                                تراکنش:
                              </span>
                              <span
                                className="font-mono text-xs text-foreground"
                                dir="ltr"
                              >
                                {order.transactionId}
                              </span>
                            </>
                          )}
                          {order.paidAt && (
                            <>
                              <Separator
                                orientation="vertical"
                                className="mx-1 h-4"
                              />
                              <span className="text-muted-foreground">
                                پرداخت:
                              </span>
                              <span className="text-xs text-foreground">
                                {formatDateTime(order.paidAt)}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Items and totals */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 px-4 py-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <ShoppingBag className="size-4" />
                            تعداد اقلام:
                            <span className="font-medium text-foreground">
                              {toFa(itemCount)}
                            </span>
                          </div>
                          {order.shippingCost > 0 && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              ارسال: {formatPrice(order.shippingCost)}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            مبلغ کل:
                            <span className="font-bold text-primary">
                              {formatPrice(grandTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Items summary */}
                        <ul className="divide-y divide-border/60">
                          {order.items.map((it) => (
                            <li
                              key={it.id}
                              className="flex items-center justify-between gap-3 py-2.5 text-sm"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <Badge
                                  variant="outline"
                                  className="shrink-0 font-normal"
                                >
                                  {it.itemType === "PRODUCT"
                                    ? "محصول"
                                    : it.itemType === "PATTERN"
                                    ? "الگو"
                                    : it.itemType}
                                </Badge>
                                <span className="truncate text-foreground">
                                  {it.name}
                                </span>
                              </div>
                              <div className="flex shrink-0 items-center gap-3 text-muted-foreground">
                                <span>{toFa(it.quantity)} عدد</span>
                                <span className="font-medium text-foreground">
                                  {formatPrice(it.price * it.quantity)}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
