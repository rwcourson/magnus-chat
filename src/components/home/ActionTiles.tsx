"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ActionTile } from "@/types/home";
import { actionTiles as defaultTiles } from "@/lib/home-data";
import { BrandMark } from "@/components/ui/BrandMark";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";

interface ActionTilesProps {
  tiles?: ActionTile[];
  className?: string;
}

/**
 * Intelligent home tiles with badges — real logos where available.
 */
export function ActionTiles({
  tiles = defaultTiles,
  className,
}: ActionTilesProps) {
  return (
    <section
      className={cn("w-full", className)}
      aria-label="Actions needed"
      data-action-tiles
    >
      <div className="mb-3 px-0.5">
        <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
          Needs your attention
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tiles.map((tile, i) => (
          <motion.div
            key={tile.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.08 + i * 0.04,
              duration: 0.35,
              ease: easeSpring,
            }}
          >
            <Link
              href={tile.href}
              className={cn(
                "group relative flex flex-col gap-2.5 rounded-2xl p-3",
                "border border-[var(--glass-border-soft)]",
                "bg-[var(--glass-strong-solid)]",
                "shadow-[var(--shadow-xs)]",
                "transition-[border-color,box-shadow,transform] duration-200",
                "hover:border-[var(--glass-border)] hover:shadow-[var(--shadow-sm)]",
                "active:scale-[0.98]"
              )}
              data-action-tile={tile.id}
            >
              <div className="flex items-start justify-between gap-2">
                <BrandMark
                  src={tile.logoUrl}
                  initials={tile.mark}
                  brandColor={tile.brandColor ?? "#3a4558"}
                  size={36}
                  rounded="xl"
                  className="shadow-[var(--shadow-xs)]"
                />
                {typeof tile.badge === "number" && tile.badge > 0 && (
                  <span
                    className={cn(
                      "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5",
                      "bg-[#c45c5c] text-[10px] font-bold tabular-nums text-white",
                      "ring-1 ring-white/15"
                    )}
                  >
                    {tile.badge > 99 ? "99+" : tile.badge}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold tracking-tight text-[var(--text-primary)]">
                  {tile.label}
                </p>
                <p className="mt-0.5 truncate text-[11.5px] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
                  {tile.detail}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
