"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getWorkspaceById } from "@/lib/catalog-data";
import { WorkspaceDetailView } from "@/components/catalog/WorkspaceDetailView";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const workspace = id ? getWorkspaceById(id) : undefined;

  if (!workspace) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center"
        data-workspace-not-found
      >
        <p className="text-[15px] font-medium text-[var(--text-primary)]">
          Workspace not found
        </p>
        <p className="max-w-sm text-[13px] text-[var(--text-muted)]">
          That project isn’t in the demo catalog.
        </p>
        <Link
          href="/workspaces"
          className="text-[13px] font-medium text-[var(--text-secondary)] underline-offset-2 hover:underline"
        >
          Back to Workspaces
        </Link>
      </div>
    );
  }

  return <WorkspaceDetailView workspace={workspace} />;
}
