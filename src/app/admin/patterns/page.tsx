"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Scissors, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageFallback } from "@/components/image-fallback";
import {
  DifficultyBadge,
  FeaturedBadge,
} from "@/components/admin/status-badge";
import { formatPrice, toFa } from "@/lib/format";
import type { Pattern } from "@/lib/types";

const DIFFICULTIES = ["مبتدی", "متوسط", "پیشرفته"];

type FormState = {
  title: string;
  description: string;
  price: string;
  images: string;
  difficulty: string;
  yarnType: string;
  needleSize: string;
  gauge: string;
  pdfUrl: string;
  featured: boolean;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  price: "",
  images: "",
  difficulty: "متوسط",
  yarnType: "",
  needleSize: "",
  gauge: "",
  pdfUrl: "",
  featured: false,
};

export default function AdminPatternsPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Pattern | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Pattern | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/patterns", { cache: "no-store" });
      if (!res.ok) throw new Error("خطا در دریافت الگوها");
      const data = (await res.json()) as { patterns: Pattern[] };
      setPatterns(data.patterns ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  }

  function openEdit(p: Pattern) {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description,
      price: String(p.price),
      images: p.images ?? "",
      difficulty: p.difficulty || "متوسط",
      yarnType: p.yarnType ?? "",
      needleSize: p.needleSize ?? "",
      gauge: p.gauge ?? "",
      pdfUrl: p.pdfUrl ?? "",
      featured: !!p.featured,
    });
    setDialogOpen(true);
  }

  async function submit() {
    if (!form.title.trim()) {
      toast.error("عنوان الگو الزامی است.");
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("قیمت معتبر نیست.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Math.round(price),
      images: form.images.trim(),
      difficulty: form.difficulty,
      yarnType: form.yarnType.trim(),
      needleSize: form.needleSize.trim(),
      gauge: form.gauge.trim(),
      pdfUrl: form.pdfUrl.trim(),
      featured: form.featured,
    };

    try {
      setSaving(true);
      const url = editing ? `/api/patterns/${editing.id}` : "/api/patterns";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "خطا در ذخیره الگو");
      }
      toast.success(editing ? "الگو بروزرسانی شد." : "الگوی جدید ایجاد شد.");
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/patterns/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "خطا در حذف الگو");
      }
      toast.success("الگو حذف شد.");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="shrink-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Scissors className="size-6 text-primary" />
            مدیریت الگوها
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مجموع{" "}
            <span className="font-bold text-foreground">
              {toFa(patterns.length)}
            </span>{" "}
            الگوی بافت
          </p>
        </div>

        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی الگو..."
            className="h-9 w-full pr-9"
          />
        </div>

        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="size-4" />
          افزودن الگو
        </Button>
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : patterns.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                هنوز الگویی ثبت نشده است. روی «افزودن الگو» بزنید.
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto scrollbar-persian">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-right">تصویر</TableHead>
                      <TableHead className="text-right">عنوان</TableHead>
                      <TableHead className="text-right">سطح</TableHead>
                      <TableHead className="text-right">نخ</TableHead>
                      <TableHead className="text-right">قیمت</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-left">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patterns
                      .filter((p) => {
                        if (!searchTerm.trim()) return true;
                        const q = searchTerm.trim().toLowerCase();
                        return (
                          p.title.toLowerCase().includes(q) ||
                          p.difficulty?.toLowerCase().includes(q) ||
                          p.yarnType?.toLowerCase().includes(q) ||
                          p.description?.toLowerCase().includes(q)
                        );
                      })
                      .map((p) => {
                      const img = p.images?.split(",").filter(Boolean)[0];
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <ImageFallback
                              src={img}
                              alt={p.title}
                              className="size-12"
                              rounded="rounded-lg"
                            />
                          </TableCell>
                          <TableCell className="max-w-56 truncate text-sm font-medium">
                            {p.title}
                          </TableCell>
                          <TableCell>
                            <DifficultyBadge difficulty={p.difficulty} />
                          </TableCell>
                          <TableCell className="max-w-32 truncate text-sm text-muted-foreground">
                            {p.yarnType || "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm font-semibold">
                            {formatPrice(p.price)}
                          </TableCell>
                          <TableCell>
                            <FeaturedBadge featured={p.featured} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(p)}
                                aria-label="ویرایش"
                                className="size-8"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget(p)}
                                aria-label="حذف"
                                className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto scrollbar-persian sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "ویرایش الگو" : "افزودن الگوی جدید"}
            </DialogTitle>
            <DialogDescription>
              اطلاعات الگوی بافت را وارد کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="pat-title">
                عنوان الگو <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pat-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: الگوی بافت کلاه زمستانی"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="pat-desc">توضیحات</Label>
              <Textarea
                id="pat-desc"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="توضیحات الگو..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pat-price">
                قیمت (تومان) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pat-price"
                inputMode="numeric"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value.replace(/\D/g, "") })
                }
                placeholder="۵۰۰۰۰"
              />
            </div>

            <div className="space-y-1.5">
              <Label>سطح دشواری</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v) => setForm({ ...form, difficulty: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب سطح" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pat-yarn">نوع نخ</Label>
              <Input
                id="pat-yarn"
                value={form.yarnType}
                onChange={(e) =>
                  setForm({ ...form, yarnType: e.target.value })
                }
                placeholder="مثال: مرینوس ۴ پلی"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pat-needle">سایز میل</Label>
              <Input
                id="pat-needle"
                value={form.needleSize}
                onChange={(e) =>
                  setForm({ ...form, needleSize: e.target.value })
                }
                placeholder="مثال: ۵ میلی‌متر"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pat-gauge">گاج (راسته)</Label>
              <Input
                id="pat-gauge"
                value={form.gauge}
                onChange={(e) => setForm({ ...form, gauge: e.target.value })}
                placeholder="مثال: ۲۰ ته × ۲۴ رج"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pat-pdf">آدرس فایل PDF الگو</Label>
              <Input
                id="pat-pdf"
                value={form.pdfUrl}
                onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
                placeholder="https://example.com/pattern.pdf"
                dir="ltr"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="pat-featured">الگوی ویژه</Label>
              <div className="flex h-10 items-center gap-3 rounded-lg border border-input bg-background px-3">
                <Switch
                  id="pat-featured"
                  checked={form.featured}
                  onCheckedChange={(v) => setForm({ ...form, featured: v })}
                />
                <span className="text-sm text-muted-foreground">
                  {form.featured ? "نمایش به‌عنوان ویژه" : "الگوی عادی"}
                </span>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="pat-images">آدرس تصاویر</Label>
              <Textarea
                id="pat-images"
                rows={2}
                value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })}
                placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
              />
              <p className="text-xs text-muted-foreground">
                چند آدرس را با کاما (،) جدا کنید.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              انصراف
            </Button>
            <Button onClick={submit} disabled={saving} className="gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? "ذخیره تغییرات" : "افزودن الگو"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الگو</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف الگوی «{deleteTarget?.title}» مطمئن هستید؟ این عملیات
              قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}