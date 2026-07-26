"use client";

import { Hash } from "lucide-react";
import type { ConversationIdentity } from "@/types/messaging";
import { AvatarMark } from "@/components/ui/BrandMark";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";

/**
 * Shared identity chrome for conversation list, rail, and messaging header.
 * DM → peer portrait; channel with image → small square thumb; else hash tile.
 * Always size-capped so large cover photos never expand the chrome.
 */
export function ConversationIdentityMark({
  identity,
  size = 20,
  className,
}: {
  identity: ConversationIdentity;
  size?: number;
  className?: string;
}) {
  // Clamp: never larger than a modest avatar (header / list / rail)
  const px = Math.min(Math.max(size, 16), 40);
  const box = {
    width: px,
    height: px,
    minWidth: px,
    minHeight: px,
    maxWidth: px,
    maxHeight: px,
  } as const;

  if (identity.kind === "dm") {
    return (
      <AvatarMark
        src={identity.imageUrl}
        initials={identity.initials}
        size={px}
        className={className}
      />
    );
  }

  // Same radius language as AvatarMark (rounded square, never circle)
  const radius = px <= 28 ? "rounded-md" : "rounded-lg";

  if (identity.hasChannelImage && identity.imageUrl) {
    return (
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden ring-1 ring-[var(--glass-border)]",
          radius,
          className
        )}
        style={box}
        data-channel-image
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={identity.imageUrl}
          alt=""
          width={px}
          height={px}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        "bg-[var(--hover-fill)] text-[var(--text-muted)]",
        radius,
        className
      )}
      style={box}
      data-channel-hash
      aria-hidden
    >
      <Hash
        className="opacity-80"
        style={{ width: px * 0.5, height: px * 0.5 }}
        strokeWidth={ICON_STROKE}
      />
    </span>
  );
}
