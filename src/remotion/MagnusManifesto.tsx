import {loadFont} from "@remotion/fonts";
import {Audio} from "@remotion/media";
import type {ReactNode} from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const FONT = "Magnus Inter Manifesto";
void Promise.all(
  ["400", "500", "600", "700"].map((weight) =>
    loadFont({
      family: FONT,
      url: staticFile("remotion/fonts/Inter-Variable-Latin.woff2"),
      format: "woff2",
      weight,
      display: "block",
    })
  )
);

const C = {
  void: "#0a0f19",
  deep: "#101726",
  canvas: "#161e2e",
  elevated: "#1e283c",
  panel: "#222c42",
  primary: "#f4f6fa",
  secondary: "#c4cbd8",
  muted: "#9aa3b5",
  accent: "#4a5f88",
  bright: "#7f96c2",
  flare: "#d7e1f3",
  line: "rgba(196,203,216,0.17)",
  faint: "rgba(196,203,216,0.075)",
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const ease = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

const fade = (frame: number, duration: number) =>
  interpolate(
    frame,
    [0, 7, duration - 8, duration],
    [0, 1, 1, 0],
    clamp
  );

const entrance = (frame: number, fps: number, delay = 0, duration = 24) =>
  spring({
    frame: frame - delay,
    fps,
    durationInFrames: duration,
    config: {damping: 24, stiffness: 170, mass: 0.9},
  });

const seeded = (index: number, salt = 0) => {
  const value = Math.sin(index * 91.713 + salt * 47.11) * 43758.5453;
  return value - Math.floor(value);
};

const Logo = ({size}: {size: number}) => (
  <Img
    src={staticFile("logo.png")}
    style={{
      width: size,
      height: size,
      objectFit: "contain",
      filter: "brightness(0) invert(1)",
    }}
  />
);

const Scene = ({
  duration,
  children,
}: {
  duration: number;
  children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: fade(frame, duration), overflow: "hidden"}}>
      {children}
    </AbsoluteFill>
  );
};

const CinematicBackdrop = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [-240, 260], clamp);
  const breathe = 0.75 + Math.sin(frame / 42) * 0.15;
  const stars = Array.from({length: 72}, (_, index) => ({
    x: seeded(index, 1) * 1920,
    y: seeded(index, 2) * 1080,
    size: 1 + seeded(index, 3) * 2.4,
    speed: 0.2 + seeded(index, 4) * 0.75,
  }));

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 52% 44%, ${C.elevated} 0%, ${C.canvas} 38%, ${C.deep} 70%, ${C.void} 100%)`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 1220,
          height: 1220,
          left: 200 + drift,
          top: -580,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(127,150,194,0.18) 0%, rgba(74,95,136,0.055) 44%, transparent 70%)",
          opacity: breathe,
        }}
      />
      {stars.map((star, index) => {
        const x = (star.x + frame * star.speed) % 2040 - 60;
        const twinkle =
          0.25 +
          0.55 *
            (0.5 +
              0.5 *
                Math.sin(frame * (0.025 + seeded(index, 8) * 0.035) + index));
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: "50%",
              background: C.flare,
              opacity: twinkle,
            }}
          />
        );
      })}
      <Img
        src={staticFile("bg-symbol-outline.svg")}
        style={{
          position: "absolute",
          width: 1180,
          height: 1180,
          right: -440,
          bottom: -500,
          opacity: 0.035,
          filter: "brightness(0) invert(1)",
          transform: `rotate(${interpolate(frame, [0, 720], [-3, 5])}deg)`,
        }}
      />
      <svg
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        style={{position: "absolute", inset: 0, opacity: 0.24}}
      >
        <defs>
          <linearGradient id="horizon" x1="0" x2="1">
            <stop offset="0" stopColor={C.bright} stopOpacity="0" />
            <stop offset="0.5" stopColor={C.bright} stopOpacity="0.6" />
            <stop offset="1" stopColor={C.bright} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M 0 ${780 + Math.sin(frame / 55) * 18} Q 960 ${
            650 + Math.sin(frame / 70) * 28
          } 1920 ${785 + Math.cos(frame / 60) * 15}`}
          fill="none"
          stroke="url(#horizon)"
          strokeWidth="1"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 38,
          border: `1px solid ${C.faint}`,
          borderRadius: 34,
        }}
      />
    </AbsoluteFill>
  );
};

