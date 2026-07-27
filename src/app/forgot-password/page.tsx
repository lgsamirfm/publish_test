"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { isValidIranianPhone, normalizeIranianPhone } from "@/lib/format";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
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
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "خطایی رخ داد.");
        setLoading(false);
        return;
      }

      if (data.code) {
        toast.success(`کد تأیید بازیابی: ${data.code} (مهلت ۲ دقیقه)`, { duration: 10000 });
      } else {
        toast.success("کد تأیید بازیابی به شماره موبایل ارسال شد.");
      }

      // Redirect to reset-password page with phone query param
      router.push(`/reset-password?phone=${encodeURIComponent(normalized)}${data.code ? `&code=${data.code}` : ''}`);
    } catch {
      toast.error("خطای شبکه.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border-border/70 shadow-sm">
        <CardHeader className="gap-1.5">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <KeyRound className="size-5 text-primary" />
            بازیابی رمز عبور
          </CardTitle>
          <CardDescription>
            شماره موبایل خود را وارد کنید تا کد تأیید ۲ دقیقه‌ای برای شما ارسال شود.
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
          </CardContent>
          <CardFooter className="flex-col pt-4 items-stretch gap-4">
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin ms-2" /> در حال ارسال کد…
                </>
              ) : (
                "ارسال کد تأیید ۲ دقیقه‌ای"
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              رمز عبورتان را به یاد دارید؟{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                ورود
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}