import { cn } from "@/lib/utils";

export type LogoTone = "white" | "navy" | "sidebar";

interface MagnusLogoProps {
  className?: string;
  size?: number;
  /** @deprecated Glow removed for flat UI */
  glow?: boolean;
  /**
   * Mark color treatment:
   * - white: always pure white (empty state / on dark canvas)
   * - navy: always deep navy (light surfaces)
   * - sidebar: theme-aware (white in dark, ice cyan in Magnus, navy in light)
   */
  tone?: LogoTone;
  /** @deprecated use tone="white" | tone="sidebar" */
  white?: boolean;
}

/**
 * Product mark (public/logo.png). Colored via CSS mask + background
 * so each theme can hit an exact hex (e.g. Magnus #47ffff).
 */
export function MagnusLogo({
  className,
  size = 32,
  tone,
  white,
}: MagnusLogoProps) {
  const resolved: LogoTone =
    tone ?? (white === false ? "navy" : white === true ? "white" : "white");

  return (
    <span
      role="img"
      aria-label="Magnus"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        "logo-mark",
        resolved === "white" && "logo-mark-white",
        resolved === "navy" && "logo-mark-navy",
        resolved === "sidebar" && "logo-mark-sidebar",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}

export const MagnusLogoImage = MagnusLogo;
