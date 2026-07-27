"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogIn, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isValidIranianPhone, normalizeIranianPhone } from "@/lib/format";

export default function LoginPage() {
  const params = useSearchParams();
  const next = params.get("next");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const normalized = normalizeIranianPhone(phone);
    if (!isValidIranianPhone(normalized)) {
      toast.error("شماره موبایل معتبر نیست. (شماره ۱۱ رقمی با 09)");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: normalized, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data?.error || "ورود ناموفق بود.");
        setLoading(false);
        return;
      }

      toast.success("خوش آمدید!");

      const role = data?.user?.role;
      const safeNext =
        next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      const dest = safeNext
        ? safeNext
        : role === "ADMIN"
          ? "/admin"
          : "/account";

      window.location.href = dest;
    } catch {
      toast.error("خطای شبکه. دوباره تلاش کنید.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border-border/70 shadow-sm">
        <CardHeader className="gap-1.5">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <LogIn className="size-5 text-primary" />
            ورود به حساب
          </CardTitle>
          <CardDescription>
            شماره موبایل و گذرواژهٔ خود را وارد کنید تا وارد شوید.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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

            <div className="space-y-1.5">
              <Label htmlFor="password">گذرواژه</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                required
                className="text-left"
                placeholder="گذرواژهٔ شما"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="mt-4 flex-col items-stretch gap-4">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin ms-2" />
                  در حال ورود…
                </>
              ) : (
                "ورود"
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              حساب ندارید؟{" "}
              <Link
                href="/signup"
                className="font-medium text-primary hover:underline"
              >
                ثبت‌نام کنید
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              رمز عبور را فراموش کرده‌اید؟{" "}
              <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                بازیابی رمز عبور
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}