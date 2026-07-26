"use client";

import { useState, useCallback } from "react";
import {
  Lock,
  ShieldCheck,
  Loader2,
  Building2,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatPrice, toFa } from "@/lib/format";

interface PaymentGatewayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  transactionId: string;
  amount: number;
  gatewayUrl: string; // Server-generated gateway page URL with embedded signatures
  onSuccess: () => void;
  onFailure: () => void;
}

export function PaymentGatewayDialog({
  open,
  onOpenChange,
  orderId,
  transactionId,
  amount,
  gatewayUrl,
  onSuccess,
  onFailure,
}: PaymentGatewayDialogProps) {
  const [cardNumber, setCardNumber] = useState("6219-8610-");
  const [expiry, setExpiry] = useState("");
  const [cvv2, setCvv2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatCardNumber = useCallback((value: string): string => {
    // Strip non-digits
    const digits = value.replace(/\D/g, "");
    // Take up to 16 digits
    const limited = digits.slice(0, 16);
    // Format as XXXX-XXXX-XXXX-XXXX
    const groups = limited.match(/.{1,4}/g);
    return groups ? groups.join("-") : "";
  }, []);

  const handleCardNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Preserve the prefilled prefix "6219-8610-"
      const prefix = "62198610";
      const digits = raw.replace(/\D/g, "");
      // If user tries to delete the prefix, restore it
      if (!digits.startsWith(prefix) && digits.length < prefix.length) {
        setCardNumber("6219-8610-");
        return;
      }
      setCardNumber(formatCardNumber(digits));
    },
    [formatCardNumber]
  );

  const handleExpiryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/\D/g, "").slice(0, 4);
      if (val.length >= 3) {
        val = val.slice(0, 2) + "/" + val.slice(2);
      }
      setExpiry(val);
    },
    []
  );

  const handleCvv2Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCvv2(e.target.value.replace(/\D/g, "").slice(0, 4));
    },
    []
  );

  const handlePay = useCallback(async () => {
    // Validate fields
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 16) {
      setError("شماره کارت را به صورت کامل وارد کنید");
      return;
    }
    if (expiry.replace(/\D/g, "").length < 4) {
      setError("تاریخ انقضا را وارد کنید");
      return;
    }
    if (cvv2.length < 3) {
      setError("CVV2 را وارد کنید");
      return;
    }

    setError("");
    setLoading(true);

    // Open the server-rendered gateway page in a new window.
    // The gateway page embeds HMAC signatures for secure payment verification.
    // Direct client-side verification without signatures would be rejected by the server.
    const gatewayWindow = window.open(gatewayUrl, "_blank");
    if (!gatewayWindow) {
      // Popup blocked — fallback: redirect in the same tab
      window.location.href = gatewayUrl;
      return;
    }

    // After opening the gateway, close the dialog.
    // The gateway page will redirect back to /account?payment=success on success
    // or /cart?payment=cancelled on failure.
    setLoading(false);
    onOpenChange(false);
  }, [cardNumber, expiry, cvv2, gatewayUrl, onOpenChange]);

  const handleCancel = useCallback(async () => {
    try {
      await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          orderId,
          success: false,
          signature: "CANCEL", // Server will reject invalid sig; that's OK for cancel flow
        }),
      });
    } catch {
      // Silently handle - we still need to close
    }
    onFailure();
    onOpenChange(false);
  }, [transactionId, orderId, onFailure, onOpenChange]);

  const resetForm = useCallback(() => {
    setCardNumber("6219-8610-");
    setExpiry("");
    setCvv2("");
    setError("");
    setLoading(false);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !loading) {
        // User closed dialog without paying
        handleCancel();
      }
      if (nextOpen) {
        resetForm();
      }
      onOpenChange(nextOpen);
    },
    [loading, handleCancel, resetForm, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!loading}
        className="max-w-md p-0 overflow-hidden gap-0 [&>button]:hidden"
        onPointerDownOutside={(e) => {
          if (loading) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        {/* ── Header: Dark blue gradient like Iranian gateways ── */}
        <div
          className="px-5 py-4 text-white"
          style={{
            background: "linear-gradient(135deg, #1a3a5c 0%, #0f2840 100%)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 className="size-5" />
              <span className="font-bold text-sm">درگاه پرداخت بافخانه</span>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 text-[10px] gap-1 hover:bg-white/20">
              <ShieldCheck className="size-3" />
              امن
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-white/70">
            <span>بانک ملت</span>
            <span>شناسه تراکنش: {toFa(transactionId)}</span>
          </div>
        </div>

        {/* ── Amount display ── */}
        <div className="px-5 py-3 bg-primary/5 border-b">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">مبلغ قابل پرداخت</span>
            <span className="font-bold text-primary text-lg">
              {formatPrice(amount)}
            </span>
          </div>
        </div>

        {/* ── Card form ── */}
        <div className="px-5 py-4 space-y-4" dir="rtl">
          <DialogHeader className="sr-only">
            <DialogTitle>درگاه پرداخت بافخانه</DialogTitle>
            <DialogDescription>
              اطلاعات کارت بانکی خود را وارد کنید
            </DialogDescription>
          </DialogHeader>

          {/* Card Number */}
          <div className="space-y-1.5">
            <Label htmlFor="gw-card-number" className="text-xs">
              شماره کارت
            </Label>
            <Input
              id="gw-card-number"
              inputMode="numeric"
              dir="ltr"
              className="text-center tracking-[0.2em] font-mono text-sm h-11"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={cardNumber}
              onChange={handleCardNumberChange}
              disabled={loading}
              maxLength={19}
            />
          </div>

          {/* Expiry + CVV2 row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gw-expiry" className="text-xs">
                تاریخ انقضا
              </Label>
              <Input
                id="gw-expiry"
                inputMode="numeric"
                dir="ltr"
                className="text-center font-mono text-sm h-11"
                placeholder="MM/YY"
                value={expiry}
                onChange={handleExpiryChange}
                disabled={loading}
                maxLength={5}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gw-cvv2" className="text-xs">
                CVV2
              </Label>
              <Input
                id="gw-cvv2"
                inputMode="numeric"
                dir="ltr"
                type="password"
                className="text-center font-mono text-sm h-11"
                placeholder="XXX"
                value={cvv2}
                onChange={handleCvv2Change}
                disabled={loading}
                maxLength={4}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 rounded-lg px-3 py-2">
              <XCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Separator />

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1 h-11 text-sm font-bold gap-2"
              onClick={handlePay}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  در حال پردازش...
                </>
              ) : (
                <>
                  <Lock className="size-4" />
                  پرداخت
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="h-11 px-6 text-sm"
              onClick={handleCancel}
              disabled={loading}
            >
              انصراف
            </Button>
          </div>
        </div>

        {/* ── Footer: SSL badge ── */}
        <div className="px-5 py-3 bg-muted/50 border-t flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          <span>اتصال امن SSL — اطلاعات کارت بانکی شما رمزنگاری می‌شود</span>
        </div>

        {/* ── Loading overlay ── */}
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
            <Loader2 className="size-10 text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">
              در حال تأیید تراکنش...
            </p>
            <p className="text-xs text-muted-foreground">
              لطفاً از صفحه خارج نشوید
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
