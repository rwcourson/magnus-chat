"use client";

import { Suspense } from "react";
import { ApprovalsView } from "@/components/approvals/ApprovalsView";

export default function ApprovalsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-[13px] text-[var(--text-muted)]">
          Loading approvals…
        </div>
      }
    >
      <ApprovalsView />
    </Suspense>
  );
}
