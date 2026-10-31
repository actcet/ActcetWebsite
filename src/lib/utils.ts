import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely, allowing conditional class names. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Build a seeded placeholder photo URL — swap for a real image path later. */
export function placeholderImage(seed: string, width = 600, height = 400) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

/**
 * Validates and normalizes an external URL (e.g. registration links) so only safe
 * http:// or https:// protocols are permitted (preventing javascript:/data: XSS).
 */
export function safeExternalHref(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Reject dangerous schemes immediately
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validates an image source URL so only safe https://, http://, data:image/*,
 * or local relative paths (/images/..., ./..., assets/...) are rendered.
 */
export function safeImageSrc(rawSrc?: string | null, fallback = ""): string {
  if (!rawSrc || typeof rawSrc !== "string") return fallback;
  const trimmed = rawSrc.trim();
  if (!trimmed) return fallback;

  if (/^data:image\/(jpeg|jpg|png|webp|gif|svg\+xml);base64,/i.test(trimmed)) {
    return trimmed;
  }
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    trimmed.startsWith("images/") ||
    trimmed.startsWith("assets/")
  ) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return trimmed;
    }
  } catch {
    // Fall through
  }
  return fallback;
}
