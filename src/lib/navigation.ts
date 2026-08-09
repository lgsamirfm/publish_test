export function safeInternalPath(
  value: string | null | undefined,
  fallback: string
): string {
  if (!value || !value.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(value)) {
    return fallback;
  }

  try {
    const base = new URL("https://internal.invalid/");
    const resolved = new URL(value, base);
    if (resolved.origin !== base.origin) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
