"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { KeyRound, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data?.error || "خطایی رخ داد."); setLoading(false); return; }
      setSent(true);
      if (data.token) setResetToken(data.token);
      toast.success("اگر ایمیل معتبر باشد، لینک بازیابی آماده است.");
    } catch { toast.error("خطای شبکه."); } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border-border/70 shadow-sm">
        <CardHeader className="gap-1.5">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <KeyRound className="size-5 text-primary" />
            فراموشی رمز عبور
          </CardTitle>
          <CardDescription>
            {sent ? "لینک بازیابی آماده است." : "ایمیل حساب خود را وارد کنید تا بتوانید رمز عبور را تغییر دهید."}
          </CardDescription>
        </CardHeader>
        {!sent ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">ایمیل</Label>
                <Input id="email" type="email" dir="ltr" autoComplete="email" required className="text-left" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter className="flex-col pt-4 items-stretch gap-4">
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <><Loader2 className="size-4 animate-spin" /> در حال ارسال…</> : "ارسال لینک بازیابی"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                رمز عبورتان را به یاد دارید؟{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">ورود</Link>
              </p>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-accent/40 p-4 text-sm leading-7 text-foreground">
              <p>اگر ایمیل <strong className="[direction:ltr] inline-block">{email}</strong> در سیستم ثبت شده باشد، لینک بازیابی آماده است.</p>
              <p className="mt-2 text-muted-foreground">لینک بازیابی ۳۰ دقیقه اعتبار دارد.</p>
            </div>
            {resetToken && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">🔗 لینک بازیابی شما:</p>
                <p className="text-xs text-muted-foreground">(در محیط توسعه، لینک مستقیم نمایش داده می‌شود. در نسخهٔ نهایی، این لینک به ایمیل شما ارسال خواهد شد.)</p>
                <Link href={`/reset-password?token=${resetToken}`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  <KeyRound className="size-4" /> تغییر رمز عبور <ArrowLeft className="size-3" />
                </Link>
              </div>
            )}
            <p className="text-center text-sm text-muted-foreground">
              رمز عبورتان را به یاد آوردید؟{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">ورود</Link>
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}