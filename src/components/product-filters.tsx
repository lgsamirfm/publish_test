"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  { value: "all", label: "همه دسته‌ها" },
  { value: "عروسک و آمیگورومی", label: "عروسک و آمیگورومی" },
  { value: "کلیدچین", label: "کلیدچین" },
  { value: "گل کروشه", label: "گل کروشه" },
  { value: "باجه گل", label: "باجه گل" },
  { value: "لوازم تزئینی", label: "لوازم تزئینی" },
];

const SORTS = [
  { value: "newest", label: "جدیدترین" },
  { value: "price-asc", label: "ارزان‌ترین" },
  { value: "price-desc", label: "گران‌ترین" },
];

export function ProductFilters({
  q,
  category,
  sort,
}: {
  q?: string;
  category?: string;
  sort?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(q ?? "");

  const activeCategory = category ?? "all";
  const activeSort = sort ?? "newest";

  function buildUrl(next: { q?: string; category?: string; sort?: string }) {
    const sp = new URLSearchParams(params.toString());
    if (next.q !== undefined) {
      if (next.q) sp.set("q", next.q);
      else sp.delete("q");
    }
    if (next.category !== undefined) {
      if (next.category && next.category !== "all") sp.set("category", next.category);
      else sp.delete("category");
    }
    if (next.sort !== undefined) {
      if (next.sort && next.sort !== "newest") sp.set("sort", next.sort);
      else sp.delete("sort");
    }
    const qs = sp.toString();
    return qs ? `/products?${qs}` : "/products";
  }

  function push(next: { q?: string; category?: string; sort?: string }) {
    startTransition(() => router.push(buildUrl(next)));
  }

  function onSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    push({ q: search.trim() });
  }

  function onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:gap-2 sm:p-4">
      <form onSubmit={onSearchSubmit} className="relative flex-1">
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={onSearchChange}
          placeholder="جستجوی محصول…"
          className="h-10 pr-9"
          aria-label="جستجوی محصول"
        />
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">فیلتر:</span>
        </div>

        <Select
          value={activeCategory}
          onValueChange={(v) => push({ category: v })}
        >
          <SelectTrigger className="h-10 w-full min-w-[10rem] sm:w-[12rem]" aria-label="دسته‌بندی">
            <SelectValue placeholder="همه دسته‌ها" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={activeSort} onValueChange={(v) => push({ sort: v })}>
          <SelectTrigger className="h-10 w-full min-w-[9rem] sm:w-[10rem]" aria-label="مرتب‌سازی">
            <SelectValue placeholder="جدیدترین" />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function ProductFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:gap-2 sm:p-4">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-full min-w-[10rem] sm:w-[12rem]" />
      <Skeleton className="h-10 w-full min-w-[9rem] sm:w-[10rem]" />
    </div>
  );
}
