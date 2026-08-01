"use client";

import Link from "next/link";
import { ExternalLink, LifeBuoy } from "lucide-react";
import { employeeResourcesCatalog } from "@/lib/magnus-apps";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";

/**
 * Employee resources — external-style links, separate from Magnus apps.
 */
export function EmployeeResourcesView() {
  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
      data-employee-resources
    >
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[560px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <PageHeader
            eyebrow="Intranet"
            icon={LifeBuoy}
            title="Employee resources"
            description="Benefits, HR, and other company links outside the Magnus product surface."
            className="mb-5"
          />
          <ul className="flex flex-col gap-1.5" data-resources-list>
            {employeeResourcesCatalog.map((res) => {
              const className = cn(
                "flex items-start gap-3 rounded-2xl border border-[var(--glass-border-soft)]",
                "bg-[var(--glass-strong-solid)] px-3.5 py-3 shadow-[var(--shadow-xs)]",
                "transition-[border-color,background] duration-150",
                "hover:border-[var(--glass-border)] hover:bg-[var(--hover-fill)]/40"
              );
              const body = (
                <>
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--hover-fill)] text-[var(--text-muted)]">
                    <LifeBuoy className="h-4 w-4" strokeWidth={ICON_STROKE} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[14px] font-semibold tracking-tight text-[var(--text-primary)]">
                      {res.label}
                      {res.external && (
                        <ExternalLink
                          className="h-3.5 w-3.5 text-[var(--text-muted)]"
                          strokeWidth={ICON_STROKE}
                          aria-hidden
                        />
                      )}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--text-secondary)]">
                      {res.description}
                    </p>
                  </div>
                </>
              );

              return (
                <li key={res.id}>
                  {res.external ? (
                    <a
                      href={res.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={className}
                      data-resource={res.id}
                    >
                      {body}
                    </a>
                  ) : (
                    <Link
                      href={res.href}
                      className={className}
                      data-resource={res.id}
                    >
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-5 text-center text-[12px] text-[var(--text-muted)]">
            Magnus product tools are under{" "}
            <Link
              href="/apps"
              className="font-medium text-[var(--text-secondary)] underline-offset-2 hover:underline"
            >
              Magnus apps
            </Link>
            .
          </p>
        </div>
      </ScrollFade>
    </div>
  );
}
