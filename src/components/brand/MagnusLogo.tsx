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
   * - sidebar: white in dark theme, navy in light theme
   */
  tone?: LogoTone;
  /** @deprecated use tone="white" | tone="sidebar" */
  white?: boolean;
}

/**
 * Product mark (public/logo.png). Blue asset → monochrome via CSS filter.
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
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Magnus"
        width={size}
        height={size}
        className={cn(
          "relative z-10 object-contain select-none",
          resolved === "white" && "logo-mark-white",
          resolved === "navy" && "logo-mark-navy",
          resolved === "sidebar" && "logo-mark-sidebar"
        )}
        draggable={false}
      />
    </span>
  );
}

export const MagnusLogoImage = MagnusLogo;
