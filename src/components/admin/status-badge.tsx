"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  PAID: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  SHIPPED:
    "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100",
  DELIVERED:
    "bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-100",
  CANCELLED:
    "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100",
};

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  const s = (status as OrderStatus) in ORDER_STATUS_LABELS
    ? (status as OrderStatus)
    : "PENDING";
  return (
    <Badge
      variant="outline"
      className={cn("border font-medium", STATUS_STYLES[s])}
    >
      {ORDER_STATUS_LABELS[s]}
    </Badge>
  );
}

const DIFFICULTY_STYLES: Record<string, string> = {
  مبتدی: "bg-emerald-100 text-emerald-800 border-emerald-200",
  متوسط: "bg-amber-100 text-amber-800 border-amber-200",
  پیشرفته: "bg-rose-100 text-rose-800 border-rose-200",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const cls = DIFFICULTY_STYLES[difficulty] ?? "bg-muted text-foreground border-border";
  return (
    <Badge variant="outline" className={cn("border", cls)}>
      {difficulty || "نامشخص"}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "ADMIN";
  return (
    <Badge
      variant="outline"
      className={
        isAdmin
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-muted text-foreground border-border"
      }
    >
      {isAdmin ? "مدیر" : "مشتری"}
    </Badge>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  const isLow = stock <= 5;
  const isOut = stock === 0;
  return (
    <Badge
      variant="outline"
      className={
        isOut
          ? "bg-rose-100 text-rose-800 border-rose-200"
          : isLow
          ? "bg-amber-100 text-amber-800 border-amber-200"
          : "bg-emerald-100 text-emerald-800 border-emerald-200"
      }
    >
      {isOut ? "ناموجود" : isLow ? "کم" : "موجود"}
    </Badge>
  );
}

export function FeaturedBadge({ featured }: { featured: boolean }) {
  return featured ? (
    <Badge className="bg-accent text-accent-foreground border border-accent-foreground/20">
      ویژه
    </Badge>
  ) : (
    <span className="text-xs text-muted-foreground">—</span>
  );
}
