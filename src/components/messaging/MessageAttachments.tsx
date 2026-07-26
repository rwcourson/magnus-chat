"use client";

import { useRef } from "react";
import {
  FileText,
  FileImage,
  File,
  Paperclip,
  X,
} from "lucide-react";
import type { MessageAttachment } from "@/types/messaging";
import { isImageMime } from "@/lib/messaging";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";

function FileKindIcon({ mime, className }: { mime: string; className?: string }) {
  if (isImageMime(mime)) {
    return <FileImage className={className} strokeWidth={ICON_STROKE} />;
  }
  if (
    mime.includes("pdf") ||
    mime.includes("document") ||
    mime.includes("text")
  ) {
    return <FileText className={className} strokeWidth={ICON_STROKE} />;
  }
  return <File className={className} strokeWidth={ICON_STROKE} />;
}

/**
 * Clean attachment chips for composer + message body.
 */
export function AttachmentChips({
  items,
  onRemove,
  compact,
}: {
  items: MessageAttachment[];
  onRemove?: (id: string) => void;
  compact?: boolean;
}) {
  if (!items.length) return null;
  return (
    <div
      className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}
      data-attachment-chips
    >
      {items.map((a) => {
        const showPreview = Boolean(a.previewUrl && isImageMime(a.mime));
        return (
          <div
            key={a.id}
            className={cn(
              "group/att relative flex max-w-full items-center gap-2.5 overflow-hidden",
              "rounded-xl border border-[var(--glass-border-soft)]",
              "bg-[var(--glass-strong-solid)]",
              "shadow-[var(--shadow-xs)]",
              compact ? "pr-2" : "pr-2.5",
              showPreview ? "pl-1 py-1" : compact ? "px-2.5 py-1.5" : "px-3 py-2"
            )}
            data-attachment={a.id}
          >
            {showPreview ? (
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[var(--hover-fill)] ring-1 ring-[var(--glass-border-soft)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
            ) : (
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-lg",
                  "bg-[var(--hover-fill)] text-[var(--text-secondary)]",
                  compact ? "h-8 w-8" : "h-9 w-9"
                )}
              >
                <FileKindIcon
                  mime={a.mime}
                  className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
                />
              </span>
            )}
            <span className="min-w-0 flex-1 py-0.5">
              <span className="block max-w-[11rem] truncate text-[12.5px] font-medium leading-snug text-[var(--text-primary)] sm:max-w-[14rem]">
                {a.name}
              </span>
              <span className="mt-0.5 block text-[11px] tabular-nums text-[var(--text-muted)]">
                {a.sizeLabel}
              </span>
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  "text-[var(--text-muted)] transition-colors",
                  "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                )}
                aria-label={`Remove ${a.name}`}
              >
                <X className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Hidden file input + trigger. Opens the system file picker.
 */
export function FileAttachButton({
  onFiles,
  disabled,
  className,
  label = "Attach",
  multiple = true,
}: {
  onFiles: (files: FileList | File[]) => void;
  disabled?: boolean;
  className?: string;
  /** Empty string = icon-only (composer-style) */
  label?: string;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const iconOnly = label === "";

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-file-input
        onChange={(e) => {
          const list = e.target.files;
          if (list && list.length > 0) onFiles(list);
          // Allow re-selecting the same file
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-label={iconOnly ? "Attach files" : undefined}
        className={cn(
          iconOnly
            ? "inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
            : "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
          "transition-colors disabled:pointer-events-none disabled:opacity-40",
          className
        )}
        data-attach-file
      >
        <Paperclip
          className={iconOnly ? "h-4 w-4" : "h-3.5 w-3.5"}
          strokeWidth={ICON_STROKE}
        />
        {!iconOnly && label}
      </button>
    </>
  );
}
