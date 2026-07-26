"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HelpCircle, Keyboard, ListChecks, Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import { ScrollFade } from "@/components/ui/ScrollFade";

const FAQ = [
  {
    q: "What is Magnus?",
    a: "Magnus is Brasfield & Gorrie’s AI assistant and intranet hub — ask about projects, draft toolbox talks, catch up on the week, and browse company news.",
  },
  {
    q: "Home vs Chat?",
    a: "Home is intranet-first: news, actions, and a light Ask Magnus bar. Chat is the full assistant with history, skills, and routines.",
  },
  {
    q: "How do I search everything?",
    a: "Press ⌘K (Ctrl+K on Windows) to open the command palette — jump to pages, start a new chat, or open recent threads.",
  },
  {
    q: "Can Magnus make mistakes?",
    a: "Yes. Always verify safety-critical, contractual, or financial details against official project documents and systems of record.",
  },
];

const SHORTCUTS = [
  { keys: "⌘K", label: "Command palette" },
  { keys: "⌘N", label: "New chat" },
  { keys: "⌘B", label: "Toggle sidebar" },
  { keys: "⌘.", label: "Light / dark" },
  { keys: "⌘/", label: "Shortcut list" },
  { keys: "/", label: "Composer slash commands" },
];

export function HelpView() {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[680px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <PageHeader
            eyebrow="Support"
            icon={HelpCircle}
            title="Help center"
            description="Shortcuts, FAQ, and how to get more help with Magnus."
          />

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: easeSpring }}
            className="mt-8"
          >
            <div className="mb-3 flex items-center gap-2 px-0.5">
              <Keyboard
                className="h-3.5 w-3.5 text-[var(--text-muted)]"
                strokeWidth={ICON_STROKE}
              />
              <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                Keyboard
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SHORTCUTS.map((s) => (
                <div
                  key={s.keys}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border border-[var(--glass-border-soft)]",
                    "bg-[var(--glass-strong-solid)] px-3.5 py-2.5"
                  )}
                >
                  <span className="text-[13px] text-[var(--text-secondary)]">
                    {s.label}
                  </span>
                  <kbd className="rounded-md border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] px-2 py-1 text-[11px] font-medium tabular-nums text-[var(--text-primary)]">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.32, ease: easeSpring }}
            className="mt-8"
          >
            <p className="mb-3 px-0.5 text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
              FAQ
            </p>
            <div className="space-y-2">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className={cn(
                    "group rounded-2xl border border-[var(--glass-border-soft)]",
                    "bg-[var(--glass-strong-solid)] px-4 py-3 open:border-[var(--glass-border)]"
                  )}
                >
                  <summary className="cursor-pointer list-none text-[14px] font-semibold text-[var(--text-primary)] marker:content-none">
                    <span className="flex items-center justify-between gap-2">
                      {item.q}
                      <span className="text-[var(--text-muted)] transition-transform group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </motion.section>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.32, ease: easeSpring }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/"
              className={cn(
                "btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3",
                "text-[13px] font-semibold"
              )}
            >
              <ListChecks className="h-4 w-4" strokeWidth={ICON_STROKE} />
              Try Catch me up
            </Link>
            <a
              href="mailto:it@brasfieldgorrie.com?subject=Magnus%20help"
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--glass-border)]",
                "bg-[var(--hover-fill)] px-4 py-3 text-[13px] font-semibold text-[var(--text-primary)]",
                "hover:bg-[var(--hover-fill-strong)]"
              )}
            >
              <Mail className="h-4 w-4" strokeWidth={ICON_STROKE} />
              Contact IT
            </a>
          </motion.div>
        </div>
      </ScrollFade>
    </div>
  );
}
