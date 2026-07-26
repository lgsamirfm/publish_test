// Shared TypeScript types mirroring Prisma models (for client use).

// A product variant option, e.g. a color the user can pick before adding to cart.
export type ProductVariant = {
  name: string;   // e.g. "قرمز"
  color?: string; // optional hex, e.g. "#dc2626"
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string;
  variants: string; // JSON string of ProductVariant[]
  category: string;
  stock: number;
  featured: boolean;
  createdAt: Date | string;
};

export function parseVariants(raw?: string): ProductVariant[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((v) => v && typeof v.name === "string")
      .map((v) => ({ name: String(v.name), color: v.color ? String(v.color) : undefined }));
  } catch {
    return [];
  }
}

export type Pattern = {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string;
  difficulty: string;
  yarnType: string;
  needleSize: string;
  gauge: string;
  pdfUrl: string;
  featured: boolean;
  createdAt: Date | string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
};

export type CartItem = {
  type: "PRODUCT" | "PATTERN";
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "در انتظار",
  PAID: "پرداخت‌شده",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELLED: "لغوشده",
};

// Payment types
export type PaymentMethod = "ONLINE" | "COD";

export type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "FAILED";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ONLINE: "پرداخت آنلاین",
  COD: "پرداخت در محل",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "پرداخت‌نشده",
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  FAILED: "پرداخت ناموفق",
};

export const PAYMENT_STATUS_VARIANT: Record<
  PaymentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  UNPAID: "outline",
  PENDING: "secondary",
  PAID: "default",
  FAILED: "destructive",
};

// Shipping config
export const SHIPPING_THRESHOLD = 500_000; // Free shipping above this (in toman)
export const SHIPPING_COST = 50_000; // Shipping cost (in toman)
