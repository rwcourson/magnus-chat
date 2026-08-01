"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/context/ChatContext";

/**
 * Legacy team Messages route — redirects into Magnus Chat.
 * Channels / DMs are not primary surfaces right now.
 */
export default function MessagesPage() {
  const router = useRouter();
  const { setAppMode, rememberLastChatPath } = useChat();

  useEffect(() => {
    rememberLastChatPath("/");
    setAppMode("chat");
    router.replace("/");
  }, [rememberLastChatPath, setAppMode, router]);

  return (
    <div className="flex h-full items-center justify-center text-[13px] text-[var(--text-muted)]">
      Opening Magnus chat…
    </div>
  );
}
