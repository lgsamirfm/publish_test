"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingBag, Loader2, Filter, X, CreditCard, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ImageFallback } from "@/components/image-fallback";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_VARIANT,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/types";
import { formatPrice, formatDateTime, toFa } from "@/lib/format";
import { cn } from "@/lib/utils";

// Local order type used in admin views (relations included by API).
type AdminOrder = {
  id: string;
  userId: string;
  total: number;
  status: string;
  address: string;
  phone: string;
  note: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string;
  paidAt: string | null;
  shippingCost: number;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  items: Array<{
    id: string;
    itemType: string;
    itemId: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
  }>;
};

const STATUS_KEYS = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

const PAYMENT_KEYS: PaymentStatus[] = ["UNPAID", "PENDING", "PAID", "FAILED"];

function shortId(id: string) {
  return id.slice(-6).toUpperCase();
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [payFilter, setPayFilter] = useState<PaymentStatus | "ALL">("ALL");

  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("خطا در دریافت سفارش‌ها");
      const data = (await res.json()) as { orders: AdminOrder[] };
      setOrders(data.orders ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(order: AdminOrder, status: OrderStatus) {
    if (order.status === status) return;
    setUpdatingId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "خطا در بروزرسانی وضعیت");
      }
      toast.success("وضعیت سفارش بروزرسانی شد.");
      // Optimistic local update
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status } : o))
      );
      if (selected?.id === order.id) {
        setSelected((s) => (s ? { ...s, status } : s));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا");
      await load();
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = orders.filter((o) => {
    if (filter !== "ALL" && o.status !== filter) return false;
    if (payFilter !== "ALL" && (o.paymentStatus || "UNPAID") !== payFilter)
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <ShoppingBag className="size-6 text-primary" />
            مدیریت سفارش‌ها
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مجموع{" "}
            <span className="font-bold text-foreground">
              {toFa(orders.length)}
            </span>{" "}
            سفارش
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as OrderStatus | "ALL")}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="فیلتر وضعیت سفارش" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">همه وضعیت‌ها</SelectItem>
              {STATUS_KEYS.map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={payFilter}
            onValueChange={(v) => setPayFilter(v as PaymentStatus | "ALL")}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="فیلتر وضعیت پرداخت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">همه پرداخت‌ها</SelectItem>
              {PAYMENT_KEYS.map((s) => (
                <SelectItem key={s} value={s}>
                  {PAYMENT_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                {filter !== "ALL" || payFilter !== "ALL"
                  ? "سفارشی مطابق فیلتر یافت نشد."
                  : "هنوز سفارشی ثبت نشده است."}
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto scrollbar-persian">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">شناسه</TableHead>
                      <TableHead className="text-right">مشتری</TableHead>
                      <TableHead className="text-right">تاریخ</TableHead>
                      <TableHead className="text-right">مبلغ</TableHead>
                      <TableHead className="text-right">پرداخت</TableHead>
                      <TableHead className="text-right">وضعیت سفارش</TableHead>
                      <TableHead className="text-right">تغییر وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((o) => {
                      const isUpdating = updatingId === o.id;
                      const grandTotal = o.total + (o.shippingCost || 0);
                      const payStatus = (o.paymentStatus || "UNPAID") as PaymentStatus;
                      return (
                        <TableRow
                          key={o.id}
                          className="cursor-pointer hover:bg-accent/40"
                          onClick={() => setSelected(o)}
                        >
                          <TableCell className="font-mono text-xs">
                            {toFa(shortId(o.id))}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {o.user?.name ?? "—"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {o.user?.email ?? ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {formatDateTime(o.createdAt)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm font-semibold">
                            {formatPrice(grandTotal)}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Badge
                              variant={
                                PAYMENT_STATUS_VARIANT[payStatus] ?? "outline"
                              }
                              className="text-[10px] gap-1"
                            >
                              <CreditCard className="size-3" />
                              {PAYMENT_STATUS_LABELS[payStatus] ?? payStatus}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <StatusBadge status={o.status} />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Select
                                value={o.status}
                                onValueChange={(v) =>
                                  changeStatus(o, v as OrderStatus)
                                }
                                disabled={isUpdating}
                              >
                                <SelectTrigger className="h-9 w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_KEYS.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {ORDER_STATUS_LABELS[s]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {isUpdating && (
                                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order details dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto scrollbar-persian sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2">
                  <span>جزئیات سفارش</span>
                  <span className="font-mono text-sm font-normal text-muted-foreground">
                    #{toFa(shortId(selected.id))}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  اطلاعات کامل سفارش و اقلام آن
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Customer info */}
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card/60 p-4 text-sm">
                  <Info label="مشتری" value={selected.user?.name ?? "—"} />
                  <Info
                    label="ایمیل"
                    value={selected.user?.email ?? "—"}
                    ltr
                  />
                  <Info
                    label="تلفن"
                    value={selected.phone || "—"}
                    ltr
                  />
                  <Info
                    label="تاریخ"
                    value={formatDateTime(selected.createdAt)}
                  />
                  <div className="col-span-2">
                    <Info
                      label="آدرس"
                      value={selected.address || "—"}
                    />
                  </div>
                  {selected.note ? (
                    <div className="col-span-2">
                      <Info label="یادداشت" value={selected.note} />
                    </div>
                  ) : null}
                </div>

                {/* Payment info */}
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Receipt className="size-4 text-primary" />
                    اطلاعات پرداخت
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Info
                      label="روش پرداخت"
                      value={
                        selected.paymentMethod
                          ? PAYMENT_METHOD_LABELS[selected.paymentMethod as PaymentMethod] ??
                            selected.paymentMethod
                          : "نامشخص"
                      }
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">وضعیت پرداخت</span>
                      <Badge
                        variant={
                          PAYMENT_STATUS_VARIANT[
                            (selected.paymentStatus || "UNPAID") as PaymentStatus
                          ] ?? "outline"
                        }
                        className="w-fit text-[11px]"
                      >
                        {PAYMENT_STATUS_LABELS[
                          (selected.paymentStatus || "UNPAID") as PaymentStatus
                        ] ?? selected.paymentStatus}
                      </Badge>
                    </div>
                    {selected.transactionId && (
                      <Info
                        label="شناسه تراکنش"
                        value={selected.transactionId}
                        ltr
                        mono
                      />
                    )}
                    {selected.paidAt && (
                      <Info
                        label="تاریخ پرداخت"
                        value={formatDateTime(selected.paidAt)}
                      />
                    )}
                    {(selected.shippingCost || 0) > 0 && (
                      <Info
                        label="هزینه ارسال"
                        value={formatPrice(selected.shippingCost)}
                      />
                    )}
                    <Info
                      label="مبلغ کل"
                      value={formatPrice(selected.total + (selected.shippingCost || 0))}
                      bold
                    />
                  </div>
                </div>

                {/* Items list */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">
                    اقلام سفارش
                  </h4>
                  <div className="space-y-2">
                    {selected.items.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-2"
                      >
                        <ImageFallback
                          src={it.image}
                          alt={it.name}
                          className="size-12 shrink-0"
                          rounded="rounded-lg"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-foreground">
                            {it.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {it.itemType === "PATTERN"
                              ? "الگو"
                              : "محصول"}{" "}
                            × {toFa(it.quantity)}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                          {formatPrice(it.price * it.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Footer summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      وضعیت:
                    </span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">
                      مبلغ کل
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {formatPrice(selected.total + (selected.shippingCost || 0))}
                    </div>
                  </div>
                </div>

                {/* Quick status changer in dialog */}
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/30 p-3">
                  <span className="text-sm font-medium text-foreground">
                    تغییر سریع وضعیت:
                  </span>
                  {STATUS_KEYS.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selected.status === s ? "default" : "outline"}
                      disabled={updatingId === selected.id}
                      onClick={() => changeStatus(selected, s)}
                      className={cn(
                        selected.status === s &&
                          "bg-primary text-primary-foreground"
                      )}
                    >
                      {ORDER_STATUS_LABELS[s]}
                    </Button>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelected(null)}
                  className="gap-2"
                >
                  <X className="size-4" />
                  بستن
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({
  label,
  value,
  ltr,
  mono,
  bold,
}: {
  label: string;
  value: string;
  ltr?: boolean;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm text-foreground",
          bold && "font-bold",
          mono && "font-mono text-xs",
          ltr && "text-left [direction:ltr]"
        )}
      >
        {value}
      </span>
    </div>
  );
}
