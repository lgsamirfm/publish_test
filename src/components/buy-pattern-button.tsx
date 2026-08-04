"use client";

import { ShoppingCart } from "lucide-react";
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
    <Button
      size="lg"
      className="w-full"
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
  );
}