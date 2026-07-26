"use client";

import { Suspense } from "react";
import { NewsFeed } from "@/components/feed/NewsFeed";
import { MagnusChatPopup } from "@/components/chat/MagnusChatPopup";

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-[13px] text-[var(--text-muted)]">
          Loading feed…
        </div>
      }
    >
      <>
        <NewsFeed />
        <MagnusChatPopup />
      </>
    </Suspense>
  );
}
