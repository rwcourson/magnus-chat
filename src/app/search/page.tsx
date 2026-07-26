"use client";

import { Suspense } from "react";
import { SearchResultsView } from "@/components/search/SearchResultsView";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-[13px] text-[var(--text-muted)]">
          Loading search…
        </div>
      }
    >
      <SearchResultsView />
    </Suspense>
  );
}
