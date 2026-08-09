export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

/** Only local catalogue images are allowed; CSP deliberately blocks remote media. */
export function normalizeImageList(
  input: unknown,
  maxImages = 10,
  maxLength = 2_000
): ValidationResult {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return { ok: true, value: "" };
  if (raw.length > maxLength) {
    return { ok: false, message: "فهرست تصاویر بسیار طولانی است." };
  }

  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (values.length > maxImages) {
    return { ok: false, message: `حداکثر ${maxImages} تصویر مجاز است.` };
  }

  for (const value of values) {
    if (
      value.length > 300 ||
      !value.startsWith("/images/") ||
      value.startsWith("//") ||
      /[\\\u0000-\u001f\u007f?#]/.test(value) ||
      value.split("/").some((part) => part === "." || part === "..")
    ) {
      return {
        ok: false,
        message: "نشانی تصویر باید یک مسیر محلی معتبر در /images/ باشد.",
      };
    }
  }

  return { ok: true, value: values.join(",") };
}

export function normalizeContentReference(input: unknown): ValidationResult {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return { ok: true, value: "" };
  const relative = raw.replace(/^\.\//, "").replace(/^\/+/, "");
  const parts = relative.split("/");

  if (
    relative.length > 500 ||
    !relative.toLowerCase().endsWith(".html") ||
    /[\\\u0000-\u001f\u007f]/.test(relative) ||
    parts.some((part) => !part || part === "." || part === "..")
  ) {
    return {
      ok: false,
      message: "مسیر محتوا باید یک فایل HTML نسبی و معتبر باشد.",
    };
  }

  return { ok: true, value: relative };
}

export function normalizeVariants(input: unknown):
  | { ok: true; value: string }
  | { ok: false; message: string } {
  if (input === undefined) return { ok: true, value: "[]" };
  if (!Array.isArray(input) || input.length > 50) {
    return { ok: false, message: "گزینه‌های محصول معتبر نیستند." };
  }

  const variants: { name: string; color?: string }[] = [];
  for (const entry of input) {
    if (!entry || typeof entry !== "object") {
      return { ok: false, message: "گزینه‌های محصول معتبر نیستند." };
    }
    const record = entry as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const color = typeof record.color === "string" ? record.color.trim() : "";
    if (!name || name.length > 100) {
      return { ok: false, message: "نام گزینه محصول معتبر نیست." };
    }
    if (color && !/^#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?$/i.test(color)) {
      return { ok: false, message: "رنگ گزینه محصول باید کد hex معتبر باشد." };
    }
    variants.push({ name, ...(color ? { color } : {}) });
  }

  return { ok: true, value: JSON.stringify(variants) };
}
