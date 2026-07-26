/**
 * Canonical Open Graph / link-preview image for Magnus.
 * File lives at public/og.png (1200×630).
 */

export const MAGNUS_OG_IMAGE_PATH = "/og.png";
export const MAGNUS_OG_IMAGE_WIDTH = 1200;
export const MAGNUS_OG_IMAGE_HEIGHT = 630;
export const MAGNUS_OG_IMAGE_ALT = "Magnus — Brasfield & Gorrie";

/** Resolve a link-card preview image; fall back to the brand OG art. */
export function linkPreviewImage(imageUrl?: string | null): string {
  const u = imageUrl?.trim();
  if (u) return u;
  return MAGNUS_OG_IMAGE_PATH;
}
