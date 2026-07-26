"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { toast } from "sonner";
import { toFa } from "@/lib/format";
import { parseVariants, type ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    images: string;
    stock?: number;
    variants?: string; // JSON string of ProductVariant[]
  };
};

export function AddToCartButton({ product }: Props) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);

  const variants: ProductVariant[] = parseVariants(product.variants);
  const [selectedVariant, setSelectedVariant] = useState<string>(
    variants[0]?.name ?? ""
  );

  const outOfStock = (product.stock ?? 0) <= 0;
  const image = product.images?.split(",")[0] || "";

  function handleAdd() {
    if (outOfStock) return;
    if (variants.length > 0 && !selectedVariant) {
      toast.error("لطفاً یک گزینه انتخاب کنید.");
      return;
    }
    add(
      {
        type: "PRODUCT",
        id: product.id,
        name: product.name,
        price: product.price,
        image,
        variant: selectedVariant || undefined,
      },
      qty
    );
    toast.success("به سبد خرید اضافه شد");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Variant selector (colors / styles) */}
      {variants.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-foreground">
            انتخاب گزینه:
            {selectedVariant && (
              <span className="mr-1 font-normal text-muted-foreground">
                {selectedVariant}
              </span>
            )}
          </span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const active = selectedVariant === v.name;
              return (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setSelectedVariant(v.name)}
                  aria-label={v.name}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  )}
                >
                  {v.color && (
                    <span
                      className="size-4 rounded-full border border-black/10"
                      style={{ backgroundColor: v.color }}
                    />
                  )}
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity + add to cart */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex h-11 items-center justify-between rounded-lg border border-border/70 bg-card px-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9"
            aria-label="کاهش تعداد"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={outOfStock || qty <= 1}
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-8 text-center font-semibold tabular-nums">
            {toFa(qty)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9"
            aria-label="افزایش تعداد"
            onClick={() => setQty((q) => Math.min(10, q + 1))}
            disabled={outOfStock || qty >= 10}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <Button
          size="lg"
          className="h-11 flex-1"
          onClick={handleAdd}
          disabled={outOfStock}
        >
          <ShoppingCart className="size-5" />
          {outOfStock ? "ناموجود" : "افزودن به سبد"}
        </Button>
      </div>
    </div>
  );
}
