"use client";

import { CreditCard, Banknote, Lock, Truck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

interface PaymentMethodSelectorProps {
  value: "ONLINE" | "COD";
  onChange: (method: "ONLINE" | "COD") => void;
  amount: number;
}

const methods = [
  {
    key: "ONLINE" as const,
    title: "پرداخت آنلاین",
    icon: CreditCard,
    description: "پرداخت امن از طریق درگاه بانکی",
    badgeIcon: Lock,
    badgeText: "پرداخت امن",
    extra: "ملت، سامان، پاسارگاد",
  },
  {
    key: "COD" as const,
    title: "پرداخت در محل",
    icon: Banknote,
    description: "پرداخت هنگام تحویل سفارش",
    badgeIcon: Truck,
    badgeText: "بدون پیش‌پرداخت",
    extra: "هزینه ارسال هنگام تحویل دریافت می‌شود",
  },
];

export function PaymentMethodSelector({
  value,
  onChange,
  amount,
}: PaymentMethodSelectorProps) {
  return (
    <div dir="rtl" className="space-y-3">
      <div className="text-sm font-medium text-muted-foreground mb-2">
        مبلغ قابل پرداخت:{" "}
        <span className="text-foreground font-bold">{formatPrice(amount)}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {methods.map((method) => {
          const isSelected = value === method.key;
          const Icon = method.icon;
          const BadgeIcon = method.badgeIcon;

          return (
            <button
              key={method.key}
              type="button"
              onClick={() => onChange(method.key)}
              className={cn(
                "relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-right transition-all duration-200 cursor-pointer",
                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-muted bg-background hover:border-muted-foreground/30"
              )}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-3 left-3">
                  <CheckCircle2 className="size-5 text-primary fill-primary/10" />
                </div>
              )}

              {/* Icon + Title */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg",
                    isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <span
                  className={cn(
                    "font-semibold text-sm",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {method.title}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {method.description}
              </p>

              {/* Badge */}
              <Badge
                variant={isSelected ? "default" : "secondary"}
                className="gap-1 text-[10px]"
              >
                <BadgeIcon className="size-3" />
                {method.badgeText}
              </Badge>

              {/* Extra info */}
              <p
                className={cn(
                  "text-[11px] leading-relaxed",
                  method.key === "ONLINE"
                    ? "text-muted-foreground"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {method.key === "ONLINE" ? (
                  <>بانک‌ها: {method.extra}</>
                ) : (
                  method.extra
                )}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
