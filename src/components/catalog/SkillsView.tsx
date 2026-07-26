"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pin, Plus, Zap } from "lucide-react";
import type { SkillItem } from "@/types/catalog";
import { skills as defaultSkills } from "@/lib/catalog-data";
import {
  createSkillItem,
  prependCatalogItem,
} from "@/lib/catalog-create";
import { PageHeader } from "@/components/ui/PageHeader";
import { AvatarMark } from "@/components/ui/BrandMark";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import { ScrollFade } from "@/components/ui/ScrollFade";

export function SkillsView({ items = defaultSkills }: { items?: SkillItem[] }) {
  const { toast } = useToast();
  const [list, setList] = useState<SkillItem[]>(items);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Custom");

  const openCreate = () => {
    setCreating(true);
    setName("");
    setCategory("Custom");
  };

  const submitCreate = () => {
    const item = createSkillItem({ name, category });
    if (!item) {
      toast({ title: "Name is required", tone: "danger", duration: 2000 });
      return;
    }
    setList((prev) => prependCatalogItem(prev, item));
    setCreating(false);
    toast({
      title: "Skill created",
      description: `${item.name} · pinned for quick start`,
      tone: "success",
      duration: 2400,
    });
  };

  const togglePin = (id: string) => {
    setList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
    const skill = list.find((s) => s.id === id);
    if (skill) {
      toast({
        title: skill.pinned ? "Unpinned" : "Pinned",
        description: skill.name,
        duration: 1600,
      });
    }
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[920px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <PageHeader
            eyebrow="Agent Skills"
            icon={Zap}
            title="Specialized skills for the job"
            description="Equip Magnus with field, estimating, and PMO packs. Pin favorites for one-click starts."
            actions={
              <button
                type="button"
                onClick={openCreate}
                className="btn-solid inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold"
                data-create-skill
                aria-label="Create skill"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Create skill
              </button>
            }
          />

          <AnimatePresence>
            {creating && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: easeSpring }}
                className={cn(
                  "mb-5 rounded-[16px] border border-[var(--glass-border-soft)]",
                  "bg-[var(--glass-strong-solid)] p-4 shadow-[var(--shadow-sm)]"
                )}
                data-create-skill-form
              >
                <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                  Create skill
                </p>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Skill name"
                    className={cn(
                      "w-full rounded-xl border border-[var(--glass-border)] bg-[var(--hover-fill)]",
                      "px-3 py-2 text-[14px] text-[var(--text-primary)] outline-none",
                      "placeholder:text-[var(--text-muted)]",
                      "focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                    )}
                    aria-label="Skill name"
                    data-skill-name
                    autoFocus
                  />
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Category"
                    className={cn(
                      "w-full rounded-xl border border-[var(--glass-border)] bg-[var(--hover-fill)]",
                      "px-3 py-2 text-[14px] text-[var(--text-primary)] outline-none",
                      "placeholder:text-[var(--text-muted)]",
                      "focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                    )}
                    aria-label="Skill category"
                    data-skill-category
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={submitCreate}
                    className="btn-solid inline-flex h-9 items-center rounded-full px-3.5 text-[12.5px] font-semibold"
                    data-skill-save
                  >
                    Save skill
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="rounded-full px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-muted)] hover:bg-[var(--hover-fill)]"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {list.length === 0 ? (
            <div
              className="rounded-[20px] border border-dashed border-[var(--glass-border)] px-4 py-14 text-center"
              data-skills-empty
            >
              <p className="text-[13.5px] text-[var(--text-muted)]">
                No skills yet. Create one to equip Magnus for a specific job.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="btn-solid mt-4 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Create skill
              </button>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((skill, i) => (
                <motion.article
                  key={skill.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(i * 0.035, 0.28),
                    duration: 0.38,
                    ease: easeSpring,
                  }}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-[20px]",
                    "border border-[var(--glass-border-soft)] bg-[var(--glass-strong-solid)]",
                    "shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-200",
                    "hover:border-[var(--glass-border)] hover:shadow-[var(--shadow-md)]"
                  )}
                  data-skill-card
                  data-skill-id={skill.id}
                  data-image-url={skill.imageUrl}
                >
                  <div className="relative h-[132px] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={skill.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-[var(--glass-strong-solid)] via-transparent to-transparent"
                    />
                    {skill.pinned && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                        <Pin
                          className="h-3 w-3 text-white"
                          strokeWidth={ICON_STROKE}
                        />
                        Pinned
                      </span>
                    )}
                    <span className="absolute bottom-3 left-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium tracking-tight text-white/90 backdrop-blur-md">
                      {skill.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePin(skill.id)}
                      className={cn(
                        "absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full",
                        "bg-black/40 text-white backdrop-blur-md transition-colors",
                        "hover:bg-black/55",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                      )}
                      aria-label={
                        skill.pinned
                          ? `Unpin ${skill.name}`
                          : `Pin ${skill.name}`
                      }
                      data-skill-pin
                    >
                      <Pin
                        className={cn(
                          "h-3.5 w-3.5",
                          skill.pinned && "fill-white"
                        )}
                        strokeWidth={ICON_STROKE}
                      />
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-2">
                    <h2 className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
                      {skill.name}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--text-secondary)]">
                      {skill.description}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <AvatarMark
                          src={skill.author.avatarUrl}
                          initials={skill.author.initials}
                          size={28}
                        />
                        <span className="truncate text-[12px] text-[var(--text-muted)]">
                          {skill.author.name}
                        </span>
                      </div>
                      <span className="shrink-0 text-[11px] tabular-nums text-[var(--text-muted)]">
                        {skill.uses} uses
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </ScrollFade>
    </div>
  );
}
