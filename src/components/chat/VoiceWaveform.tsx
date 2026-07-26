"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { cn } from "@/lib/utils";

export type WavePhase = "live" | "settling" | "idle";

interface VoiceWaveformProps {
  /** live = animating, settling = quick stop, idle = flat */
  phase?: WavePhase;
  /** @deprecated use phase — true maps to live */
  active?: boolean;
  className?: string;
  bars?: number;
  levelsRef?: MutableRefObject<Float32Array | null>;
  /** Called once settle animation finishes */
  onSettled?: () => void;
}

/**
 * Minimal voice waveform.
 * live → restrained motion from mic / soft demo
 * settling → fast uniform collapse to baseline
 */
export function VoiceWaveform({
  phase,
  active,
  className,
  bars = 16,
  levelsRef,
  onSettled,
}: VoiceWaveformProps) {
  const resolved: WavePhase = phase ?? (active ? "live" : "idle");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const tRef = useRef(0);
  const smoothRef = useRef<Float32Array | null>(null);
  const phaseRef = useRef<WavePhase>(resolved);
  const settleTRef = useRef(0);
  const settledRef = useRef(false);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  phaseRef.current = resolved;

  useEffect(() => {
    if (resolved === "settling") {
      settleTRef.current = 0;
      settledRef.current = false;
    }
  }, [resolved]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
      2
    );

    if (!smoothRef.current || smoothRef.current.length !== bars) {
      smoothRef.current = new Float32Array(bars);
      for (let i = 0; i < bars; i++) smoothRef.current[i] = 0.14;
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let last = performance.now();
    let barRgb = "55, 65, 82";
    const syncBarColor = () => {
      const raw = getComputedStyle(canvas).getPropertyValue("--wave-bar").trim();
      if (raw) barRgb = raw;
    };
    syncBarColor();
    const themeObs = new MutationObserver(syncBarColor);
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    /** Soft, low-frequency demo motion — no bursts */
    const demoLevel = (i: number, t: number): number => {
      const u = i / Math.max(1, bars - 1);
      const envelope = 0.55 + 0.45 * Math.sin(Math.PI * u);
      const a =
        0.28 * Math.sin(t * 1.4 + u * 3.8) +
        0.14 * Math.sin(t * 2.2 - u * 5.5);
      return Math.max(0.1, Math.min(0.72, 0.2 + (0.22 + a) * envelope));
    };

    const draw = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      const p = phaseRef.current;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w < 1 || h < 1) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      if (p === "live") {
        tRef.current += dt * 0.95;
      } else if (p === "settling") {
        settleTRef.current += dt;
      } else {
        tRef.current += dt * 0.12;
      }

      const t = tRef.current;
      const settleT = settleTRef.current;

      ctx.clearRect(0, 0, w, h);

      const gap = 2.5;
      const barW = Math.max(1.5, (w - gap * (bars - 1)) / bars);
      const mid = h / 2;
      const maxH = h * 0.88;
      const smooth = smoothRef.current!;
      const live = levelsRef?.current;
      const hasLive =
        !!live && live.length > 0 && live.some((v) => v > 0.02);

      // Fast, uniform settle — no cascade
      const SETTLE_MS = 0.12;
      let allSettled = p === "settling";

      for (let i = 0; i < bars; i++) {
        let target: number;
        let k: number;

        if (p === "live") {
          if (hasLive) {
            const li = Math.min(
              live!.length - 1,
              Math.floor((i / bars) * live!.length)
            );
            const mic = live![li] ?? 0;
            const demo = demoLevel(i, t);
            target = Math.max(0.1, Math.min(1, mic * 0.9 + demo * 0.18));
          } else {
            target = demoLevel(i, t);
          }
          k = 0.28;
        } else if (p === "settling") {
          const rest = 0.08;
          const progress = Math.min(1, settleT / SETTLE_MS);
          target = rest;
          // Snappy pull-down
          k = 0.55 + progress * 0.45;
          if (progress < 1 || smooth[i]! > rest + 0.015) allSettled = false;
        } else {
          target = 0.1;
          k = 0.18;
        }

        const alphaK = 1 - Math.exp(-k * dt * 58);
        smooth[i] += (target - smooth[i]!) * Math.min(1, alphaK);

        const amp = smooth[i]!;
        const barH = Math.max(2, amp * maxH);
        const x = i * (barW + gap);
        const y = mid - barH / 2;
        const radius = Math.min(barW / 2, 1.25);

        // Theme-aware alpha (dark = light bars; light = slate bars)
        const alpha =
          p === "live"
            ? 0.38 + amp * 0.5
            : p === "settling"
              ? 0.28 + amp * 0.3
              : 0.18 + amp * 0.12;

        ctx.beginPath();
        roundRect(ctx, x, y, barW, barH, radius);
        ctx.fillStyle = `rgba(${barRgb},${alpha})`;
        ctx.fill();
      }

      if (
        p === "settling" &&
        allSettled &&
        settleT > 0.06 &&
        !settledRef.current
      ) {
        settledRef.current = true;
        onSettledRef.current?.();
      }
      // Failsafe ~160ms
      if (p === "settling" && settleT > 0.16 && !settledRef.current) {
        settledRef.current = true;
        onSettledRef.current?.();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      themeObs.disconnect();
    };
  }, [bars, levelsRef]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("block h-full w-full", className)}
      aria-hidden
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function formatRecordTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
