"use client";

import { useEffect, useState, useCallback } from "react";
import { Users as UsersIcon, Loader2 , KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleBadge } from "@/components/admin/status-badge";
import { formatDate, toFa } from "@/lib/format";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  _count: { orders: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "خطا در دریافت کاربران");
      }
      const data = (await res.json()) as { users: AdminUser[] };
      setUsers(data.users ?? []);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطا";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const customerCount = users.length - adminCount;

  async function generateResetLink(userId: string) {
    try {
      const res = await fetch("/api/admin/users/" + userId + "/reset-link", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "خطا"); return; }
      const url = window.location.origin + "/reset-password?token=" + data.token;
      await navigator.clipboard.writeText(url);
      toast.success("لینک بازیابی کپی شد!");
    } catch { toast.error("خطا"); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <UsersIcon className="size-6 text-primary" />
          مدیریت کاربران
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          مجموع{" "}
          <span className="font-bold text-foreground">{toFa(users.length)}</span>{" "}
          کاربر ({toFa(customerCount)} مشتری، {toFa(adminCount)} مدیر)
        </p>
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
            ) : users.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                هنوز کاربری ثبت‌نام نکرده است.
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto scrollbar-persian">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نام</TableHead>
                      <TableHead className="text-right">ایمیل</TableHead>
                      <TableHead className="text-right">نقش</TableHead>
                      <TableHead className="text-right">تلفن</TableHead>
                      <TableHead className="text-right">تعداد سفارش</TableHead>
                      <TableHead className="text-right">تاریخ عضویت</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                              {u.name?.charAt(0) ?? "؟"}
                            </span>
                            <span>{u.name || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-left text-sm text-muted-foreground [direction:ltr]">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={u.role} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground [direction:ltr]">
                          {u.phone || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="font-semibold text-foreground">
                            {toFa(u._count?.orders ?? 0)}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(u.createdAt)}
                        </TableCell>
                        <TableCell>                                              
                          <Button variant="ghost" size="sm" className="gap-1.5 text-xs"
                            onClick={() => generateResetLink(u.id)}>
                            <KeyRound className="size-3.5" />
                            لینک بازیابی
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          در حال بارگذاری...
        </div>
      )}
    </div>
  );
}
