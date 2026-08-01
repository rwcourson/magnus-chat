"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/context/ChatContext";

/** Insights surface removed — send people home. */
export default function InsightsPage() {
  const router = useRouter();
  const { goHome } = useChat();

  useEffect(() => {
    goHome();
    router.replace("/");
  }, [goHome, router]);

  return (
    <div className="flex h-full items-center justify-center text-[13px] text-[var(--text-muted)]">
      Redirecting…
    </div>
  );
}
