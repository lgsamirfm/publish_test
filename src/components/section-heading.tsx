import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  className,
  align = "right",
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  className?: string;
  align?: "right" | "center";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && (
        <span className="inline-block w-fit rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}
