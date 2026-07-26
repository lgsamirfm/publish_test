"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Loader2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  CreditCard,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ImageFallback } from "@/components/image-fallback";
import { Price } from "@/components/price";
import { CheckoutSteps } from "@/components/checkout-steps";
import { PaymentMethodSelector } from "@/components/payment-method-selector";

import { useCart } from "@/store/cart";
import { formatPrice, toFa } from "@/lib/format";
import {
  SHIPPING_THRESHOLD,
  SHIPPING_COST,
  type PaymentMethod,
} from "@/lib/types";

type SessionUserLite = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
  phone?: string | null;
  address?: string | null;
};

type Step = 0 | 1 | 2 | 3;

export default function CartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SessionUserLite | null>(null);
  const [userChecked, setUserChecked] = useState(false);

  const items = useCart((s) => s.items);
  const updateQty = useCart((s) => s.updateQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const totalPrice = useCart((s) => s.totalPrice);

  // Multi-step state
  const [step, setStep] = useState<Step>(0);

  // Delivery form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ONLINE");
  const [submitting, setSubmitting] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState("");

  // Order success state
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState("");

  // Payment polling state (server-truth, not client-manipulatable)
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [pollingOrderId, setPollingOrderId] = useState("");
  const [paymentTimedOut, setPaymentTimedOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        const u = d.user as SessionUserLite | null;
        setUser(u ?? null);
        if (u) {
          setName(u.name ?? "");
          setPhone(u.phone ?? "");
          setAddress(u.address ?? "");
        }
      })
      .catch(() => setUser(null))
      .finally(() => setUserChecked(true));
  }, []);

  // ── Server-polling: check payment status from the database ──
  // This is the ONLY source of truth. The client cannot fake a successful payment.
  useEffect(() => {
    if (!waitingForPayment || !pollingOrderId) return;

    const POLL_INTERVAL = 2000; // poll every 2s
    const TIMEOUT_MS = 10 * 60 * 1000; // 10 min timeout
    const startTime = Date.now();

    let stopped = false;

    async function poll() {
      if (stopped) return;

      // Check timeout
      if (Date.now() - startTime > TIMEOUT_MS) {
        setWaitingForPayment(false);
        setPaymentTimedOut(true);
        toast.error("زمان پرداخت منقضی شد. لطفاً دوباره تلاش کنید.");
        return;
      }

      try {
        const res = await fetch("/api/payment/status?orderId=" + pollingOrderId);
        if (!res.ok) return; // keep polling on network error
        const data = await res.json();

        if (data.paymentStatus === "PAID") {
          // ✅ Payment confirmed by the SERVER
          stopped = true;
          setWaitingForPayment(false);
          clear();
          setSuccessOrderId(pollingOrderId);
          setOrderSuccess(true);
          setStep(3);
          toast.success("پرداخت با موفقیت انجام شد!");
          return;
        }

        if (data.paymentStatus === "FAILED") {
          // ❌ Payment failed on the server
          stopped = true;
          setWaitingForPayment(false);
          toast.error("پرداخت ناموفق بود. می‌توانید دوباره تلاش کنید.");
          return;
        }

        // PENDING or UNPAID — keep polling
      } catch {
        // Network error — keep polling
      }
    }

    // Poll immediately, then at intervals
    poll();
    const interval = setInterval(poll, POLL_INTERVAL);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [waitingForPayment, pollingOrderId, clear]);

  // Hydration guard
  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border bg-muted/60"
              />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-2xl border bg-muted/60" />
        </div>
      </div>
    );
  }

  const subtotal = totalPrice();
  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const grandTotal = subtotal + shippingCost;

  // ── Step 0: Empty cart ──
  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CartBreadcrumb />
        <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-20 text-center">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <ShoppingCart className="size-10" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-foreground">
            سبد خرید شما خالی است
          </h2>
          <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
            هنوز محصول یا الگویی به سبد خرید اضافه نکرده‌اید. برای دیدن
            محصولات و الگوهای بافت دستی به فروشگاه بروید.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/products">
              <ArrowLeft className="size-4" />
              شروع خرید
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 3: Order Success ──
  if (orderSuccess) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CartBreadcrumb />
        <div className="mt-6">
          <CheckoutSteps currentStep={3} />
        </div>
        <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-primary/30 bg-primary/5 px-6 py-16 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="size-10" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-foreground">
            سفارش شما با موفقیت ثبت شد!
          </h2>
          <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
            {paymentMethod === "ONLINE"
              ? "پرداخت شما تأیید شد و سفارش در حال پردازش است. جزئیات سفارش را در حساب کاربری خود ببینید."
              : "سفارش شما ثبت شد و در اسرع وقت ارسال خواهد شد. مبلغ سفارش هنگام تحویل دریافت می‌شود."}
          </p>
          {successOrderId && (
            <p className="mt-3 text-sm font-mono text-muted-foreground">
              شماره سفارش: #{toFa(successOrderId.slice(-6).toUpperCase())}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/account">
                <Package className="size-4" />
                مشاهده سفارش‌ها
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/products">
                ادامه خرید
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Validate current step ──
  function canGoToStep(s: Step): boolean {
    if (s === 0) return true;
    if (s === 1) return items.length > 0;
    if (s === 2) {
      return (
        items.length > 0 &&
        !!phone.trim() &&
        !!address.trim() &&
        !!user
      );
    }
    if (s === 3) return false; // Only reached after payment
    return false;
  }

  function goNext() {
    if (step < 3) {
      const next = (step + 1) as Step;
      if (canGoToStep(next)) setStep(next);
    }
  }

  function goBack() {
    if (step > 0) setStep((step - 1) as Step);
  }

  // ── Create order and initiate payment ──
  async function handlePlaceOrder() {
    if (submitting) return;

    if (!userChecked) {
      toast.error("لطفاً چند لحظه صبر کنید...");
      return;
    }
    if (!user) {
      toast.error("برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید.");
      router.push("/login?next=/cart");
      return;
    }
    if (!phone.trim()) {
      toast.error("شماره تماس را وارد کنید.");
      setStep(1);
      return;
    }
    if (!address.trim()) {
      toast.error("آدرس را وارد کنید.");
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            type: i.type,
            id: i.id,
            quantity: i.quantity,
          })),
          address: address.trim(),
          phone: phone.trim(),
          note: note.trim(),
          paymentMethod,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        toast.error(orderData?.error || "ثبت سفارش ناموفق بود.");
        return;
      }

      const orderId = orderData.order.id;

      // Step 2: Create payment
      const payRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentMethod,
          amount: grandTotal,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) {
        toast.error(payData?.error || "خطا در ایجاد پرداخت.");
        return;
      }

      if (paymentMethod === "ONLINE") {
        // Open the payment gateway directly in a new tab
        // and start polling the server for the real payment status
        setPendingOrderId(orderId);
        setPollingOrderId(orderId);
        setWaitingForPayment(true);
        setPaymentTimedOut(false);
        window.open(payData.paymentUrl, "_blank");
      } else {
        // COD: order placed, redirect to success
        clear();
        setSuccessOrderId(orderId);
        setOrderSuccess(true);
        setStep(3);
        toast.success("سفارش شما با موفقیت ثبت شد!");
      }
    } catch {
      toast.error("خطای شبکه. لطفاً دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CartBreadcrumb />

      {/* Checkout Steps */}
      <div className="mt-6">
        <CheckoutSteps currentStep={step} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* ════════ LEFT PANEL: step content ════════ */}
        <div>
          {/* ── Step 0: Cart Items ── */}
          {step === 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">
                    سبد خرید
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {toFa(items.length)} کالا در سبد شما
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    clear();
                    toast.success("سبد خرید پاک شد");
                  }}
                >
                  <Trash2 className="size-4" />
                  پاک کردن
                </Button>
              </div>

              {items.map((item) => (
                <Card
                  key={`${item.type}-${item.id}-${item.variant ?? ""}`}
                  className="flex-row items-center gap-4 p-4 shadow-sm"
                >
                  <ImageFallback
                    src={item.image}
                    alt={item.name}
                    rounded="rounded-xl"
                    className="size-20 shrink-0"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Badge
                          variant="secondary"
                          className="mb-1 text-[10px]"
                        >
                          {item.type === "PATTERN" ? "الگو" : "محصول"}
                        </Badge>
                        <h3 className="line-clamp-1 font-bold text-foreground">
                          {item.name}
                        </h3>
                        {item.variant && (
                          <span className="mt-0.5 inline-block rounded-md bg-accent/70 px-2 py-0.5 text-[11px] text-accent-foreground">
                            {item.variant}
                          </span>
                        )}
                        <div className="mt-1 text-xs text-muted-foreground">
                          قیمت واحد:{" "}
                          <Price value={item.price} className="text-sm" />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="حذف از سبد"
                        className="size-9 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          remove(item.type, item.id, item.variant);
                          toast.success("از سبد حذف شد");
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="کاهش تعداد"
                          className="size-8"
                          onClick={() =>
                            updateQty(
                              item.type,
                              item.id,
                              item.quantity - 1,
                              item.variant
                            )
                          }
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="min-w-8 text-center text-sm font-bold tabular-nums">
                          {toFa(item.quantity)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="افزایش تعداد"
                          className="size-8"
                          onClick={() =>
                            updateQty(
                              item.type,
                              item.id,
                              item.quantity + 1,
                              item.variant
                            )
                          }
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                      <Price
                        value={item.price * item.quantity}
                        className="text-base font-bold text-primary"
                      />
                    </div>
                  </div>
                </Card>
              ))}

              <Button
                asChild
                variant="outline"
                className="w-full border-dashed"
              >
                <Link href="/products">
                  <ArrowLeft className="size-4" />
                  ادامه خرید
                </Link>
              </Button>
            </div>
          )}

          {/* ── Step 1: Delivery Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="size-5" />
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">
                    اطلاعات ارسال
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    آدرس و شماره تماس خود را وارد کنید
                  </p>
                </div>
              </div>

              {!user && userChecked && (
                <div className="flex items-start gap-2 rounded-lg bg-accent/60 p-3 text-xs text-accent-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  <span>
                    برای ثبت سفارش باید وارد شوید.{" "}
                    <Link
                      href="/login?next=/cart"
                      className="font-bold underline"
                    >
                      ورود به حساب
                    </Link>
                  </span>
                </div>
              )}

              <Card className="rounded-2xl">
                <CardContent className="space-y-4 p-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">نام و نام خانوادگی</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثلاً: مریم احمدی"
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">
                      شماره تماس <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      inputMode="tel"
                      autoComplete="tel"
                      dir="ltr"
                      className="text-right"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">
                      آدرس کامل <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="استان، شهر، خیابان، پلاک و کد پستی"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="note">
                      یادداشت سفارش (اختیاری)
                    </Label>
                    <Textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="هر توضیحی که برای سفارش لازم می‌دانید..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Step 2: Payment ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="size-5" />
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">
                    انتخاب روش پرداخت
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    روش پرداخت مورد نظر خود را انتخاب کنید
                  </p>
                </div>
              </div>

              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                amount={grandTotal}
              />

              {/* Delivery summary */}
              <Card className="rounded-2xl bg-accent/30">
                <CardContent className="p-4 space-y-2 text-sm">
                  <h4 className="font-bold text-foreground flex items-center gap-2">
                    <MapPin className="size-4 text-primary" />
                    آدرس تحویل
                  </h4>
                  <p className="text-muted-foreground">{address}</p>
                  <p className="text-muted-foreground">
                    شماره تماس: <span dir="ltr">{phone}</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Navigation Buttons ── */}
          <div className="mt-6 flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button
                variant="outline"
                onClick={goBack}
                className="gap-2"
              >
                <ArrowRight className="size-4" />
                مرحله قبل
              </Button>
            ) : (
              <div />
            )}

            {step < 2 ? (
              <Button
                onClick={goNext}
                disabled={
                  (step === 1 &&
                    (!phone.trim() || !address.trim() || !user)) ||
                  (step === 0 && items.length === 0)
                }
                className="gap-2"
              >
                مرحله بعد
                <ArrowLeft className="size-4" />
              </Button>
            ) : step === 2 ? (
              <Button
                onClick={handlePlaceOrder}
                disabled={submitting}
                size="lg"
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    در حال ثبت...
                  </>
                ) : paymentMethod === "ONLINE" ? (
                  <>
                    <CreditCard className="size-4" />
                    پرداخت آنلاین
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    ثبت سفارش
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>

        {/* ════════ RIGHT PANEL: Order Summary ════════ */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">خلاصه سفارش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items count */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  تعداد اقلام
                </span>
                <span className="font-medium">{toFa(items.length)} کالا</span>
              </div>

              {/* Quick items list (collapsed) */}
              <div className="max-h-40 space-y-1.5 overflow-y-auto scrollbar-persian">
                {items.map((item) => (
                  <div
                    key={`${item.type}-${item.id}-${item.variant ?? ""}`}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="truncate text-muted-foreground">
                      {item.name} × {toFa(item.quantity)}
                    </span>
                    <span className="shrink-0 font-medium text-foreground">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">جمع کالاها</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">هزینه ارسال</span>
                  {shippingCost === 0 ? (
                    <Badge variant="secondary" className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">
                      رایگان
                    </Badge>
                  ) : (
                    <span className="font-medium">
                      {formatPrice(shippingCost)}
                    </span>
                  )}
                </div>
                {shippingCost > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    ارسال رایگان برای سفارش‌های بالای{" "}
                    {formatPrice(SHIPPING_THRESHOLD)}
                  </p>
                )}
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">
                    مبلغ قابل پرداخت
                  </span>
                  <span className="text-lg font-extrabold text-primary">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Security badges */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-1.5 rounded-lg bg-accent/50 px-2.5 py-2 text-[11px] text-accent-foreground">
                  <ShieldCheck className="size-3.5 text-primary shrink-0" />
                  پرداخت امن
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-accent/50 px-2.5 py-2 text-[11px] text-accent-foreground">
                  <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                  ضمانت بازگشت
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Waiting for payment overlay (server-polling) ── */}
      {waitingForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md border-border/70 shadow-lg">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                در انتظار پرداخت
              </h3>
              <p className="text-sm leading-7 text-muted-foreground">
                درگاه پرداخت در تب دیگری باز شده است.
                <br />
                پس از تکمیل پرداخت، این صفحه به‌طور خودکار به‌روزرسانی می‌شود.
              </p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setWaitingForPayment(false);
                  toast.error("پرداخت لغو شد.");
                }}
              >
                انصراف
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Payment timed out message ── */}
      {paymentTimedOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md border-destructive/30 shadow-lg">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <CreditCard className="size-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                پرداخت ناموفق
              </h3>
              <p className="text-sm leading-7 text-muted-foreground">
                زمان پرداخت منقضی شد یا تراکنش لغو گردید.
                <br />
                می‌توانید دوباره تلاش کنید.
              </p>
              <Button onClick={() => setPaymentTimedOut(false)}>
                تلاش مجدد
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function CartBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">خانه</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>سبد خرید</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}