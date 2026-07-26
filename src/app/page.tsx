"use client";

import { Suspense } from "react";
import { ChatView } from "@/components/chat/ChatView";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-[13px] text-[var(--text-muted)]">
          Loading…
        </div>
      }
    >
      <ChatView />
    </Suspense>
  );
}
