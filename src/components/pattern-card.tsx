"use client";

import Link from "next/link";
import { ShoppingCart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ImageFallback } from "@/components/image-fallback";
import { Price } from "@/components/price";
import { useCart } from "@/store/cart";
import { toast } from "sonner";
import type { Pattern } from "@/lib/types";

const DIFFICULTY_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  مبتدی: "secondary",
  متوسط: "default",
  پیشرفته: "destructive",
};

export function PatternCard({ pattern }: { pattern: Pattern }) {
  const add = useCart((s) => s.add);
  const image = pattern.images?.split(",")[0] || "";

  return (
    <Card className="group overflow-hidden rounded-2xl border-border/70 bg-card p-0 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <Link href={`/patterns/${pattern.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <ImageFallback
            src={image}
            alt={pattern.title}
            rounded="rounded-none"
            className="size-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute right-3 top-3 flex gap-1.5">
            {pattern.featured && (
              <Badge className="bg-primary text-primary-foreground shadow">ویژه</Badge>
            )}
            <Badge variant={DIFFICULTY_VARIANT[pattern.difficulty] ?? "default"}>
              {pattern.difficulty}
            </Badge>
          </div>
        </div>
      </Link>
      <div className="flex flex-col gap-2 p-4">
        <Link href={`/patterns/${pattern.id}`}>
          <h3 className="line-clamp-1 font-bold text-foreground transition-colors group-hover:text-primary">
            {pattern.title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">
          {pattern.description}
        </p>
        {(pattern.yarnType || pattern.needleSize) && (
          <div className="flex flex-wrap gap-1.5">
            {pattern.yarnType && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
                نخ: {pattern.yarnType}
              </span>
            )}
            {pattern.needleSize && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
                میل: {pattern.needleSize}
              </span>
            )}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <Price value={pattern.price} className="text-base" />
          <Button
            size="sm"
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
            <FileText className="size-4" />
            خرید الگو
          </Button>
        </div>
      </div>
    </Card>
  );
}
