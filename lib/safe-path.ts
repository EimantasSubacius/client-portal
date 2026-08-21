/**
 * Allow only same-origin relative paths. Blocks open redirects.
 */
export function safeInternalPath(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  if (!/^\/[a-zA-Z0-9/_-]*$/.test(trimmed)) return fallback;
  return trimmed;
}
