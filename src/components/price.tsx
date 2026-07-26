import { formatPrice } from "@/lib/format";

export function Price({
  value,
  className,
  strike,
}: {
  value: number;
  className?: string;
  strike?: boolean;
}) {
  return (
    <span
      className={
        strike
          ? `text-sm text-muted-foreground line-through ${className ?? ""}`
          : `font-bold text-foreground ${className ?? ""}`
      }
    >
      {formatPrice(value)}
    </span>
  );
}
