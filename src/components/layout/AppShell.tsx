"use client";

import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { IconButton } from "@/components/ui/IconButton";
import { useChat } from "@/context/ChatContext";
import { MagnusLogo } from "@/components/brand/MagnusLogo";
import { BgSymbolWatermark } from "@/components/brand/BgSymbolWatermark";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { setSidebarOpen } = useChat();

  return (
    <div className="app-canvas relative flex h-dvh w-full max-w-[100vw] overflow-hidden">
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[300] focus:rounded-xl focus:bg-[var(--glass-strong-solid)] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--text-primary)] focus:shadow-[var(--shadow-menu)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
      >
        Skip to main content
      </a>
      <div className="relative z-10 flex h-full w-full min-w-0 max-w-full">
        <Sidebar />

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* B&G monogram — large thin outline, bottom-right of main stage */}
          <BgSymbolWatermark />

          {/* Mobile-only chrome — ≥md keeps desktop sidebar, no this header */}
          <header
            className={cn(
              "relative z-[1] flex shrink-0 items-center gap-2.5 border-b border-[var(--header-border)]",
              "bg-[var(--header-bg)] px-3 backdrop-blur-xl md:hidden",
              "pt-[max(0.5rem,env(safe-area-inset-top))] pb-2"
            )}
          >
            <IconButton
              label="Open menu"
              size="md"
              className="h-11 w-11 shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </IconButton>
            <MagnusLogo size={28} tone="sidebar" />
            <span className="min-w-0 truncate text-sm font-medium text-[var(--text-primary)]">
              Magnus
            </span>
          </header>

          <main
            id="main-content"
            className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
