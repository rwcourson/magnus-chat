"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy Comms route → Insights */
export default function CommsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/insights");
  }, [router]);
  return null;
}
