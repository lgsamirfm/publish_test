"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus, Phone } from "lucide-react";
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
import { safeInternalPath } from "@/lib/navigation";

export default function SignupPage() {
  const params = useSearchParams();
  const next = params.get("next");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const normalizedPhone = normalizeIranianPhone(phone);

    // Client-side validation
    if (!name.trim()) return toast.error("نام را وارد کنید.");
    if (!isValidIranianPhone(normalizedPhone))
      return toast.error("شماره موبایل معتبر نیست. (شماره ۱۱ رقمی با 09)");
    if (password.length < 12)
      return toast.error("گذرواژه باید حداقل ۱۲ نویسه باشد.");
    if (password !== confirm)
      return toast.error("تکرار گذرواژه با گذرواژه یکسان نیست.");

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: normalizedPhone,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data?.error || "ثبت‌نام ناموفق بود.");
        setLoading(false);
        return;
      }

      toast.success("حساب شما ساخته شد. خوش آمدید!");

      window.location.href = safeInternalPath(next, "/account");
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
            <UserPlus className="size-5 text-primary" />
            ساخت حساب کاربری
          </CardTitle>
          <CardDescription>
            برای دیدن سفارش‌ها و خرید سریع‌تر، حساب بسازید.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">نام و نام خانوادگی</Label>
              <Input
                id="name"
                required
                placeholder="مثلاً نگار محمدی"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
                autoComplete="new-password"
                required
                className="text-left"
                placeholder="حداقل ۱۲ نویسه"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">تکرار گذرواژه</Label>
              <Input
                id="confirm"
                type="password"
                dir="ltr"
                autoComplete="new-password"
                required
                className="text-left"
                placeholder="تکرار گذرواژه"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
                  در حال ساخت حساب…
                </>
              ) : (
                "ثبت‌نام"
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              حساب دارید؟{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                وارد شوید
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}