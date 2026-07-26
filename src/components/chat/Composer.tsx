"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, X, Check, PhoneOff, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/chat/CommandPalette";
import { AttachMenu } from "@/components/chat/AttachMenu";
import {
  VoiceWaveform,
  formatRecordTime,
  type WavePhase,
} from "@/components/chat/VoiceWaveform";
import {
  ModelSelector,
  type ModelId,
} from "@/components/chat/ModelSelector";
import {
  VoiceActionButton,
  type VoiceAction,
} from "@/components/chat/VoiceActionButton";
import {
  filterCommands,
  getSlashQuery,
  type SlashCommand,
} from "@/lib/commands";
import { easeSpring, pressPrimary, springSnappy } from "@/lib/motion";

interface ComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  compact?: boolean;
  /** Show stop control while a reply is generating */
  isGenerating?: boolean;
  onStop?: () => void;
}

/** Fast, damped morph — snappy, no bounce */
const morph = springSnappy;
const press = springSnappy;

/** Minimal enter/exit for compose ↔ session */
const clusterIn = { opacity: 0, scale: 0.97 };
const clusterShow = { opacity: 1, scale: 1 };
const clusterOut = {
  opacity: 0,
  scale: 0.98,
  transition: { duration: 0.1, ease: [0.22, 1, 0.36, 1] as const },
};

type SessionMode = VoiceAction | null;

