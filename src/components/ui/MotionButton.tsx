"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { pressPrimary, springSnappy } from "@/lib/motion";

interface MotionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
> {
  children: ReactNode;
  className?: string;
}

/** Generic fluid pressable button with spring scale */
export function MotionButton({
  children,
  className,
  disabled,
  type = "button",
  ...props
}: MotionButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={disabled ? undefined : pressPrimary.hover}
      whileTap={disabled ? undefined : pressPrimary.tap}
      transition={springSnappy}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
        "disabled:pointer-events-none disabled:opacity-40",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
