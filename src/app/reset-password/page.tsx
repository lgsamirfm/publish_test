"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { toast.error("توکن بازیابی نامعتبر است."); return; }
    if (password.length < 6) { toast.error("گذرواژه باید حداقل ۶ کاراکتر باشد."); return; }
    if (password !== confirmPassword) { toast.error("گذرواژه و تکرار آن یکسان نیستند."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data?.error || "خطایی رخ داد."); setLoading(false); return; }
      setDone(true);
      toast.success("رمز عبور با موفقیت تغییر کرد!");
    } catch { toast.error("خطای شبکه."); } finally { setLoading(false); }
  }

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md border-border/70 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2 text-2xl"><KeyRound className="size-5 text-destructive" /> لینک نامعتبر</CardTitle><CardDescription>این لینک بازیابی نامعتبر یا منقضی شده است.</CardDescription></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">لطفاً دوباره درخواست بازیابی رمز عبور بدهید.</p></CardContent>
          <CardFooter><Button asChild className="w-full"><Link href="/forgot-password">درخواست لینک جدید</Link></Button></CardFooter>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md border-border/70 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2 text-2xl"><CheckCircle2 className="size-5 text-green-600" /> رمز عبور تغییر کرد!</CardTitle><CardDescription>حالا می‌توانید با رمز عبور جدید وارد حساب خود شوید.</CardDescription></CardHeader>
          <CardFooter><Button asChild className="w-full" size="lg"><Link href="/login">ورود به حساب</Link></Button></CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border-border/70 shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-2 text-2xl"><KeyRound className="size-5 text-primary" /> تنظیم رمز عبور جدید</CardTitle><CardDescription>رمز عبور جدید خود را وارد کنید.</CardDescription></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">رمز عبور جدید</Label>
              <Input id="password" type="password" dir="ltr" autoComplete="new-password" required className="text-left" placeholder="حداقل ۶ کاراکتر" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
              <Input id="confirmPassword" type="password" dir="ltr" autoComplete="new-password" required className="text-left" placeholder="مجدداً وارد کنید" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex-col pt-4 items-stretch gap-4">
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <><Loader2 className="size-4 animate-spin" /> در حال تغییر…</> : "تغییر رمز عبور"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}