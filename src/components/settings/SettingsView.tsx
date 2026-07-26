"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Moon,
  Sun,
  House,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTheme } from "@/context/ThemeContext";
import { useChat } from "@/context/ChatContext";
import { useToast } from "@/context/ToastContext";
import { useSidebarPrefs } from "@/context/SidebarPrefsContext";
import {
  isIntroEnabled,
  setIntroEnabled,
} from "@/lib/intro";
import { requestOnboardingTourReplay } from "@/lib/onboarding-tour";
import {
  CHAT_SIDEBAR_CATALOG,
  HOME_NAV_CATALOG,
  type ChatSidebarId,
  type HomeNavId,
} from "@/lib/sidebar-prefs";
import type { AppMode } from "@/types/home";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import { ScrollFade } from "@/components/ui/ScrollFade";

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const { appMode, setAppMode, sidebarCollapsed, setSidebarCollapsed } =
    useChat();
  const {
    prefs,
    setHomeVisible,
    setChatVisible,
    moveHome,
    moveChat,
    resetPrefs,
  } = useSidebarPrefs();
  const { toast } = useToast();
  const [notifyFeed, setNotifyFeed] = useState(true);
  const [notifyComms, setNotifyComms] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    setShowIntro(isIntroEnabled());
  }, []);

  const setDefaultMode = (mode: AppMode) => {
    setAppMode(mode);
    toast({
      title: mode === "home" ? "Default is Home" : "Default is Chat",
      description: "Applied for this session.",
      tone: "success",
    });
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[640px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <PageHeader
            eyebrow="Preferences"
            icon={Settings}
            title="Settings"
            description="Appearance, default mode, sidebar layout, and notifications."
          />

          <div className="mt-8 space-y-4">
            <Section title="Appearance">
              <div className="flex gap-2">
                {(
                  [
                    { id: "dark" as const, label: "Dark", icon: Moon },
                    { id: "light" as const, label: "Light", icon: Sun },
                  ] as const
                ).map((opt) => {
                  const active = theme === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTheme(opt.id);
                        toast({
                          title: `${opt.label} mode`,
                          tone: "success",
                          duration: 2000,
                        });
                      }}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[13px] font-medium",
                        "transition-colors",
                        active
                          ? "border-[var(--select-border)] bg-[var(--select-fill)] text-[var(--select-text)]"
                          : "border-[var(--glass-border-soft)] text-[var(--text-secondary)] hover:bg-[var(--hover-fill)]"
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={ICON_STROKE} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 border-t border-[var(--glass-border-soft)] pt-3">
                <ToggleRow
                  label="Startup animation"
                  description="Show the Magnus monogram when the app loads"
                  checked={showIntro}
                  onChange={(v) => {
                    setShowIntro(v);
                    setIntroEnabled(v);
                    toast({
                      title: v
                        ? "Startup animation on"
                        : "Startup animation off",
                      description: v
                        ? "Plays on each full page load."
                        : "Won’t show on refresh.",
                      tone: "success",
                      duration: 2200,
                    });
                  }}
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)]">
                      Show me around
                    </p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-muted)]">
                      Replay the first-run tour of Home, Catch me up, Messages,
                      and Feed
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Clears done flag, sets session force, fires start event
                      // (OnboardingTour navigates home and opens the tour)
                      requestOnboardingTourReplay();
                      toast({
                        title: "Tour starting",
                        description: "A short walkthrough of Magnus.",
                        tone: "success",
                        duration: 2200,
                      });
                    }}
                    className={cn(
                      "shrink-0 rounded-full border border-[var(--glass-border-soft)]",
                      "px-3 py-1.5 text-[12.5px] font-semibold text-[var(--text-secondary)]",
                      "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
                      "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                    )}
                    data-replay-onboarding-tour
                  >
                    Replay
                  </button>
                </div>
              </div>
            </Section>

            <Section title="Default mode">
              <p className="mb-3 text-[12.5px] leading-relaxed text-[var(--text-muted)]">
                Home is intranet-first. Chat is team messaging + Magnus AI.
              </p>
              <div className="flex gap-2">
                {(
                  [
                    { id: "home" as const, label: "Home", icon: House },
                    { id: "chat" as const, label: "Chat", icon: MessageCircle },
                  ] as const
                ).map((opt) => {
                  const active = appMode === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDefaultMode(opt.id)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[13px] font-medium",
                        "transition-colors",
                        active
                          ? "border-[var(--select-border)] bg-[var(--select-fill)] text-[var(--select-text)]"
                          : "border-[var(--glass-border-soft)] text-[var(--text-secondary)] hover:bg-[var(--hover-fill)]"
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={ICON_STROKE} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="Sidebar layout">
              <ToggleRow
                label="Collapsed rail"
                description="Icon-only sidebar on large screens"
                checked={sidebarCollapsed}
                onChange={setSidebarCollapsed}
              />
              <p className="mt-4 mb-2 text-[12.5px] leading-relaxed text-[var(--text-muted)]">
                Customize what appears in each mode. Changes save automatically.
              </p>

              <p className="mb-2 mt-4 text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                Home sidebar
              </p>
              <div className="space-y-1" data-settings-home-nav>
                {prefs.homeOrder
                  // Notifications live in the top header, not the sidebar list
                  .filter((id) => id !== "notifications")
                  .map((id, index, arr) => {
                  const meta = HOME_NAV_CATALOG.find((c) => c.id === id)!;
                  const locked = Boolean(meta.locked);
                  return (
                    <NavPrefRow
                      key={id}
                      label={meta.label}
                      description={meta.description}
                      checked={prefs.homeVisible[id]}
                      locked={locked}
                      canUp={index > 0}
                      canDown={index < arr.length - 1}
                      onToggle={(v) => {
                        setHomeVisible(id as HomeNavId, v);
                        toast({
                          title: v
                            ? `${meta.label} shown`
                            : `${meta.label} hidden`,
                          duration: 1600,
                        });
                      }}
                      onUp={() => moveHome(id as HomeNavId, -1)}
                      onDown={() => moveHome(id as HomeNavId, 1)}
                    />
                  );
                })}
              </div>

              <p className="mb-2 mt-5 text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                Chat sidebar
              </p>
              <div className="space-y-1" data-settings-chat-nav>
                {prefs.chatOrder.map((id, index) => {
                  const meta = CHAT_SIDEBAR_CATALOG.find((c) => c.id === id)!;
                  return (
                    <NavPrefRow
                      key={id}
                      label={meta.label}
                      description={meta.description}
                      checked={prefs.chatVisible[id]}
                      canUp={index > 0}
                      canDown={index < prefs.chatOrder.length - 1}
                      onToggle={(v) => {
                        setChatVisible(id as ChatSidebarId, v);
                        toast({
                          title: v
                            ? `${meta.label} shown`
                            : `${meta.label} hidden`,
                          duration: 1600,
                        });
                      }}
                      onUp={() => moveChat(id as ChatSidebarId, -1)}
                      onDown={() => moveChat(id as ChatSidebarId, 1)}
                    />
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  resetPrefs();
                  toast({
                    title: "Sidebar reset",
                    description: "Default layout restored.",
                    tone: "success",
                  });
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[12.5px] font-medium text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                data-reset-sidebar-prefs
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Reset sidebar defaults
              </button>
            </Section>

            <Section title="Notifications">
              <div className="space-y-1">
                <ToggleRow
                  label="Feed activity"
                  description="Replies, mentions, and reactions"
                  checked={notifyFeed}
                  onChange={(v) => {
                    setNotifyFeed(v);
                    toast({
                      title: v ? "Feed alerts on" : "Feed alerts off",
                      duration: 2000,
                    });
                  }}
                />
                <ToggleRow
                  label="Insights"
                  description="Story desk & leadership pulse"
                  checked={notifyComms}
                  onChange={(v) => {
                    setNotifyComms(v);
                    toast({
                      title: v ? "Insights alerts on" : "Insights alerts off",
                      duration: 2000,
                    });
                  }}
                />
              </div>
            </Section>
          </div>
        </div>
      </ScrollFade>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: easeSpring }}
      className={cn(
        "rounded-2xl border border-[var(--glass-border-soft)]",
        "bg-[var(--glass-strong-solid)] p-4 shadow-[var(--shadow-xs)]"
      )}
    >
      <h2 className="mb-3 text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-1 py-2">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-[var(--text-primary)]">
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
            {description}
          </p>
        )}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

function NavPrefRow({
  label,
  description,
  checked,
  locked,
  canUp,
  canDown,
  onToggle,
  onUp,
  onDown,
}: {
  label: string;
  description?: string;
  checked: boolean;
  locked?: boolean;
  canUp: boolean;
  canDown: boolean;
  onToggle: (v: boolean) => void;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl bg-[var(--hover-fill)]/40 px-2 py-2"
      data-nav-pref-row
    >
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          aria-label={`Move ${label} up`}
          disabled={!canUp}
          onClick={onUp}
          className="rounded-md p-0.5 text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)] disabled:opacity-30"
        >
          <ChevronUp className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
        </button>
        <button
          type="button"
          aria-label={`Move ${label} down`}
          disabled={!canDown}
          onClick={onDown}
          className="rounded-md p-0.5 text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)] disabled:opacity-30"
        >
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[var(--text-primary)]">
          {label}
          {locked && (
            <span className="ml-1.5 text-[10px] font-medium tracking-tight text-[var(--text-muted)]">
              required
            </span>
          )}
        </p>
        {description && (
          <p className="mt-0.5 text-[11.5px] text-[var(--text-muted)]">
            {description}
          </p>
        )}
      </div>
      <Switch
        checked={locked ? true : checked}
        onChange={onToggle}
        disabled={locked}
      />
    </div>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative h-7 w-11 shrink-0 rounded-full transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-[var(--btn-primary-bg)]" : "bg-[var(--hover-fill-strong)]"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked && "translate-x-4"
        )}
      />
    </button>
  );
}
