"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { pressIcon, springSnappy } from "@/lib/motion";

interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
> {
  label: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "glass" | "accent";
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-10 w-10",
};

export function IconButton({
  label,
  children,
  size = "md",
  variant = "ghost",
  className,
  disabled,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <motion.button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled}
      whileHover={disabled ? undefined : pressIcon.hover}
      whileTap={disabled ? undefined : pressIcon.tap}
      transition={springSnappy}
      className={cn(
        "inline-flex items-center justify-center rounded-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
        "disabled:pointer-events-none disabled:opacity-40",
        "transition-colors duration-150",
        sizeMap[size],
        variant === "ghost" &&
          "text-[var(--text-secondary)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
        variant === "glass" &&
          "bg-[var(--hover-fill)] text-[var(--text-secondary)] border border-[var(--glass-border)] hover:bg-[var(--hover-fill-strong)] hover:text-[var(--text-primary)]",
        variant === "accent" &&
          "bg-[var(--btn-solid-bg)] text-[var(--btn-solid-fg)] shadow-[var(--btn-solid-shadow)] hover:bg-[var(--btn-solid-bg-hover)] border border-[var(--btn-solid-border)]",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
