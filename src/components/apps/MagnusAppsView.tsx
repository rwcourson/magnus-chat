"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { magnusAppsCatalog } from "@/lib/magnus-apps";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";

/**
 * Compact Magnus apps launcher — existing destinations only.
 */
export function MagnusAppsView() {
  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
      data-magnus-apps
    >
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[560px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <PageHeader
            eyebrow="Magnus"
            icon={LayoutGrid}
            title="Magnus apps"
            description="Chat tools and knowledge surfaces — not the company app store."
            className="mb-5"
          />
          <ul className="flex flex-col gap-1.5" data-magnus-apps-list>
            {magnusAppsCatalog.map((app) => (
              <li key={app.id}>
                <Link
                  href={app.href}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border border-[var(--glass-border-soft)]",
                    "bg-[var(--glass-strong-solid)] px-3.5 py-3 shadow-[var(--shadow-xs)]",
                    "transition-[border-color,background] duration-150",
                    "hover:border-[var(--glass-border)] hover:bg-[var(--hover-fill)]/40"
                  )}
                  data-magnus-app={app.id}
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--hover-fill)] text-[var(--text-muted)]">
                    <LayoutGrid
                      className="h-4 w-4"
                      strokeWidth={ICON_STROKE}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold tracking-tight text-[var(--text-primary)]">
                      {app.label}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--text-secondary)]">
                      {app.description}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-[12px] text-[var(--text-muted)]">
            External HR and benefits links live under{" "}
            <Link
              href="/resources"
              className="font-medium text-[var(--text-secondary)] underline-offset-2 hover:underline"
            >
              Employee resources
            </Link>
            .
          </p>
        </div>
      </ScrollFade>
    </div>
  );
}
