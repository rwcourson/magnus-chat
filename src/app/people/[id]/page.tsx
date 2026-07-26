"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { peopleDirectory } from "@/lib/people-data";
import { PersonProfileView } from "@/components/social/PersonProfileView";

export default function PersonPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const person = peopleDirectory.find((p) => p.id === id);

  if (!person) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-[15px] font-medium text-[var(--text-primary)]">
          Person not found
        </p>
        <p className="max-w-sm text-[13px] text-[var(--text-muted)]">
          That profile isn’t in the directory for this demo.
        </p>
        <Link
          href="/people"
          className="text-[13px] font-medium text-[var(--text-secondary)] underline-offset-2 hover:underline"
        >
          Back to People
        </Link>
      </div>
    );
  }

  return <PersonProfileView person={person} />;
}
