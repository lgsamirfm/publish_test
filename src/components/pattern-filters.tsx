"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, ArrowDownUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  q?: string;
  difficulty?: string;
  sort?: string;
};

const DIFFICULTY_OPTIONS = [
  { value: "all", label: "همه" },
  { value: "مبتدی", label: "مبتدی" },
  { value: "متوسط", label: "متوسط" },
  { value: "پیشرفته", label: "پیشرفته" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "جدیدترین" },
  { value: "price-asc", label: "ارزان‌ترین" },
  { value: "price-desc", label: "گران‌ترین" },
];

export function PatternFilters({ q, difficulty, sort }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [term, setTerm] = useState(q ?? "");
  const [pending, startTransition] = useTransition();

  function build(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    // normalize: drop default/empty
    const merged: Record<string, string> = {};
    for (const [k, v] of params.entries()) merged[k] = v;
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === "all" || (k === "sort" && v === "newest")) {
        delete merged[k];
      } else {
        merged[k] = v;
      }
    }
    const qs = new URLSearchParams(merged).toString();
    startTransition(() => router.push(qs ? `/patterns?${qs}` : "/patterns"));
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:gap-3">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") build({ q: term.trim() });
          }}
          onBlur={() => {
            if ((q ?? "") !== term.trim()) build({ q: term.trim() });
          }}
          placeholder="جستجوی الگو…"
          aria-label="جستجوی الگو"
          className="h-10 pr-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={difficulty && difficulty !== "all" ? difficulty : "all"}
          onValueChange={(v) => build({ difficulty: v })}
        >
          <SelectTrigger className="h-10 w-full sm:w-40" aria-label="فیلتر سطح">
            <SelectValue placeholder="سطح" />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sort ?? "newest"}
          onValueChange={(v) => build({ sort: v })}
        >
          <SelectTrigger className="h-10 w-full sm:w-40" aria-label="مرتب‌سازی">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <ArrowDownUp className="size-3.5" />
              <SelectValue placeholder="مرتب‌سازی" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {pending && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            …
          </span>
        )}
      </div>
    </div>
  );
}
