"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Trailing primary CTA(s) — wraps under title on narrow screens */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: easeSpring }}
      className={cn("mb-6", className)}
    >
      {(eyebrow || Icon) && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] px-2.5 py-1 text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
          {Icon && (
            <Icon
              className="h-3.5 w-3.5 text-[var(--text-muted)]"
              strokeWidth={ICON_STROKE}
            />
          )}
          {eyebrow}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-[1.65rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-[1.85rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div
            className="flex shrink-0 flex-wrap items-center gap-2"
            data-page-header-actions
          >
            {actions}
          </div>
        )}
      </div>
    </motion.header>
  );
}
