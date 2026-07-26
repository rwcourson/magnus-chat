"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Logo / portrait with graceful fallback to initials on brand color.
 */
export function BrandMark({
  src,
  alt = "",
  initials,
  brandColor = "#3a3a40",
  size = 40,
  className,
  rounded = "lg",
}: {
  src?: string;
  alt?: string;
  initials: string;
  brandColor?: string;
  size?: number;
  className?: string;
  /** Prefer square radii; `full` kept only for rare non-portrait marks */
  rounded?: "xl" | "2xl" | "full" | "lg" | "md";
}) {
  const [failed, setFailed] = useState(!src);
  const radius =
    rounded === "full"
      ? "rounded-full"
      : rounded === "2xl"
        ? "rounded-2xl"
        : rounded === "md"
          ? "rounded-md"
          : rounded === "xl"
            ? "rounded-xl"
            : "rounded-lg";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden ring-1 ring-[var(--glass-border)]",
        radius,
        className
      )}
      style={{ width: size, height: size }}
    >
      {!failed && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={cn(
            "h-full w-full object-contain",
            src.endsWith(".svg") ? "p-2" : "p-1",
            "bg-white dark:bg-white"
          )}
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-[11px] font-bold tracking-wide text-white"
          style={{
            background: `linear-gradient(145deg, ${brandColor}, ${shade(brandColor, -28)})`,
          }}
        >
          {initials.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

/**
 * Person / channel portrait — always rounded square (not circle)
 * so identity chrome stays consistent across feed, chat, and header.
 */
export function AvatarMark({
  src,
  initials,
  size = 36,
  className,
}: {
  src?: string;
  initials: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(!src);
  const px = Math.min(Math.max(size, 14), 96);
  // Match ConversationIdentityMark channel thumbs
  const radius = px <= 28 ? "rounded-md" : "rounded-lg";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden ring-1 ring-[var(--glass-border)]",
        radius,
        className
      )}
      style={{
        width: px,
        height: px,
        minWidth: px,
        minHeight: px,
        maxWidth: px,
        maxHeight: px,
      }}
    >
      {!failed && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={px}
          height={px}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#4a5568] to-[#1e2530] text-[10px] font-semibold text-white">
          {initials.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function shade(hex: string, percent: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const num = parseInt(raw, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
