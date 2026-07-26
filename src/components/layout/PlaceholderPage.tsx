"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
}: PlaceholderPageProps) {
  return (
    <div className="flex h-full items-center justify-center px-6">
      {/* Opacity-only motion shell — glass must not share transform with enter anim */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: easeSpring }}
        className="w-full max-w-md"
        data-placeholder-shell
      >
        <div
          className={cn("glass rounded-[28px] px-8 py-10 text-center")}
          data-placeholder-glass
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hover-fill)] text-[var(--text-secondary)] shadow-[0_1px_0_0_var(--glass-specular-soft)_inset]">
            <Icon className="h-7 w-7" strokeWidth={1.4} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
          <div className="mt-6 inline-flex items-center rounded-full border border-[var(--glass-border)] bg-[var(--hover-fill)] px-3 py-1 text-[11px] font-medium tracking-tightr text-[var(--text-muted)]">
            Coming soon
          </div>
        </div>
      </motion.div>
    </div>
  );
}
