"use client";

import { ShoppingCart, MapPin, CreditCard, CheckCircle2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toFa } from "@/lib/format";

const steps = [
  { label: "سبد خرید", icon: ShoppingCart },
  { label: "اطلاعات ارسال", icon: MapPin },
  { label: "پرداخت", icon: CreditCard },
  { label: "تأیید", icon: CheckCircle2 },
] as const;

interface CheckoutStepsProps {
  currentStep: 0 | 1 | 2 | 3;
}

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  return (
    <div dir="rtl" className="w-full">
      {/* Desktop: horizontal layout */}
      <div className="hidden sm:flex items-center justify-center gap-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isFuture = index > currentStep;
          const Icon = step.icon;

          return (
            <div key={index} className="flex items-center">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                    isCompleted &&
                      "bg-primary border-primary text-primary-foreground",
                    isActive &&
                      "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25",
                    isFuture &&
                      "bg-muted border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-5" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isActive && "text-primary font-bold",
                    isCompleted && "text-primary",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {isActive && (
                  <span className="text-[10px] text-muted-foreground">
                    مرحله {toFa(index + 1)}
                  </span>
                )}
              </div>

              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-16 lg:w-24 mx-2 transition-all duration-300",
                    index < currentStep ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: scrollable horizontal layout */}
      <div className="sm:hidden overflow-x-auto">
        <div className="flex items-center justify-start gap-0 min-w-max px-2 pb-2">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isFuture = index > currentStep;
            const Icon = step.icon;

            return (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                      isCompleted &&
                        "bg-primary border-primary text-primary-foreground",
                      isActive &&
                        "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25",
                      isFuture &&
                        "bg-muted border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="size-4" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium whitespace-nowrap",
                      isActive && "text-primary font-bold",
                      isCompleted && "text-primary",
                      isFuture && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-10 mx-1.5 transition-all duration-300",
                      index < currentStep
                        ? "bg-primary"
                        : "bg-muted-foreground/20"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
