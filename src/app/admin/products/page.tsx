"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Package, Loader2, X, Search } from "lucide-react";
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
  FeaturedBadge,
  StockBadge,
} from "@/components/admin/status-badge";
import { formatPrice, toFa } from "@/lib/format";
import { parseVariants, type Product, type ProductVariant } from "@/lib/types";

const CATEGORIES = [
  "عروسک و آمیگورومی",
  "کلیدچین",
  "گل کروشه",
  "باجه گل",
  "لوازم تزئینی",
];

type FormState = {
  name: string;
  description: string;
  price: string;
  images: string[]; // array of image URLs (unlimited)
  variants: ProductVariant[]; // array of {name, color?}
  category: string;
  stock: string;
  featured: boolean;
};

const EMPTY: FormState = {
  name: "",
  description: "",
  price: "",
  images: [""],
  variants: [],
  category: CATEGORIES[0],
  stock: "0",
  featured: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) throw new Error("خطا در دریافت محصولات");
      const data = (await res.json()) as { products: Product[] };
      setProducts(data.products ?? []);
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

  function openEdit(p: Product) {
    setEditing(p);
    const imgs = p.images ? p.images.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const vars = parseVariants(p.variants);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      images: imgs.length > 0 ? imgs : [""],
      variants: vars,
      category: p.category || CATEGORIES[0],
      stock: String(p.stock),
      featured: !!p.featured,
    });
    setDialogOpen(true);
  }

  // ---- image URL helpers ----
  function setImage(i: number, val: string) {
    setForm((f) => {
      const images = [...f.images];
      images[i] = val;
      return { ...f, images };
    });
  }
  function addImage() {
    setForm((f) => ({ ...f, images: [...f.images, ""] }));
  }
  function removeImage(i: number) {
    setForm((f) => {
      const images = f.images.filter((_, idx) => idx !== i);
      return { ...f, images: images.length > 0 ? images : [""] };
    });
  }

  // ---- variant helpers ----
  function setVariant(i: number, field: keyof ProductVariant, val: string) {
    setForm((f) => {
      const variants = [...f.variants];
      variants[i] = { ...variants[i], [field]: val };
      return { ...f, variants };
    });
  }
  function addVariant() {
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { name: "", color: "" }],
    }));
  }
  function removeVariant(i: number) {
    setForm((f) => ({
      ...f,
      variants: f.variants.filter((_, idx) => idx !== i),
    }));
  }

  async function submit() {
    if (!form.name.trim()) {
      toast.error("نام محصول الزامی است.");
      return;
    }
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("قیمت معتبر نیست.");
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      toast.error("موجودی معتبر نیست.");
      return;
    }

    // Build comma-separated images (drop empty).
    const imagesStr = form.images.map((s) => s.trim()).filter(Boolean).join(",");

    // Clean variants (drop empty names).
    const cleanVariants = form.variants
      .map((v) => ({
        name: v.name.trim(),
        color: v.color ? v.color.trim() : undefined,
      }))
      .filter((v) => v.name);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Math.round(price),
      images: imagesStr,
      variants: cleanVariants,
      category: form.category,
      stock: Math.round(stock),
      featured: form.featured,
    };

    try {
      setSaving(true);
      const url = editing
        ? `/api/products/${editing.id}`
        : "/api/products";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "خطا در ذخیره محصول");
      }
      toast.success(
        editing ? "محصول بروزرسانی شد." : "محصول جدید ایجاد شد."
      );
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
      const res = await fetch(`/api/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "خطا در حذف محصول");
      }
      toast.success("محصول حذف شد.");
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
            <Package className="size-6 text-primary" />
            مدیریت محصولات
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مجموع{" "}
            <span className="font-bold text-foreground">
              {toFa(products.length)}
            </span>{" "}
            محصول
          </p>
        </div>

        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی محصول..."
            className="h-9 w-full pr-9"
          />
        </div>

        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="size-4" />
          افزودن محصول
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
            ) : products.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                هنوز محصولی ثبت نشده است. روی «افزودن محصول» بزنید.
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto scrollbar-persian">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-right">تصویر</TableHead>
                      <TableHead className="text-right">نام</TableHead>
                      <TableHead className="text-right">دسته‌بندی</TableHead>
                      <TableHead className="text-right">قیمت</TableHead>
                      <TableHead className="text-right">موجودی</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-left">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products
                      .filter((p) => {
                        if (!searchTerm.trim()) return true;
                        const q = searchTerm.trim().toLowerCase();
                        return (
                          p.name.toLowerCase().includes(q) ||
                          p.category?.toLowerCase().includes(q) ||
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
                              alt={p.name}
                              className="size-12"
                              rounded="rounded-lg"
                            />
                          </TableCell>
                          <TableCell className="max-w-48 truncate text-sm font-medium">
                            {p.name}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.category}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm font-semibold">
                            {formatPrice(p.price)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StockBadge stock={p.stock} />
                              <span className="text-xs text-muted-foreground">
                                {toFa(p.stock)}
                              </span>
                            </div>
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
              {editing ? "ویرایش محصول" : "افزودن محصول جدید"}
            </DialogTitle>
            <DialogDescription>
              اطلاعات محصول را وارد کنید. می‌توانید چند تصویر و چند گزینه
              (مثلاً رنگ) اضافه کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="p-name">
                نام محصول <span className="text-destructive">*</span>
              </Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: شال بافتنی مرینوس"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="p-desc">توضیحات</Label>
              <Textarea
                id="p-desc"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="توضیحات محصول..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-price">
                قیمت (تومان) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="p-price"
                inputMode="numeric"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value.replace(/\D/g, "") })
                }
                placeholder="۲۵۰۰۰۰"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-stock">
                موجودی <span className="text-destructive">*</span>
              </Label>
              <Input
                id="p-stock"
                inputMode="numeric"
                value={form.stock}
                onChange={(e) =>
                  setForm({ ...form, stock: e.target.value.replace(/\D/g, "") })
                }
                placeholder="۱۰"
              />
            </div>

            <div className="space-y-1.5">
              <Label>دسته‌بندی</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دسته" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-featured">محصول ویژه</Label>
              <div className="flex h-10 items-center gap-3 rounded-lg border border-input bg-background px-3">
                <Switch
                  id="p-featured"
                  checked={form.featured}
                  onCheckedChange={(v) => setForm({ ...form, featured: v })}
                />
                <span className="text-sm text-muted-foreground">
                  {form.featured ? "نمایش به‌عنوان ویژه" : "محصول عادی"}
                </span>
              </div>
            </div>

            {/* Images — dynamic, unlimited */}
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label>تصاویر محصول</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addImage}
                  className="gap-1.5"
                >
                  <Plus className="size-3.5" />
                  افزودن تصویر
                </Button>
              </div>
              <div className="space-y-2">
                {form.images.map((img, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ImageFallback
                      src={img || undefined}
                      alt={`تصویر ${toFa(i + 1)}`}
                      className="size-12 shrink-0"
                      rounded="rounded-lg"
                    />
                    <Input
                      value={img}
                      onChange={(e) => setImage(i, e.target.value)}
                      dir="ltr"
                      className="text-left"
                      placeholder="/images/example.png یا https://..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeImage(i)}
                      aria-label="حذف تصویر"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                اولین تصویر به‌عنوان تصویر اصلی نمایش داده می‌شود. می‌توانید
                هر تعداد تصویر که خواستید اضافه کنید.
              </p>
            </div>

            {/* Variants — dynamic, unlimited (e.g. colors) */}
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label>گزینه‌ها (رنگ‌ها / مدل‌ها)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                  className="gap-1.5"
                >
                  <Plus className="size-3.5" />
                  افزودن گزینه
                </Button>
              </div>
              {form.variants.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
                  گزینه‌ای اضافه نشده. اگر محصول در رنگ‌ها یا مدل‌های مختلف
                  موجود است، یک گزینه اضافه کنید تا کاربر قبل از افزودن به سبد
                  انتخاب کند.
                </p>
              ) : (
                <div className="space-y-2">
                  {form.variants.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={v.name}
                        onChange={(e) => setVariant(i, "name", e.target.value)}
                        placeholder="نام گزینه (مثلاً قرمز)"
                        className="flex-1"
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={v.color || "#ffffff"}
                          onChange={(e) => setVariant(i, "color", e.target.value)}
                          className="size-9 shrink-0 cursor-pointer rounded-lg border border-input bg-background p-1"
                          aria-label="رنگ گزینه"
                          title="رنگ"
                        />
                        <Input
                          value={v.color || ""}
                          onChange={(e) => setVariant(i, "color", e.target.value)}
                          dir="ltr"
                          className="w-24 text-left"
                          placeholder="#ff0000"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeVariant(i)}
                        aria-label="حذف گزینه"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                نام گزینه اجباری است؛ رنگ اختیاری است و به‌عنوان دایرهٔ رنگی
                نمایش داده می‌شود.
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
              {editing ? "ذخیره تغییرات" : "افزودن محصول"}
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
            <AlertDialogTitle>حذف محصول</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف محصول «{deleteTarget?.name}» مطمئن هستید؟ این عملیات
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