import {loadFont} from "@remotion/fonts";
import {Audio} from "@remotion/media";
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
import type {CSSProperties, ReactNode} from "react";

const FONT = "Magnus Inter";

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
  canvas: "#161e2e",
  deep: "#121826",
  elevated: "#1e283c",
  panel: "#222c42",
  primary: "#f4f6fa",
  secondary: "#c4cbd8",
  muted: "#9aa3b5",
  action: "#4a5f88",
  actionLight: "#7184ab",
  border: "rgba(255,255,255,0.12)",
  borderStrong: "rgba(255,255,255,0.18)",
  hairline: "rgba(255,255,255,0.075)",
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const fadeEnvelope = (frame: number, duration: number) =>
  interpolate(frame, [0, 18, duration - 22, duration], [0, 1, 1, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });

const rise = (frame: number, fps: number, delay = 0) =>
  spring({
    frame: frame - delay,
    fps,
    durationInFrames: Math.round(0.9 * fps),
    config: {damping: 200},
  });

const revealStyle = (
  frame: number,
  fps: number,
  delay = 0,
  distance = 26
): CSSProperties => {
  const p = rise(frame, fps, delay);
  return {
    opacity: p,
    transform: `translateY(${interpolate(p, [0, 1], [distance, 0])}px)`,
  };
};

const Scene = ({
  duration,
  children,
}: {
  duration: number;
  children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: fadeEnvelope(frame, duration)}}>
      {children}
    </AbsoluteFill>
  );
};

const MagnusLogo = ({
  size,
  opacity = 1,
}: {
  size: number;
  opacity?: number;
}) => (
  <Img
    src={staticFile("logo.png")}
    style={{
      width: size,
      height: size,
      objectFit: "contain",
      filter: "brightness(0) invert(1)",
      opacity,
    }}
  />
);

const BrandWatermark = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const drift = interpolate(frame, [0, 21 * fps], [0, -58], clamp);
  const breathe = 0.032 + Math.sin(frame / 74) * 0.008;
  return (
    <Img
      src={staticFile("bg-symbol-outline.svg")}
      style={{
        position: "absolute",
        width: 930,
        height: 930,
        right: -330,
        bottom: -350,
        objectFit: "contain",
        filter: "brightness(0) invert(1)",
        opacity: breathe,
        transform: `translateY(${drift}px)`,
      }}
    />
  );
};

const Atmosphere = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const x = interpolate(frame, [0, 21 * fps], [-80, 80], clamp);
  const y = Math.sin(frame / 96) * 22;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, ${C.elevated} 0%, ${C.canvas} 48%, ${C.deep} 100%)`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 1150,
          height: 720,
          left: 280,
          top: 80,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(130,160,210,0.085) 0%, rgba(80,110,170,0.028) 46%, transparent 72%)",
          transform: `translate(${x}px, ${y}px)`,
        }}
      />
      <BrandWatermark />
      <div
        style={{
          position: "absolute",
          inset: 44,
          border: `1px solid ${C.hairline}`,
          borderRadius: 32,
        }}
      />
    </AbsoluteFill>
  );
};

const Kicker = ({children}: {children: ReactNode}) => (
  <div
    style={{
      color: C.muted,
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

const IntroScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const logo = rise(frame, fps, 5);
  const line = interpolate(frame, [18, 65], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.exp),
  });

  return (
    <Scene duration={120}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: `translateY(${interpolate(logo, [0, 1], [28, 0])}px) scale(${interpolate(logo, [0, 1], [0.96, 1])})`,
            opacity: logo,
          }}
        >
          <MagnusLogo size={124} />
          <div style={{height: 46}} />
          <div style={revealStyle(frame, fps, 16, 18)}>
            <Kicker>Welcome to</Kicker>
          </div>
          <div
            style={{
              ...revealStyle(frame, fps, 23, 24),
              marginTop: 12,
              color: C.primary,
              fontSize: 112,
              fontWeight: 600,
              letterSpacing: "-0.045em",
            }}
          >
            Magnus
          </div>
          <div
            style={{
              marginTop: 34,
              width: 330 * line,
              height: 1,
              background: C.borderStrong,
            }}
          />
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const AskOrbit = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = interpolate(frame, [8, 80], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.exp),
  });
  const labels = [
    {text: "Projects", x: 1260, y: 280, delay: 11},
    {text: "People", x: 1500, y: 430, delay: 17},
    {text: "Schedules", x: 1300, y: 660, delay: 23},
    {text: "Knowledge", x: 1040, y: 790, delay: 29},
  ];

  return (
    <>
      {[250, 390, 545].map((diameter, index) => (
        <div
          key={diameter}
          style={{
            position: "absolute",
            left: 1278 - diameter / 2,
            top: 518 - diameter / 2,
            width: diameter,
            height: diameter,
            borderRadius: "50%",
            border: `1px solid rgba(255,255,255,${0.13 - index * 0.025})`,
            opacity: interpolate(progress, [index * 0.18, 1], [0, 1], clamp),
            transform: `scale(${interpolate(progress, [0, 1], [0.82, 1])})`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 1267,
          top: 507,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: C.actionLight,
          boxShadow: `0 0 0 12px rgba(113,132,171,0.1)`,
          opacity: progress,
        }}
      />
      {labels.map((label) => {
        const p = rise(frame, fps, label.delay);
        return (
          <div
            key={label.text}
            style={{
              position: "absolute",
              left: label.x,
              top: label.y,
              color: C.secondary,
              fontSize: 24,
              fontWeight: 500,
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [14, 0])}px)`,
            }}
          >
            {label.text}
          </div>
        );
      })}
    </>
  );
};

const AskScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Scene duration={130}>
      <AbsoluteFill style={{fontFamily: FONT}}>
        <div style={{position: "absolute", left: 168, top: 304}}>
          <div style={revealStyle(frame, fps, 4, 18)}>
            <Kicker>Start with a question</Kicker>
          </div>
          <div
            style={{
              ...revealStyle(frame, fps, 10, 32),
              color: C.primary,
              fontSize: 172,
              lineHeight: 0.95,
              fontWeight: 600,
              letterSpacing: "-0.065em",
              marginTop: 28,
            }}
          >
            Ask.
          </div>
          <div
            style={{
              ...revealStyle(frame, fps, 22, 18),
              color: C.secondary,
              fontSize: 32,
              lineHeight: 1.45,
              marginTop: 36,
              maxWidth: 580,
              letterSpacing: "-0.018em",
            }}
          >
            Projects, people, schedules, or company knowledge.
          </div>
        </div>
        <AskOrbit />
      </AbsoluteFill>
    </Scene>
  );
};

const sourceRows = [
  {label: "Company news", width: 270},
  {label: "Project updates", width: 360},
  {label: "People directory", width: 310},
  {label: "Messages", width: 230},
  {label: "Approvals", width: 200},
  {label: "Calendar", width: 250},
];

const FindScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gather = interpolate(frame, [6, 78], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <Scene duration={135}>
      <AbsoluteFill style={{fontFamily: FONT}}>
        <div style={{position: "absolute", left: 168, top: 250}}>
          <div style={revealStyle(frame, fps, 4)}>
            <Kicker>Across Magnus</Kicker>
          </div>
          <div
            style={{
              ...revealStyle(frame, fps, 10, 30),
              marginTop: 30,
              color: C.primary,
              fontSize: 118,
              lineHeight: 1.02,
              fontWeight: 600,
              letterSpacing: "-0.055em",
              maxWidth: 720,
            }}
          >
            Find what matters.
          </div>
          <div
            style={{
              ...revealStyle(frame, fps, 22),
              marginTop: 38,
              color: C.secondary,
              fontSize: 31,
              lineHeight: 1.45,
              letterSpacing: "-0.018em",
            }}
          >
            One clear answer from the work around you.
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 150,
            top: 205,
            width: 670,
            height: 650,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 505,
              top: 83,
              width: 1,
              height: 472 * gather,
              background: C.borderStrong,
            }}
          />
          {sourceRows.map((row, index) => {
            const y = 40 + index * 94;
            const startX = index % 2 === 0 ? 0 : 74;
            const local = interpolate(
              gather,
              [index * 0.06, 0.6 + index * 0.05],
              [0, 1],
              clamp
            );
            return (
              <div key={row.label}>
                <div
                  style={{
                    position: "absolute",
                    left: startX,
                    top: y,
                    width: row.width,
                    height: 56,
                    borderRadius: 28,
                    border: `1px solid ${C.border}`,
                    background: "rgba(34,44,66,0.68)",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 24,
                    color: C.secondary,
                    fontSize: 21,
                    fontWeight: 500,
                    opacity: local,
                    transform: `translateX(${interpolate(local, [0, 1], [-26, 0])}px)`,
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: startX + row.width,
                    top: y + 28,
                    width: Math.max(0, (505 - startX - row.width) * local),
                    height: 1,
                    background: C.border,
                  }}
                />
              </div>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: 494,
              top: 300,
              width: 23,
              height: 23,
              borderRadius: "50%",
              background: C.actionLight,
              opacity: gather,
            }}
          />
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const networkNodes = [
  {label: "News", x: 390, y: 250},
  {label: "Messages", x: 1450, y: 250},
  {label: "People", x: 260, y: 610},
  {label: "Calendar", x: 1540, y: 650},
  {label: "Approvals", x: 570, y: 845},
  {label: "Insights", x: 1310, y: 865},
];

const ConnectScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const draw = interpolate(frame, [5, 78], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <Scene duration={140}>
      <AbsoluteFill style={{fontFamily: FONT}}>
        <svg
          width="1920"
          height="1080"
          viewBox="0 0 1920 1080"
          style={{position: "absolute", inset: 0}}
        >
          {networkNodes.map((node, index) => {
            const local = interpolate(
              draw,
              [index * 0.055, 0.62 + index * 0.045],
              [0, 1],
              clamp
            );
            return (
              <line
                key={node.label}
                x1={960}
                y1={535}
                x2={960 + (node.x - 960) * local}
                y2={535 + (node.y - 535) * local}
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={2}
              />
            );
          })}
        </svg>
        {networkNodes.map((node, index) => {
          const p = rise(frame, fps, 10 + index * 4);
          return (
            <div
              key={node.label}
              style={{
                position: "absolute",
                left: node.x - 72,
                top: node.y - 28,
                width: 144,
                height: 56,
                borderRadius: 28,
                border: `1px solid ${C.border}`,
                background: "rgba(34,44,66,0.78)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.secondary,
                fontSize: 20,
                fontWeight: 500,
                opacity: p,
                transform: `scale(${interpolate(p, [0, 1], [0.92, 1])})`,
              }}
            >
              {node.label}
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 535,
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 28,
              background: C.action,
              border: `1px solid ${C.borderStrong}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: draw,
              transform: `scale(${interpolate(draw, [0, 1], [0.85, 1])})`,
            }}
          >
            <MagnusLogo size={52} />
          </div>
          <div
            style={{
              ...revealStyle(frame, fps, 24, 22),
              marginTop: 34,
              color: C.primary,
              fontSize: 74,
              fontWeight: 600,
              letterSpacing: "-0.045em",
              whiteSpace: "nowrap",
            }}
          >
            Bring work together.
          </div>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const verbs = ["Draft.", "Plan.", "Move."];

const ActionScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Scene duration={120}>
      <AbsoluteFill
        style={{
          fontFamily: FONT,
          padding: "174px 168px",
          justifyContent: "center",
        }}
      >
        <Kicker>From answers to action</Kicker>
        <div
          style={{
            display: "flex",
            gap: 48,
            alignItems: "baseline",
            marginTop: 36,
          }}
        >
          {verbs.map((verb, index) => {
            const p = rise(frame, fps, 8 + index * 10);
            return (
              <div
                key={verb}
                style={{
                  color: index === 2 ? C.primary : C.secondary,
                  fontSize: 128,
                  lineHeight: 1,
                  fontWeight: 600,
                  letterSpacing: "-0.06em",
                  opacity: p,
                  transform: `translateY(${interpolate(p, [0, 1], [34, 0])}px)`,
                }}
              >
                {verb}
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 70,
            display: "flex",
            alignItems: "center",
            gap: 18,
            color: C.secondary,
            fontSize: 30,
            letterSpacing: "-0.018em",
            ...revealStyle(frame, fps, 40),
          }}
        >
          <div
            style={{
              width: 92,
              height: 3,
              borderRadius: 2,
              background: C.actionLight,
            }}
          />
          Drafts, briefs, next steps, and routines.
        </div>
        <div
          style={{
            position: "absolute",
            right: 170,
            bottom: 150,
            display: "flex",
            gap: 12,
          }}
        >
          {[0, 1, 2, 3].map((index) => {
            const p = rise(frame, fps, 48 + index * 5);
            return (
              <div
                key={index}
                style={{
                  width: 74 + index * 20,
                  height: 12,
                  borderRadius: 6,
                  background: index === 3 ? C.actionLight : C.borderStrong,
                  opacity: p,
                  transform: `scaleX(${p})`,
                  transformOrigin: "left center",
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const EndScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = rise(frame, fps, 3);
  const line = interpolate(frame, [16, 54], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.exp),
  });

  return (
    <Scene duration={70}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 34,
            opacity: p,
            transform: `translateY(${interpolate(p, [0, 1], [22, 0])}px)`,
          }}
        >
          <MagnusLogo size={100} />
          <div
            style={{
              color: C.primary,
              fontSize: 104,
              fontWeight: 600,
              letterSpacing: "-0.05em",
            }}
          >
            Magnus
          </div>
        </div>
        <div
          style={{
            marginTop: 44,
            width: 440 * line,
            height: 1,
            background: C.borderStrong,
          }}
        />
        <div
          style={{
            ...revealStyle(frame, fps, 18, 16),
            marginTop: 36,
            color: C.secondary,
            fontSize: 29,
            letterSpacing: "-0.018em",
          }}
        >
          Knowledge, schedules, drafts — without leaving home.
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

export const WelcomeToMagnus = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: C.canvas}}>
      <Atmosphere />
      <Sequence from={0} durationInFrames={120} premountFor={fps}>
        <IntroScene />
      </Sequence>
      <Sequence from={100} durationInFrames={130} premountFor={fps}>
        <AskScene />
      </Sequence>
      <Sequence from={210} durationInFrames={135} premountFor={fps}>
        <FindScene />
      </Sequence>
      <Sequence from={325} durationInFrames={140} premountFor={fps}>
        <ConnectScene />
      </Sequence>
      <Sequence from={445} durationInFrames={120} premountFor={fps}>
        <ActionScene />
      </Sequence>
      <Sequence from={560} durationInFrames={70} premountFor={fps}>
        <EndScene />
      </Sequence>
      <Audio
        src={staticFile("remotion/audio/magnus-ambient.wav")}
        volume={(frame) =>
          interpolate(
            frame,
            [0, 1.2 * fps, 18.8 * fps, 21 * fps],
            [0, 0.78, 0.78, 0],
            clamp
          )
        }
      />
    </AbsoluteFill>
  );
};
