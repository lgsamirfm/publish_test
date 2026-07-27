// Persian number + price formatting helpers.

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFa(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/**
 * Converts Persian (۰-۹) and Arabic (٠-٩) digits to English digits (0-9).
 */
export function toEnDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/**
 * Normalizes an Iranian phone number string:
 * Converts digits to English and removes spaces.
 */
export function normalizeIranianPhone(phone: string): string {
  if (!phone) return "";
  const en = toEnDigits(phone.trim());
  return en.replace(/\s+/g, "");
}

/**
 * Validates an Iranian mobile phone number format:
 * - Starts with 09
 * - Total length is exactly 11 digits
 */
export function isValidIranianPhone(phone: string): boolean {
  const normalized = normalizeIranianPhone(phone);
  return /^09\d{9}$/.test(normalized);
}

export function formatPrice(value: number): string {
  const formatted = new Intl.NumberFormat("en-US").format(value);
  return `${toFa(formatted)} تومان`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return toFa(d.toLocaleDateString());
  }
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return toFa(d.toLocaleString());
  }
}