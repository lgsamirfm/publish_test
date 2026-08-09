"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ImageFallback } from "@/components/image-fallback";
import { Price } from "@/components/price";
import { useCart } from "@/store/cart";
import { toast } from "sonner";
import { madeToOrderLabel } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const image = product.images?.split(",")[0] || "";

  return (
    <Card className="group overflow-hidden rounded-2xl border-border/70 bg-card p-0 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <ImageFallback
            src={image}
            alt={product.name}
            rounded="rounded-none"
            className="size-full transition-transform duration-500 group-hover:scale-105"
          />
          {product.featured && (
            <Badge className="absolute right-3 top-3 bg-primary text-primary-foreground shadow">
              ویژه
            </Badge>
          )}
          {product.stock <= 0 && (
             <span className="absolute bottom-3 right-3 rounded-full bg-amber-100/95 px-3 py-1 text-[11px] font-bold text-amber-800 shadow">
              قابل سفارش {madeToOrderLabel(product.productionDays ?? 7)}
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-col gap-1.5 p-2.5 sm:p-4">
        <Badge variant="secondary" className="w-fit text-[11px]">
          {product.category}
        </Badge>
        <Link href={`/products/${product.id}`}>
           <h3 className="line-clamp-1 font-bold text-foreground text-xs sm:text-base transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <p className="line-clamp-2 text-[10px] sm:text-xs leading-5 sm:leading-6 text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <Price value={product.price} className="text-xs sm:text-base" />
          <Button
            size="sm"
            
            onClick={() => {
              add({
                type: "PRODUCT",
                id: product.id,
                name: product.name,
                price: product.price,
                image,
              });
              if (product.stock <= 0) {
                toast.success(
                  `به سبد خرید اضافه شد — آماده‌سازی حدود ${madeToOrderLabel(product.productionDays ?? 7)} طول می‌کشد`
                );
              } else {
                toast.success("به سبد خرید اضافه شد");
              }
            }}
          >
            <ShoppingCart className="size-3 sm:size-4" />
            <span className="text-[10px] sm:text-xs">افزودن</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