export function Composer({
  onSend,
  disabled,
  autoFocus,
  className,
  compact,
  isGenerating,
  onStop,
}: ComposerProps) {
  const [value, setValue] = useState("");
  const [modelId, setModelId] = useState<ModelId>("auto");
  const [modelOpen, setModelOpen] = useState(false);
  const [cmdIndex, setCmdIndex] = useState(0);
  /** null = compose; dictation | voice = active session */
  const [session, setSession] = useState<SessionMode>(null);
  const [wavePhase, setWavePhase] = useState<WavePhase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const pendingActionRef = useRef<"cancel" | "send" | null>(null);
  const settleLockRef = useRef(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const levelsRafRef = useRef(0);
  const micLevelsRef = useRef<Float32Array | null>(null);
  const elapsedRef = useRef(0);
  const sessionRef = useRef<SessionMode>(null);
  sessionRef.current = session;

  const active = session !== null;

  useEffect(() => {
    if (autoFocus && !active) taRef.current?.focus();
  }, [autoFocus, active]);

  const resize = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const slashToken = getSlashQuery(value);
  const commands = useMemo(
    () => (slashToken !== null ? filterCommands(slashToken) : []),
    [slashToken]
  );
  const showCommands = !active && slashToken !== null && commands.length > 0;

  useEffect(() => {
    setCmdIndex(0);
  }, [slashToken]);

  const teardownMic = useCallback(() => {
    if (levelsRafRef.current) cancelAnimationFrame(levelsRafRef.current);
    levelsRafRef.current = 0;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    micLevelsRef.current = null;
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finishExit = useCallback(
    (action: "cancel" | "send") => {
      const mode = sessionRef.current;
      const secs = Math.max(1, Math.round(elapsedRef.current));
      stopTimer();
      teardownMic();
      setSession(null);
      setWavePhase("idle");
      setElapsed(0);
      elapsedRef.current = 0;
      settleLockRef.current = false;
      pendingActionRef.current = null;

      if (action === "send" && mode) {
        if (mode === "dictation") {
          onSend(`Dictation (${formatRecordTime(secs)})`);
        } else {
          onSend(`Voice chat with Magnus (${formatRecordTime(secs)})`);
        }
      } else {
        requestAnimationFrame(() => taRef.current?.focus());
      }
    },
    [onSend, stopTimer, teardownMic]
  );

  const beginStop = useCallback(
    (action: "cancel" | "send") => {
      if (!session || settleLockRef.current) return;
      settleLockRef.current = true;
      pendingActionRef.current = action;
      elapsedRef.current = elapsed;
      stopTimer();
      // Dictation settles the waveform; voice ends immediately
      if (session === "dictation") {
        setWavePhase("settling");
      } else {
        finishExit(action);
      }
    },
    [session, elapsed, stopTimer, finishExit]
  );

  const onWaveSettled = useCallback(() => {
    const action = pendingActionRef.current ?? "cancel";
    finishExit(action);
  }, [finishExit]);

  const startMicAnalysis = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      if (ctx.state === "suspended") await ctx.resume();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const BAR_COUNT = 22;
      const levels = new Float32Array(BAR_COUNT);
      micLevelsRef.current = levels;

      const tick = () => {
        const a = analyserRef.current;
        if (!a) return;
        a.getByteFrequencyData(data);
        const usable = Math.floor(data.length * 0.55);
        const slice = Math.max(1, Math.floor(usable / BAR_COUNT));
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0;
          const start = i * slice;
          for (let j = 0; j < slice; j++) sum += data[start + j] ?? 0;
          const raw = sum / slice / 255;
          levels[i] = Math.min(1, Math.pow(raw, 0.72) * 1.35);
        }
        levelsRafRef.current = requestAnimationFrame(tick);
      };
      levelsRafRef.current = requestAnimationFrame(tick);
    } catch {
      micLevelsRef.current = null;
    }
  }, []);

  const startSession = useCallback(
    (mode: VoiceAction) => {
      if (disabled || session) return;
      setModelOpen(false);
      settleLockRef.current = false;
      pendingActionRef.current = null;
      setSession(mode);
      setWavePhase("live");
      setElapsed(0);
      elapsedRef.current = 0;
      startedAtRef.current = Date.now();
      stopTimer();
      timerRef.current = window.setInterval(() => {
        const e = (Date.now() - startedAtRef.current) / 1000;
        elapsedRef.current = e;
        setElapsed(e);
      }, 100);
      void startMicAnalysis();
    },
    [disabled, session, startMicAnalysis, stopTimer]
  );

  const cancelSession = useCallback(() => {
    beginStop("cancel");
  }, [beginStop]);

  const confirmSession = useCallback(() => {
    beginStop("send");
  }, [beginStop]);

  useEffect(
    () => () => {
      stopTimer();
      teardownMic();
    },
    [stopTimer, teardownMic]
  );

  useEffect(() => {
    if (!session || wavePhase !== "live") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelSession();
      if (e.key === "Enter" && session === "dictation") {
        e.preventDefault();
        confirmSession();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session, wavePhase, cancelSession, confirmSession]);

  const applyCommand = (cmd: SlashCommand) => {
    setValue(`${cmd.command} `);
    requestAnimationFrame(() => {
      taRef.current?.focus();
      resize();
    });
  };

  const isDictation = session === "dictation";
  const isVoice = session === "voice";
  const isLive = active && wavePhase === "live";
  const isSettling = isDictation && wavePhase === "settling";

  const submit = () => {
    if (!value.trim() || disabled || active) return;
    onSend(value);
    setValue("");
    requestAnimationFrame(() => {
      if (taRef.current) {
        taRef.current.style.height = "auto";
        taRef.current.focus();
      }
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (active) return;
    if (showCommands) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCmdIndex((i) => (i + 1) % commands.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCmdIndex((i) => (i - 1 + commands.length) % commands.length);
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault();
        applyCommand(commands[cmdIndex] ?? commands[0]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setValue("");
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  const placeholder = isDictation
    ? "Dictating…"
    : isVoice
      ? "Talking with Magnus…"
      : "What would you like to know?  Try /";

  return (
    <div
      ref={shellRef}
      className={cn("relative w-full min-w-0 max-w-full", className)}
      data-composer-shell
    >
      <CommandPalette
        open={showCommands}
        commands={commands}
        activeIndex={cmdIndex}
        onSelect={applyCommand}
        onHover={setCmdIndex}
        anchorRef={shellRef}
      />

      <div
        className={cn(
          "glass-composer relative min-w-0 overflow-visible",
          compact ? "rounded-[22px]" : "rounded-[26px]",
          "px-3 pt-3 pb-2 sm:px-3.5"
        )}
      >
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={placeholder}
          disabled={disabled || active}
          className={cn(
            "composer-input w-full min-w-0 resize-none bg-transparent",
            "text-[16px] leading-relaxed text-[var(--text-primary)] sm:text-[15px]",
            "placeholder:text-[var(--text-muted)]",
            "outline-none border-0 px-1.5 py-1 min-h-[28px]",
            "disabled:opacity-50",
            "transition-opacity duration-150 ease-out",
            active && "opacity-40"
          )}
        />

        <div className="mt-1.5 flex min-w-0 items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex shrink-0 items-center gap-1">
            <AttachMenu disabled={active} />
          </div>

          {/* Right cluster — shrinks on narrow screens so dictation never overflows */}
          <div className="relative flex h-9 min-h-9 min-w-0 max-w-full flex-1 items-center justify-end">
            <AnimatePresence mode="wait" initial={false}>
              {isDictation ? (
                <motion.div
                  key="dictation"
                  initial={clusterIn}
                  animate={{
                    ...clusterShow,
                    opacity: isSettling ? 0.85 : 1,
                  }}
                  exit={clusterOut}
                  transition={morph}
                  className={cn(
                    "flex h-9 w-full max-w-[268px] items-center gap-1.5 rounded-full pl-1 pr-1",
                    "bg-[var(--hover-fill)] border border-[var(--glass-border)]",
                    "shadow-[0_1px_0_0_var(--glass-specular-soft)_inset]"
                  )}
                >
                  <motion.button
                    type="button"
                    aria-label="Cancel dictation"
                    title="Cancel · Esc"
                    onClick={cancelSession}
                    disabled={isSettling}
                    whileHover={isSettling ? undefined : pressPrimary.hover}
                    whileTap={isSettling ? undefined : pressPrimary.tap}
                    transition={press}
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      "text-[var(--text-muted)] hover:bg-[var(--hover-fill-strong)] hover:text-[var(--text-primary)]",
                      "transition-colors duration-100",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
                      isSettling && "pointer-events-none opacity-40"
                    )}
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.4} />
                  </motion.button>

                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-150",
                      isLive ? "bg-red-500/85" : "bg-[var(--rec-idle)]"
                    )}
                  />
                  <span className="min-w-[2.25rem] shrink-0 tabular-nums text-[11px] font-medium tracking-wide text-[var(--text-secondary)]">
                    {formatRecordTime(elapsed)}
                  </span>

                  <div className="h-5 min-w-0 flex-1 px-0.5">
                    <VoiceWaveform
                      phase={wavePhase === "idle" ? "live" : wavePhase}
                      bars={16}
                      levelsRef={micLevelsRef}
                      onSettled={onWaveSettled}
                    />
                  </div>

                  <motion.button
                    type="button"
                    aria-label="Finish dictation"
                    title="Done · Enter"
                    onClick={confirmSession}
                    disabled={isSettling}
                    whileHover={isSettling ? undefined : pressPrimary.hover}
                    whileTap={isSettling ? undefined : pressPrimary.tap}
                    transition={press}
                    className={cn(
                      "btn-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      "transition-colors duration-100",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
                      isSettling && "pointer-events-none opacity-40"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={1.4} />
                  </motion.button>
                </motion.div>
              ) : isVoice ? (
                <motion.div
                  key="voice"
                  initial={clusterIn}
                  animate={clusterShow}
                  exit={clusterOut}
                  transition={morph}
                  className={cn(
                    "flex h-9 w-full max-w-[280px] items-center gap-2 rounded-full pl-1.5 pr-1",
                    "bg-[var(--hover-fill)] border border-[var(--glass-border)]",
                    "shadow-[0_1px_0_0_var(--glass-specular-soft)_inset]"
                  )}
                >
                  <motion.button
                    type="button"
                    aria-label="End voice chat"
                    title="End · Esc"
                    onClick={cancelSession}
                    whileHover={pressPrimary.hover}
                    whileTap={pressPrimary.tap}
                    transition={press}
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      "bg-red-500/15 text-red-400 hover:bg-red-500/25",
                      "transition-colors duration-100",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                    )}
                  >
                    <PhoneOff className="h-3.5 w-3.5" strokeWidth={1.4} />
                  </motion.button>

                  <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                    <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-[var(--hover-fill-strong)] text-[var(--text-primary)]">
                      <Mic className="h-3 w-3" strokeWidth={1.4} />
                    </span>
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium leading-none text-[var(--text-primary)]">
                      Voice chat
                    </p>
                    <p className="mt-0.5 truncate text-[10px] leading-none text-[var(--text-muted)]">
                      {formatRecordTime(elapsed)} · Magnus listening
                    </p>
                  </div>

                  <div className="h-5 w-14 shrink-0">
                    <VoiceWaveform
                      phase="live"
                      bars={10}
                      levelsRef={micLevelsRef}
                    />
                  </div>

                  <motion.button
                    type="button"
                    aria-label="End and send voice chat"
                    title="Done"
                    onClick={confirmSession}
                    whileHover={pressPrimary.hover}
                    whileTap={pressPrimary.tap}
                    transition={press}
                    className={cn(
                      "btn-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      "transition-colors duration-100",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={1.4} />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="compose"
                  initial={clusterIn}
                  animate={clusterShow}
                  exit={clusterOut}
                  transition={morph}
                  className="flex h-9 shrink-0 items-center gap-1"
                >
                  <ModelSelector
                    value={modelId}
                    open={modelOpen}
                    onOpenChange={setModelOpen}
                    onChange={setModelId}
                    disabled={disabled}
                  />

                  {isGenerating && onStop ? (
                    <motion.button
                      type="button"
                      aria-label="Stop generating"
                      title="Stop"
                      onClick={onStop}
                      whileHover={pressPrimary.hover}
                      whileTap={pressPrimary.tap}
                      transition={press}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full",
                        "border border-[var(--glass-border)] bg-[var(--hover-fill-strong)]",
                        "text-[var(--text-primary)]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                      )}
                    >
                      <Square className="h-3.5 w-3.5 fill-current" strokeWidth={1.4} />
                    </motion.button>
                  ) : canSend ? (
                    <motion.button
                      type="button"
                      aria-label="Send message"
                      disabled={disabled}
                      onClick={submit}
                      whileHover={disabled ? undefined : pressPrimary.hover}
                      whileTap={disabled ? undefined : pressPrimary.tap}
                      transition={press}
                      className={cn(
                        "btn-primary flex h-9 w-9 items-center justify-center rounded-full",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
                        "transition-colors duration-150",
                        disabled && "opacity-40 pointer-events-none"
                      )}
                    >
                      <motion.span
                        key="send"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.1, ease: easeSpring }}
                        className="flex"
                      >
                        <ArrowUp className="h-4 w-4" strokeWidth={1.4} />
                      </motion.span>
                    </motion.button>
                  ) : (
                    <VoiceActionButton
                      disabled={disabled}
                      onSelect={startSession}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
