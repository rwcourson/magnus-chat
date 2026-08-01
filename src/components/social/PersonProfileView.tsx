"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  MapPin,
  MessageCircle,
  ListChecks,
} from "lucide-react";
import type { PersonProfile } from "@/lib/people-data";
import { feedPosts } from "@/lib/feed-data";
import { AvatarMark } from "@/components/ui/BrandMark";
import { PillAction } from "@/components/ui/PillAction";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { useChat } from "@/context/ChatContext";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

export function PersonProfileView({ person }: { person: PersonProfile }) {
  const router = useRouter();
  const { sendMessage, setAppMode, openPersonChat } = useChat();

  const posts = feedPosts.filter(
    (p) =>
      p.author.handle === person.handle || p.author.name === person.name
  );

  /** Primary Message — private chat thread, not a Magnus draft prompt. */
  const message = () => {
    const chatId = openPersonChat(person);
    router.push(`/?chat=${encodeURIComponent(chatId)}`);
  };

  const schedule = () => {
    setAppMode("chat");
    router.push("/");
    window.setTimeout(
      () =>
        sendMessage(
          `When is ${person.name} free this week? Suggest two meeting windows.`
        ),
      40
    );
  };

  const catchUp = () => {
    setAppMode("chat");
    router.push("/");
    window.setTimeout(
      () =>
        sendMessage(
          `Catch me up on work with ${person.name} — projects, recent posts, and anything I should know.`
        ),
      40
    );
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <Link
            href="/people"
            className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
            People
          </Link>

          <motion.header
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.32, ease: easeSpring }}
            className={cn(
              "rounded-[20px] border border-[var(--glass-border-soft)]",
              "bg-[var(--glass-strong-solid)] p-5 shadow-[var(--shadow-sm)] sm:p-6"
            )}
            data-person-profile={person.id}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <AvatarMark
                src={person.avatarUrl}
                initials={person.initials}
                size={72}
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-[1.55rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                  {person.name}
                </h1>
                <p className="mt-0.5 text-[14px] text-[var(--text-secondary)]">
                  @{person.handle}
                  {person.role ? ` · ${person.role}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[var(--text-muted)]">
                  {person.office && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                      {person.office}
                    </span>
                  )}
                  {person.division && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2
                        className="h-3.5 w-3.5"
                        strokeWidth={ICON_STROKE}
                      />
                      {person.division}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                  {person.bio}
                </p>

                {person.projects && person.projects.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {person.projects.map((p) => (
                      <Link
                        key={p}
                        href="/workspaces"
                        className="rounded-full border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-muted)] hover:border-[var(--glass-border)] hover:text-[var(--text-primary)]"
                      >
                        {p}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2" data-person-actions>
                  <span data-person-message>
                    <PillAction
                      icon={MessageCircle}
                      arrow={false}
                      onClick={message}
                    >
                      Message
                    </PillAction>
                  </span>
                  <PillAction
                    icon={CalendarDays}
                    arrow={false}
                    onClick={schedule}
                  >
                    When are they free?
                  </PillAction>
                  <button
                    type="button"
                    onClick={catchUp}
                    className={cn(
                      "btn-primary inline-flex h-8 items-center gap-1.5 rounded-full px-3",
                      "text-[12px] font-semibold",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                    )}
                  >
                    <ListChecks className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                    Catch me up
                  </button>
                </div>
              </div>
            </div>
          </motion.header>

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                In B&amp;G Live
              </h2>
              <PillAction href="/feed" size="sm">
                Open B&amp;G Live
              </PillAction>
            </div>

            {posts.length === 0 ? (
              <p className="rounded-[16px] border border-[var(--glass-border-soft)] bg-[var(--glass-strong-solid)] px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">
                No recent feed posts from {person.name.split(" ")[0]}.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {posts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(i * 0.04, 0.2),
                      duration: 0.3,
                      ease: easeSpring,
                    }}
                  >
                    <Link
                      href={`/feed?post=${post.id}`}
                      className={cn(
                        "block rounded-[16px] border border-[var(--glass-border-soft)]",
                        "bg-[var(--glass-strong-solid)] p-4 shadow-[var(--shadow-xs)]",
                        "transition-[border-color] hover:border-[var(--glass-border)]"
                      )}
                      data-person-post={post.id}
                    >
                      {post.headline && (
                        <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                          {post.headline}
                        </p>
                      )}
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                        {post.body}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </ScrollFade>
    </div>
  );
}
