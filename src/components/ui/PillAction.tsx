"use client";

import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";

type Size = "sm" | "md";

const sizeClass: Record<Size, string> = {
  sm: "h-7 gap-1 px-2.5 text-[11px]",
  md: "h-8 gap-1.5 px-3 text-[12px]",
};

const iconSize: Record<Size, string> = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
};

const baseClass = cn(
  "chat-glass chat-glass-interactive",
  "inline-flex shrink-0 items-center justify-center rounded-full",
  "font-medium text-[var(--pill-fg)]",
  "hover:text-[var(--pill-fg-hover)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
  "disabled:pointer-events-none disabled:opacity-50"
);

interface PillActionShared {
  children: React.ReactNode;
  className?: string;
  size?: Size;
  /** Leading icon */
  icon?: LucideIcon;
  /** Trailing arrow (default true for links) */
  arrow?: boolean;
  disabled?: boolean;
}

type PillActionProps =
  | (PillActionShared & {
      href: string;
      onClick?: never;
      type?: never;
    })
  | (PillActionShared & {
      href?: never;
      onClick?: () => void;
      type?: "button" | "submit";
    });

/**
 * Uniform secondary action — section headers, “Open feed”, “All news”, etc.
 * Ghost pill + optional trailing arrow.
 */
export function PillAction({
  children,
  className,
  size = "md",
  icon: Icon,
  arrow,
  disabled,
  ...rest
}: PillActionProps) {
  const showArrow = arrow ?? ("href" in rest && !!rest.href);
  const classes = cn(baseClass, sizeClass[size], className);
  const iconCls = iconSize[size];

  const content = (
    <>
      {Icon && (
        <Icon className={iconCls} strokeWidth={ICON_STROKE} aria-hidden />
      )}
      <span className="truncate">{children}</span>
      {showArrow && (
        <ArrowRight className={iconCls} strokeWidth={ICON_STROKE} aria-hidden />
      )}
    </>
  );

  if ("href" in rest && rest.href) {
    return (
      <Link href={rest.href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={rest.type ?? "button"}
      onClick={rest.onClick}
      disabled={disabled}
      className={classes}
    >
      {content}
    </button>
  );
}
