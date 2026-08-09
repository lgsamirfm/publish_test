"use client";

import { CreditCard, Banknote, Lock, Truck, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

interface PaymentMethodSelectorProps {
  value: "ONLINE" | "COD";
  onChange: (method: "ONLINE" | "COD") => void;
  amount: number;
  disableCod?: boolean;
  disableCodReason?: string;
  disableOnline?: boolean;
  disableOnlineReason?: string;
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
  disableCod = false,
  disableCodReason = "الگوهای دیجیتال فقط به‌صورت آنلاین قابل پرداخت هستند.",
  disableOnline = false,
  disableOnlineReason = "درگاه پرداخت آنلاین در حال حاضر در دسترس نیست.",
}: PaymentMethodSelectorProps) {
  return (
    <div dir="rtl" className="space-y-3">
      <div className="text-sm font-medium text-muted-foreground mb-2">
        مبلغ قابل پرداخت:{" "}
        <span className="text-foreground font-bold">{formatPrice(amount)}</span>
      </div>

      {(disableCod || disableOnline) && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle className="size-4 shrink-0" />
          <span>{disableOnline ? disableOnlineReason : disableCodReason}</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {methods.map((method) => {
          const isDisabled =
            (method.key === "COD" && disableCod) ||
            (method.key === "ONLINE" && disableOnline);
          const isSelected = value === method.key;
          const Icon = method.icon;
          const BadgeIcon = method.badgeIcon;

          return (
            <button
              key={method.key}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onChange(method.key)}
              className={cn(
                "relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-right transition-all duration-200",
                isDisabled
                  ? "opacity-50 cursor-not-allowed bg-muted/30 border-muted"
                  : "cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isSelected && !isDisabled
                  ? "border-primary bg-primary/5 shadow-sm"
                  : !isDisabled && "border-muted bg-background hover:border-muted-foreground/30"
              )}
            >
              {/* Selected checkmark */}
              {isSelected && !isDisabled && (
                <div className="absolute top-3 left-3">
                  <CheckCircle2 className="size-5 text-primary fill-primary/10" />
                </div>
              )}

              {/* Icon + Title */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg",
                    isSelected && !isDisabled
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <span
                  className={cn(
                    "font-semibold text-sm",
                    isSelected && !isDisabled ? "text-primary" : "text-foreground"
                  )}
                >
                  {method.title}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isDisabled
                  ? method.key === "ONLINE"
                    ? "غیرقابل انتخاب تا زمان اتصال درگاه واقعی"
                    : "غیرقابل انتخاب (به دلیل وجود الگوی دیجیتال در سبد)"
                  : method.description}
              </p>

              {/* Badge */}
              <Badge
                variant={isSelected && !isDisabled ? "default" : "secondary"}
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