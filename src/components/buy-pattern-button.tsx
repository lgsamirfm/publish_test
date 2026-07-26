"use client";

import { ShoppingCart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { toast } from "sonner";

type Props = {
  pattern: {
    id: string;
    title: string;
    price: number;
    images: string;
  };
};

export function BuyPatternButton({ pattern }: Props) {
  const add = useCart((s) => s.add);
  const image = pattern.images?.split(",")[0] || "";

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        size="lg"
        className="flex-1"
        onClick={() => {
          add({
            type: "PATTERN",
            id: pattern.id,
            name: pattern.title,
            price: pattern.price,
            image,
          });
          toast.success("الگو به سبد خرید اضافه شد");
        }}
      >
        <ShoppingCart className="size-4" />
        خرید الگو و افزودن به سبد
      </Button>
      <Button
        size="lg"
        variant="outline"
        disabled
        title="این دکمه برای نمایش است؛ پس از خرید فعال می‌شود"
      >
        <Download className="size-4" />
        دانلود نمونه
      </Button>
    </div>
  );
}