const PortalTransitions = () => {
  const frame = useCurrentFrame();
  const hits = [105, 225, 360, 495, 615];
  return (
    <>
      {hits.map((hit) => {
        const local = frame - hit;
        if (local < -9 || local > 14) {
          return null;
        }
        const ring = interpolate(local, [-9, 11], [0, 1], clamp);
        const flash = interpolate(
          local,
          [-8, -1, 4, 14],
          [0, 0.42, 0.18, 0],
          clamp
        );
        const line = interpolate(local, [-8, 13], [-300, 2220], clamp);
        return (
          <div key={hit}>
            <div
              style={{
                position: "absolute",
                left: 960,
                top: 540,
                width: 2200 * ring,
                height: 2200 * ring,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                border: `${Math.max(2, 46 * (1 - ring))}px solid ${C.bright}`,
                opacity: 0.8 * (1 - ring),
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: C.bright,
                opacity: flash,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: line,
                top: -140,
                width: 7,
                height: 1400,
                background: C.flare,
                opacity: interpolate(
                  local,
                  [-8, -2, 10, 13],
                  [0, 0.9, 0.7, 0],
                  clamp
                ),
                transform: "rotate(18deg)",
              }}
            />
          </div>
        );
      })}
    </>
  );
};

const FragmentStorm = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const headline = entrance(frame, fps, 8, 34);
  const labels = [
    "A DECISION",
    "A QUESTION",
    "A SIGNAL",
    "A DEADLINE",
    "A CONVERSATION",
    "A COMMITMENT",
    "A CHANGE",
    "AN IDEA",
  ];
  const fragments = Array.from({length: 32}, (_, index) => ({
    x: seeded(index, 10) * 1920,
    y: seeded(index, 11) * 1080,
    w: 30 + seeded(index, 12) * 170,
    rotation: -24 + seeded(index, 13) * 48,
    depth: 0.35 + seeded(index, 14) * 1.2,
  }));

  return (
    <Scene duration={105}>
      <AbsoluteFill style={{fontFamily: FONT}}>
        {fragments.map((fragment, index) => {
          const travel = frame * (1.5 + fragment.depth * 2.4);
          const x = ((fragment.x + travel) % 2240) - 160;
          const y = fragment.y + Math.sin(frame / 18 + index) * 22;
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: fragment.w,
                height: index % 3 === 0 ? 3 : 1,
                background: index % 5 === 0 ? C.bright : C.line,
                opacity: 0.2 + fragment.depth * 0.3,
                transform: `rotate(${fragment.rotation}deg)`,
              }}
            />
          );
        })}
        {labels.map((label, index) => {
          const angle = (index / labels.length) * Math.PI * 2;
          const radius = 410 + (index % 3) * 115 - frame * 1.25;
          const x = 960 + Math.cos(angle + frame / 230) * radius;
          const y = 535 + Math.sin(angle + frame / 230) * radius * 0.52;
          return (
            <div
              key={label}
              style={{
                position: "absolute",
                left: x,
                top: y,
                color: C.muted,
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "0.12em",
                opacity: interpolate(frame, [0, 16, 80, 103], [0, 0.75, 0.75, 0], clamp),
                transform: `translate(-50%, -50%) rotate(${index % 2 ? -6 : 5}deg)`,
              }}
            >
              {label}
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: 150,
            top: 290,
            color: C.primary,
            fontSize: 164,
            lineHeight: 0.88,
            fontWeight: 600,
            letterSpacing: "-0.07em",
            opacity: headline,
            transform: `translateY(${interpolate(headline, [0, 1], [80, 0])}px)`,
          }}
        >
          Your work
          <br />
          is alive.
        </div>
        <div
          style={{
            position: "absolute",
            left: 158,
            bottom: 148,
            color: C.secondary,
            fontSize: 28,
            fontWeight: 500,
            opacity: ease(frame, 34, 58),
          }}
        >
          Conversations. Decisions. Momentum.
        </div>
        <div
          style={{
            position: "absolute",
            right: 150,
            bottom: 148,
            color: C.muted,
            fontSize: 19,
            fontWeight: 600,
            letterSpacing: "0.12em",
            opacity: ease(frame, 50, 72),
          }}
        >
          ALL IN MOTION
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const SignalCore = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const core = entrance(frame, fps, 5, 34);
  const copy = entrance(frame, fps, 26, 30);
  const orbitLabels = [
    "PEOPLE",
    "PROJECTS",
    "DECISIONS",
    "KNOWLEDGE",
    "CONTEXT",
    "TIME",
  ];

  return (
    <Scene duration={120}>
      <AbsoluteFill style={{fontFamily: FONT}}>
        <div
          style={{
            position: "absolute",
            left: 640,
            top: 540,
            width: 740,
            height: 740,
            transform: `translate(-50%, -50%) scale(${interpolate(core, [0, 1], [0.35, 1])})`,
            opacity: core,
          }}
        >
          {[0, 1, 2, 3].map((ring) => (
            <div
              key={ring}
              style={{
                position: "absolute",
                inset: 55 + ring * 70,
                borderRadius: "50%",
                border: `1px solid ${
                  ring === 1 ? "rgba(127,150,194,0.42)" : C.line
                }`,
                transform: `rotate(${frame * (ring % 2 ? -0.16 : 0.11)}deg)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: 9 + ring * 2,
                  height: 9 + ring * 2,
                  borderRadius: "50%",
                  background: ring === 1 ? C.flare : C.bright,
                  left: "50%",
                  top: -5,
                  boxShadow: `0 0 ${18 + ring * 7}px rgba(127,150,194,0.7)`,
                }}
              />
            </div>
          ))}
          {orbitLabels.map((label, index) => {
            const angle = frame * 0.008 + (index / orbitLabels.length) * Math.PI * 2;
            const radius = 300 + (index % 2) * 32;
            return (
              <div
                key={label}
                style={{
                  position: "absolute",
                  left: 370 + Math.cos(angle) * radius,
                  top: 370 + Math.sin(angle) * radius,
                  transform: "translate(-50%, -50%)",
                  color: C.secondary,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  whiteSpace: "nowrap",
                  opacity: 0.75,
                }}
              >
                {label}
              </div>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 178,
              height: 178,
              transform: "translate(-50%, -50%)",
              borderRadius: 54,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: C.accent,
              boxShadow: "0 0 110px rgba(127,150,194,0.34)",
            }}
          >
            <Logo size={104} />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 1120,
            top: 332,
            width: 650,
            opacity: copy,
            transform: `translateX(${interpolate(copy, [0, 1], [90, 0])}px)`,
          }}
        >
          <div
            style={{
              color: C.bright,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.12em",
              marginBottom: 26,
            }}
          >
            MAGNUS FINDS THE SIGNAL
          </div>
          <div
            style={{
              color: C.primary,
              fontSize: 114,
              lineHeight: 0.93,
              fontWeight: 600,
              letterSpacing: "-0.065em",
            }}
          >
            Nothing
            <br />
            gets lost.
          </div>
          <div
            style={{
              width: 390,
              height: 1,
              background: C.line,
              marginTop: 46,
            }}
          />
          <div
            style={{
              color: C.secondary,
              fontSize: 25,
              lineHeight: 1.45,
              marginTop: 28,
              maxWidth: 510,
            }}
          >
            It brings the hidden shape of your work into focus.
          </div>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const ContextRibbons = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = entrance(frame, fps, 11, 32);
  const merge = ease(frame, 12, 78);
  const paths = Array.from({length: 9}, (_, index) => ({
    y: 180 + index * 88,
    wave: 40 + seeded(index, 30) * 120,
    offset: seeded(index, 31) * 120,
  }));

  return (
    <Scene duration={135}>
      <AbsoluteFill style={{fontFamily: FONT}}>
        <svg
          width="1920"
          height="1080"
          viewBox="0 0 1920 1080"
          style={{position: "absolute", inset: 0}}
        >
          <defs>
            <linearGradient id="ribbon" x1="0" x2="1">
              <stop offset="0" stopColor={C.accent} stopOpacity="0" />
              <stop offset="0.35" stopColor={C.bright} stopOpacity="0.82" />
              <stop offset="0.72" stopColor={C.flare} stopOpacity="0.9" />
              <stop offset="1" stopColor={C.bright} stopOpacity="0" />
            </linearGradient>
          </defs>
          {paths.map((path, index) => {
            const pulse = Math.sin(frame / 13 + index) * path.wave;
            const targetY = 550 + (index - 4) * (1 - merge) * 64;
            const d = `M -120 ${path.y + pulse * 0.24} C 360 ${
              path.y - path.wave
            }, 610 ${targetY + pulse}, 950 ${targetY} S 1420 ${
              540 + pulse * 0.18
            }, 2040 ${540 + (index - 4) * 8}`;
            return (
              <path
                key={index}
                d={d}
                fill="none"
                stroke="url(#ribbon)"
                strokeWidth={index === 4 ? 5 : 1.5}
                strokeDasharray={index === 4 ? undefined : "22 16"}
                strokeDashoffset={-frame * (2 + index * 0.18)}
                opacity={0.4 + index * 0.055}
              />
            );
          })}
          <circle
            cx="960"
            cy="550"
            r={70 + Math.sin(frame / 8) * 10}
            fill="none"
            stroke={C.flare}
            strokeWidth="2"
            opacity="0.7"
          />
          <circle
            cx="960"
            cy="550"
            r={128 + Math.sin(frame / 11) * 16}
            fill="none"
            stroke={C.bright}
            strokeWidth="1"
            opacity="0.24"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            left: 136,
            top: 110,
            color: C.primary,
            fontSize: 106,
            lineHeight: 0.94,
            fontWeight: 600,
            letterSpacing: "-0.06em",
            opacity: title,
            transform: `translateY(${interpolate(title, [0, 1], [54, 0])}px)`,
          }}
        >
          Activity becomes
          <br />
          <span style={{color: C.bright}}>understanding.</span>
        </div>
        <div
          style={{
            position: "absolute",
            right: 136,
            bottom: 120,
            color: C.secondary,
            fontSize: 24,
            maxWidth: 520,
            lineHeight: 1.45,
            textAlign: "right",
            opacity: ease(frame, 56, 88),
          }}
        >
          Every conversation gains context.
          <br />
          Every decision remembers why.
        </div>
        {["PEOPLE", "PROJECTS", "KNOWLEDGE"].map((label, index) => (
          <div
            key={label}
            style={{
              position: "absolute",
              left: 160 + index * 190,
              bottom: 118,
              color: C.muted,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.13em",
              opacity: ease(frame, 30 + index * 6, 54 + index * 6),
            }}
          >
            {label}
          </div>
        ))}
      </AbsoluteFill>
    </Scene>
  );
};

const MomentumTunnel = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = ["CLARITY", "BECOMES", "MOMENTUM"];
  const tunnel = Array.from({length: 26}, (_, index) => ({
    angle: (index / 26) * Math.PI * 2,
    length: 380 + seeded(index, 40) * 760,
    width: 1 + seeded(index, 41) * 4,
  }));

  return (
    <Scene duration={135}>
      <AbsoluteFill style={{fontFamily: FONT}}>
        <svg
          width="1920"
          height="1080"
          viewBox="0 0 1920 1080"
          style={{position: "absolute", inset: 0}}
        >
          <defs>
            <radialGradient id="coreGlow">
              <stop offset="0" stopColor={C.flare} stopOpacity="0.86" />
              <stop offset="0.25" stopColor={C.bright} stopOpacity="0.22" />
              <stop offset="1" stopColor={C.accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="1470" cy="540" r="420" fill="url(#coreGlow)" />
          {tunnel.map((ray, index) => {
            const phase = ((frame * (10 + seeded(index, 42) * 11) + index * 73) % 900) / 900;
            const inner = 45 + phase * 260;
            const outer = inner + ray.length * (0.3 + phase);
            const x1 = 1470 + Math.cos(ray.angle) * inner;
            const y1 = 540 + Math.sin(ray.angle) * inner * 0.72;
            const x2 = 1470 + Math.cos(ray.angle) * outer;
            const y2 = 540 + Math.sin(ray.angle) * outer * 0.72;
            return (
              <line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={index % 5 === 0 ? C.flare : C.bright}
                strokeWidth={ray.width}
                opacity={0.12 + phase * 0.55}
              />
            );
          })}
        </svg>
        <div
          style={{
            position: "absolute",
            left: 138,
            top: 244,
          }}
        >
          {words.map((word, index) => {
            const p = entrance(frame, fps, 8 + index * 12, 25);
            return (
              <div
                key={word}
                style={{
                  color: index === 2 ? C.flare : index === 1 ? C.bright : C.secondary,
                  fontSize: index === 2 ? 120 : 46,
                  lineHeight: index === 2 ? 1 : 1.35,
                  fontWeight: index === 2 ? 600 : 700,
                  letterSpacing: index === 2 ? "-0.06em" : "0.08em",
                  opacity: p,
                  transform: `translateX(${interpolate(p, [0, 1], [-90, 0])}px)`,
                }}
              >
                {word}
              </div>
            );
          })}
          <div
            style={{
              width: 520 * ease(frame, 58, 90),
              height: 2,
              background: C.bright,
              marginTop: 40,
              boxShadow: "0 0 24px rgba(127,150,194,0.55)",
            }}
          />
          <div
            style={{
              color: C.secondary,
              fontSize: 25,
              marginTop: 28,
              opacity: ease(frame, 66, 94),
            }}
          >
            Less searching. More forward.
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 204,
            top: 470,
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: `1px solid ${C.flare}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.primary,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.12em",
            transform: `scale(${0.9 + Math.sin(frame / 6) * 0.07})`,
            boxShadow: "0 0 90px rgba(127,150,194,0.28)",
          }}
        >
          FORWARD
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const OneCompany = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nodes = Array.from({length: 34}, (_, index) => {
    const angle = (index / 34) * Math.PI * 2 + seeded(index, 50) * 0.35;
    const radius = 130 + seeded(index, 51) * 390;
    return {
      x: 960 + Math.cos(angle) * radius,
      y: 530 + Math.sin(angle) * radius * 0.64,
      size: 4 + seeded(index, 52) * 9,
    };
  });
  const network = entrance(frame, fps, 4, 42);
  const title = entrance(frame, fps, 24, 34);

  return (
    <Scene duration={120}>
      <AbsoluteFill style={{fontFamily: FONT}}>
        <svg
          width="1920"
          height="1080"
          viewBox="0 0 1920 1080"
          style={{position: "absolute", inset: 0, opacity: network}}
        >
          {nodes.map((node, index) => {
            const target = nodes[(index * 7 + 5) % nodes.length];
            const x1 = 960 + (node.x - 960) * network;
            const y1 = 530 + (node.y - 530) * network;
            const x2 = 960 + (target.x - 960) * network;
            const y2 = 530 + (target.y - 530) * network;
            return (
              <line
                key={`line-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={index % 6 === 0 ? C.bright : C.line}
                strokeWidth={index % 6 === 0 ? 1.5 : 1}
                opacity={0.28 + seeded(index, 53) * 0.35}
              />
            );
          })}
          {nodes.map((node, index) => {
            const x = 960 + (node.x - 960) * network;
            const y = 530 + (node.y - 530) * network;
            const pulse = 0.75 + Math.sin(frame / 8 + index) * 0.25;
            return (
              <circle
                key={`node-${index}`}
                cx={x}
                cy={y}
                r={node.size * pulse}
                fill={index % 7 === 0 ? C.flare : C.bright}
                opacity={index % 7 === 0 ? 0.95 : 0.55}
              />
            );
          })}
          <circle
            cx="960"
            cy="530"
            r={92 + Math.sin(frame / 9) * 8}
            fill={C.accent}
            opacity="0.92"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 530,
            transform: "translate(-50%, -50%)",
            opacity: network,
          }}
        >
          <Logo size={110} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 112,
            textAlign: "center",
            color: C.primary,
            fontSize: 92,
            lineHeight: 0.98,
            fontWeight: 600,
            letterSpacing: "-0.06em",
            opacity: title,
            transform: `translateY(${interpolate(title, [0, 1], [38, 0])}px)`,
          }}
        >
          Your whole company.
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 98,
            textAlign: "center",
            color: C.flare,
            fontSize: 108,
            lineHeight: 1,
            fontWeight: 600,
            letterSpacing: "-0.065em",
            opacity: entrance(frame, fps, 49, 30),
          }}
        >
          Moving as one.
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const Finale = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = entrance(frame, fps, 6, 40);
  const line = ease(frame, 34, 70);
  const glow = interpolate(frame, [0, 70, 104], [0, 1, 0.78], clamp);

  return (
    <Scene duration={105}>
      <AbsoluteFill
        style={{
          fontFamily: FONT,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 900,
            height: 900,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(127,150,194,0.24), rgba(74,95,136,0.06) 42%, transparent 70%)",
            opacity: glow,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 42,
            opacity: reveal,
            transform: `scale(${interpolate(reveal, [0, 1], [0.72, 1])})`,
          }}
        >
          <div
            style={{
              width: 168,
              height: 168,
              borderRadius: 50,
              background: C.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 120px rgba(127,150,194,0.25)",
            }}
          >
            <Logo size={98} />
          </div>
          <div
            style={{
              color: C.primary,
              fontSize: 154,
              fontWeight: 600,
              letterSpacing: "-0.07em",
            }}
          >
            Magnus
          </div>
        </div>
        <div
          style={{
            width: 780 * line,
            height: 1,
            marginTop: 50,
            background: `linear-gradient(90deg, transparent, ${C.bright}, transparent)`,
            boxShadow: "0 0 24px rgba(127,150,194,0.45)",
          }}
        />
        <div
          style={{
            color: C.secondary,
            fontSize: 34,
            fontWeight: 500,
            marginTop: 34,
            opacity: ease(frame, 48, 76),
            letterSpacing: "-0.02em",
          }}
        >
          Unlock the work inside your work.
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 90,
            display: "flex",
            gap: 10,
            opacity: ease(frame, 68, 90),
          }}
        >
          {Array.from({length: 7}, (_, index) => (
            <div
              key={index}
              style={{
                width: index === 6 ? 96 : 18,
                height: 5,
                borderRadius: 8,
                background: index === 6 ? C.bright : C.line,
              }}
            />
          ))}
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

export const MagnusManifesto = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: C.void}}>
      <CinematicBackdrop />
      <Sequence from={0} durationInFrames={105} premountFor={fps}>
        <FragmentStorm />
      </Sequence>
      <Sequence from={105} durationInFrames={120} premountFor={fps}>
        <SignalCore />
      </Sequence>
      <Sequence from={225} durationInFrames={135} premountFor={fps}>
        <ContextRibbons />
      </Sequence>
      <Sequence from={360} durationInFrames={135} premountFor={fps}>
        <MomentumTunnel />
      </Sequence>
      <Sequence from={495} durationInFrames={120} premountFor={fps}>
        <OneCompany />
      </Sequence>
      <Sequence from={615} durationInFrames={105} premountFor={fps}>
        <Finale />
      </Sequence>
      <PortalTransitions />
      <Audio
        src={staticFile("remotion/audio/magnus-v3-cinematic.wav")}
        volume={(frame) =>
          interpolate(frame, [0, 14, 690, 720], [0, 0.86, 0.86, 0], clamp)
        }
      />
    </AbsoluteFill>
  );
};
