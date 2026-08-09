"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { KeyRound, Loader2, CheckCircle2, Clock, Phone, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { isValidIranianPhone, normalizeIranianPhone, toFa } from "@/lib/format";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();

  const initialPhone = params.get("phone") || "";

  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [done, setDone] = useState(false);

  // 2-minute (120s) timer countdown
  const [timeLeft, setTimeLeft] = useState<number>(120);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${toFa(String(mins).padStart(2, "0"))}:${toFa(String(secs).padStart(2, "0"))}`;
  };

  async function handleResendCode() {
    const normalizedPhone = normalizeIranianPhone(phone);
    if (!isValidIranianPhone(normalizedPhone)) {
      toast.error("شماره موبایل معتبر نیست.");
      return;
    }

    setResending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "خطا در ارسال مجدد کد.");
        return;
      }

      setTimeLeft(120); // Reset timer to 2 minutes
      if (data.code) {
        setCode(data.code);
        toast.success(`کد جدید: ${data.code} (مهلت ۲ دقیقه)`, { duration: 10000 });
      } else {
        toast.success("کد جدید با موفقیت ارسال شد.");
      }
    } catch {
      toast.error("خطای شبکه.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const normalizedPhone = normalizeIranianPhone(phone);
    if (!isValidIranianPhone(normalizedPhone)) {
      toast.error("شماره موبایل معتبر نیست.");
      return;
    }
    if (!code.trim()) {
      toast.error("کد تأیید را وارد کنید.");
      return;
    }
    if (password.length < 12) {
      toast.error("گذرواژه باید حداقل ۱۲ کاراکتر باشد.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("گذرواژه و تکرار آن یکسان نیستند.");
      return;
    }

    if (timeLeft <= 0) {
      toast.error("مهلت کد ۲ دقیقه‌ای به پایان رسیده است. لطفاً ارسال مجدد را بزنید.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          code: code.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "تغییر رمز عبور ناموفق بود.");
        setLoading(false);
        return;
      }
      setDone(true);
      toast.success("رمز عبور با موفقیت تغییر کرد!");
    } catch {
      toast.error("خطای شبکه.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-green-600">
              <CheckCircle2 className="size-6" /> رمز عبور تغییر کرد!
            </CardTitle>
            <CardDescription>
              اکنون می‌توانید با شماره موبایل و رمز عبور جدید وارد حساب خود شوید.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full" size="lg">
              <Link href="/login">ورود به حساب</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border-border/70 shadow-sm">
        <CardHeader className="gap-1.5">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <KeyRound className="size-5 text-primary" />
            تغییر رمز عبور با کد تأیید
          </CardTitle>
          <CardDescription>
            کد ۶ رقمی ارسال شده و رمز عبور جدید را وارد کنید.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Phone number */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">شماره موبایل</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  dir="ltr"
                  maxLength={11}
                  required
                  className="text-left pl-9"
                  placeholder="09121234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              </div>
            </div>

            {/* Verification code & timer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="code">کد تأیید ۶ رقمی</Label>
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                  <Clock className="size-3 text-amber-500" />
                  <span>اعتبار: {formatTimer(timeLeft)}</span>
                </div>
              </div>
              <div className="relative">
                <Input
                  id="code"
                  type="text"
                  dir="ltr"
                  maxLength={6}
                  required
                  className="text-center font-mono tracking-widest text-lg pl-9"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <ShieldCheck className="absolute left-3 top-2.5 size-5 text-muted-foreground" />
              </div>
              {timeLeft <= 0 && (
                <p className="text-xs text-destructive mt-1">
                  مهلت ۲ دقیقه‌ای کد به پایان رسید. لطفاً ارسال مجدد را بزنید.
                </p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">رمز عبور جدید</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                autoComplete="new-password"
                required
                className="text-left"
                placeholder="حداقل ۱۲ کاراکتر"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">تکرار رمز عبور جدید</Label>
              <Input
                id="confirmPassword"
                type="password"
                dir="ltr"
                autoComplete="new-password"
                required
                className="text-left"
                placeholder="مجدداً وارد کنید"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex-col pt-4 items-stretch gap-3">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || timeLeft <= 0}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin ms-2" /> در حال تغییر…
                </>
              ) : (
                "تغییر رمز عبور"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full text-xs"
              onClick={handleResendCode}
              disabled={resending || timeLeft > 0}
            >
              {resending ? (
                <Loader2 className="size-3 animate-spin me-1" />
              ) : (
                <RefreshCw className="size-3 me-1" />
              )}
              {timeLeft > 0 ? `ارسال مجدد کد پس از پایان زمان (${formatTimer(timeLeft)})` : "ارسال مجدد کد تأیید"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}