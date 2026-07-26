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
import type {ReactNode} from "react";

const FONT = "Magnus Inter V2";
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
  accent: "#4a5f88",
  accentBright: "#7184ab",
  border: "rgba(255,255,255,0.13)",
  hairline: "rgba(255,255,255,0.08)",
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const smooth = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

const pop = (frame: number, fps: number, delay = 0) =>
  spring({
    frame: frame - delay,
    fps,
    durationInFrames: Math.round(0.62 * fps),
    config: {damping: 24, stiffness: 190, mass: 0.9},
  });

const sceneOpacity = (frame: number, duration: number) =>
  interpolate(frame, [0, 5, duration - 6, duration], [0, 1, 1, 0], clamp);

const Scene = ({
  duration,
  children,
}: {
  duration: number;
  children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: sceneOpacity(frame, duration)}}>
      {children}
    </AbsoluteFill>
  );
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

const Background = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [-120, 120], clamp);
  const pulse = 0.7 + 0.3 * Math.sin((frame / 30) * Math.PI);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(145deg, ${C.elevated} 0%, ${C.canvas} 53%, ${C.deep} 100%)`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 1040,
          height: 1040,
          left: 360 + drift,
          top: -360,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(113,132,171,0.14) 0%, rgba(74,95,136,0.045) 48%, transparent 72%)",
          opacity: pulse,
        }}
      />
      <Img
        src={staticFile("bg-symbol-outline.svg")}
        style={{
          position: "absolute",
          width: 910,
          height: 910,
          right: -300,
          bottom: -340,
          filter: "brightness(0) invert(1)",
          opacity: 0.045,
          transform: `translateY(${Math.sin(frame / 75) * 28}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 42,
          borderRadius: 32,
          border: `1px solid ${C.hairline}`,
        }}
      />
    </AbsoluteFill>
  );
};

const TransitionStrikes = () => {
  const frame = useCurrentFrame();
  const hits = [70, 164, 260, 368, 488, 558];
  return (
    <>
      {hits.map((hit) => {
        const local = frame - hit;
        const left = interpolate(local, [-6, 18], [-1100, 2350], clamp);
        const fade = interpolate(
          local,
          [-6, -1, 11, 18],
          [0, 1, 0.72, 0],
          clamp
        );
        return (
          <div key={hit}>
            <div
              style={{
                position: "absolute",
                top: -260,
                left,
                width: 780,
                height: 1640,
                background: C.accent,
                opacity: 0.52 * fade,
                transform: "rotate(12deg)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: -260,
                left: left + 780,
                width: 9,
                height: 1640,
                background: C.accentBright,
                opacity: 0.9 * fade,
                transform: "rotate(12deg)",
              }}
            />
          </div>
        );
      })}
    </>
  );
};

const Kicker = ({children}: {children: ReactNode}) => (
  <div
    style={{
      color: C.muted,
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

const Intro = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gate = smooth(frame, 0, 20);
  const logo = pop(frame, fps, 5);
  const word = pop(frame, fps, 13);
  const rule = smooth(frame, 24, 52);
  return (
    <Scene duration={70}>
      <AbsoluteFill style={{fontFamily: FONT, justifyContent: "center"}}>
        <div
          style={{
            position: "absolute",
            left: 160,
            top: 0,
            bottom: 0,
            width: 12,
            background: C.accentBright,
            transform: `scaleY(${gate})`,
            transformOrigin: "center",
          }}
        />
        <div
          style={{
            marginLeft: 250,
            display: "flex",
            alignItems: "center",
            gap: 48,
          }}
        >
          <div
            style={{
              width: 176,
              height: 176,
              borderRadius: 48,
              background: C.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: logo,
              transform: `translateX(${interpolate(logo, [0, 1], [-60, 0])}px) rotate(${interpolate(logo, [0, 1], [-7, 0])}deg)`,
            }}
          >
            <Logo size={104} />
          </div>
          <div>
            <div
              style={{
                color: C.muted,
                fontSize: 30,
                fontWeight: 600,
                opacity: word,
                transform: `translateY(${interpolate(word, [0, 1], [24, 0])}px)`,
              }}
            >
              Welcome to
            </div>
            <div
              style={{
                color: C.primary,
                fontSize: 152,
                lineHeight: 0.98,
                fontWeight: 600,
                letterSpacing: "-0.065em",
                opacity: word,
                transform: `translateY(${interpolate(word, [0, 1], [34, 0])}px)`,
              }}
            >
              Magnus.
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 250,
            bottom: 190,
            width: 1040 * rule,
            height: 2,
            background: C.border,
          }}
        />
      </AbsoluteFill>
    </Scene>
  );
};

const tickerItems = [
  "Company news",
  "Project updates",
  "People",
  "Schedules",
  "Approvals",
  "Insights",
];

const KnowScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = pop(frame, fps, 4);
  return (
    <Scene duration={94}>
      <AbsoluteFill style={{fontFamily: FONT}}>
        <div style={{position: "absolute", left: 150, top: 220}}>
          <div style={{opacity: title}}>
            <Kicker>Stay current</Kicker>
          </div>
          <div
            style={{
              marginTop: 30,
              color: C.primary,
              fontSize: 126,
              lineHeight: 1.02,
              fontWeight: 600,
              letterSpacing: "-0.06em",
              maxWidth: 760,
              opacity: title,
              transform: `translateX(${interpolate(title, [0, 1], [-54, 0])}px)`,
            }}
          >
            Know what&apos;s happening.
          </div>
          <div
            style={{
              marginTop: 34,
              color: C.secondary,
              fontSize: 31,
              opacity: pop(frame, fps, 18),
            }}
          >
            Catch up without chasing updates.
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 100,
            top: 120,
            width: 720,
            height: 840,
            overflow: "hidden",
          }}
        >
          {tickerItems.map((item, index) => {
            const y =
              80 +
              index * 124 -
              interpolate(frame, [0, 108], [35, 115], clamp);
            const p = pop(frame, fps, 9 + index * 5);
            return (
              <div
                key={item}
                style={{
                  position: "absolute",
                  left: index % 2 === 0 ? 0 : 104,
                  top: y,
                  width: 540 - index * 24,
                  height: 86,
                  borderRadius: 43,
                  border: `1px solid ${C.border}`,
                  background:
                    index === 1 ? C.accent : "rgba(34,44,66,0.78)",
                  color: index === 1 ? C.primary : C.secondary,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 34,
                  fontSize: 26,
                  fontWeight: 600,
                  opacity: p,
                  transform: `translateX(${interpolate(p, [0, 1], [80, 0])}px)`,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background:
                      index === 1 ? C.primary : C.accentBright,
                    marginRight: 20,
                  }}
                />
                {item}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const askWords = ["Ask.", "Find.", "Understand."];

const AskFindScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Scene duration={96}>
      <AbsoluteFill style={{fontFamily: FONT}}>
        <div
          style={{
            position: "absolute",
            left: 150,
            right: 150,
            top: 180,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Kicker>From question to clarity</Kicker>
          <div style={{color: C.muted, fontSize: 22, fontWeight: 600}}>
            Projects · People · Knowledge
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 150,
            top: 350,
            right: 150,
            display: "flex",
            alignItems: "center",
            gap: 44,
          }}
        >
          {askWords.map((word, index) => {
            const p = pop(frame, fps, 5 + index * 12);
            return (
              <div
                key={word}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 44,
                }}
              >
                <div
                  style={{
                    color: index === 2 ? C.primary : C.secondary,
                    fontSize: index === 2 ? 128 : 110,
                    fontWeight: 600,
                    letterSpacing: "-0.065em",
                    opacity: p,
                    transform: `translateY(${interpolate(p, [0, 1], [58, 0])}px)`,
                  }}
                >
                  {word}
                </div>
                {index < askWords.length - 1 && (
                  <div
                    style={{
                      width: 100,
                      height: 2,
                      background: C.accentBright,
                      transform: `scaleX(${p})`,
                      transformOrigin: "left",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            left: 150,
            right: 150,
            bottom: 210,
            height: 130,
          }}
        >
          {Array.from({length: 11}).map((_, index) => {
            const travel = smooth(frame, 12 + index * 2, 58 + index * 2);
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: interpolate(travel, [0, 1], [index * 126, 1500]),
                  top: 12 + (index % 3) * 34,
                  width: 54 + (index % 4) * 26,
                  height: 8,
                  borderRadius: 4,
                  background:
                    index % 3 === 0 ? C.accentBright : C.border,
                  opacity: 0.35 + travel * 0.55,
                }}
              />
            );
          })}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 8,
              width: 6,
              height: 100,
              borderRadius: 3,
              background: C.primary,
              transform: `scaleY(${smooth(frame, 48, 78)})`,
            }}
          />
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const actionLines = [
  {text: "Draft the RFI.", from: -1040, top: 220},
  {text: "Prep the meeting.", from: 1100, top: 435},
  {text: "Catch up fast.", from: -1080, top: 650},
];

const ActionScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Scene duration={108}>
      <AbsoluteFill style={{fontFamily: FONT}}>
        {actionLines.map((line, index) => {
          const p = pop(frame, fps, 4 + index * 11);
          const x = interpolate(p, [0, 1], [line.from, 0]);
          return (
            <div
              key={line.text}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: line.top,
                height: 154,
                display: "flex",
                alignItems: "center",
                background:
                  index === 1 ? C.accent : "rgba(34,44,66,0.72)",
                borderTop: `1px solid ${C.border}`,
                borderBottom: `1px solid ${C.border}`,
                transform: `translateX(${x}px)`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  marginLeft: index === 1 ? 460 : 180,
                  color: C.primary,
                  fontSize: 102,
                  lineHeight: 1,
                  fontWeight: 600,
                  letterSpacing: "-0.055em",
                  whiteSpace: "nowrap",
                }}
              >
                {line.text}
              </div>
              <div
                style={{
                  marginLeft: "auto",
                  marginRight: 150,
                  color:
                    index === 1 ? "rgba(255,255,255,0.72)" : C.muted,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {index === 0
                  ? "Project"
                  : index === 1
                    ? "Schedule"
                    : "Pulse"}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </Scene>
  );
};

const nodes = [
  {label: "News", angle: -145, radius: 355},
  {label: "Messages", angle: -88, radius: 350},
  {label: "People", angle: -30, radius: 365},
  {label: "Calendar", angle: 30, radius: 365},
  {label: "Approvals", angle: 88, radius: 350},
  {label: "Insights", angle: 145, radius: 355},
];

const ConnectedScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const draw = smooth(frame, 2, 64);
  const center = pop(frame, fps, 14);
  return (
    <Scene duration={120}>
      <AbsoluteFill style={{fontFamily: FONT}}>
        <svg
          width="1920"
          height="1080"
          viewBox="0 0 1920 1080"
          style={{position: "absolute", inset: 0}}
        >
          {nodes.map((node, index) => {
            const angle = (node.angle * Math.PI) / 180;
            const x = 960 + Math.cos(angle) * node.radius;
            const y = 510 + Math.sin(angle) * node.radius;
            const p = interpolate(
              draw,
              [index * 0.055, 0.68 + index * 0.04],
              [0, 1],
              clamp
            );
            return (
              <line
                key={node.label}
                x1="960"
                y1="510"
                x2={960 + (x - 960) * p}
                y2={510 + (y - 510) * p}
                stroke="rgba(255,255,255,0.17)"
                strokeWidth="2"
              />
            );
          })}
          <circle
            cx="960"
            cy="510"
            r={185 + Math.sin(frame / 8) * 8}
            fill="none"
            stroke="rgba(113,132,171,0.22)"
            strokeWidth="2"
            opacity={draw}
          />
        </svg>
        {nodes.map((node, index) => {
          const angle = (node.angle * Math.PI) / 180;
          const x = 960 + Math.cos(angle) * node.radius;
          const y = 510 + Math.sin(angle) * node.radius;
          const p = pop(frame, fps, 9 + index * 5);
          return (
            <div
              key={node.label}
              style={{
                position: "absolute",
                left: x - 82,
                top: y - 34,
                width: 164,
                height: 68,
                borderRadius: 34,
                background: "rgba(34,44,66,0.86)",
                border: `1px solid ${C.border}`,
                color: C.secondary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 600,
                opacity: p,
                transform: `scale(${interpolate(p, [0, 1], [0.78, 1])})`,
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
            top: 510,
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: 44,
              background: C.accent,
              border: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: center,
              transform: `scale(${interpolate(center, [0, 1], [0.72, 1])})`,
            }}
          >
            <Logo size={84} />
          </div>
          <div
            style={{
              marginTop: 34,
              color: C.primary,
              fontSize: 82,
              fontWeight: 600,
              letterSpacing: "-0.05em",
              opacity: pop(frame, fps, 27),
              whiteSpace: "nowrap",
            }}
          >
            Everything connected.
          </div>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const Finale = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const logo = pop(frame, fps, 4);
  const word = pop(frame, fps, 12);
  const line = smooth(frame, 28, 58);
  return (
    <Scene duration={142}>
      <AbsoluteFill
        style={{
          fontFamily: FONT,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 42,
          }}
        >
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 46,
              background: C.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: logo,
              transform: `rotate(${interpolate(logo, [0, 1], [-8, 0])}deg) scale(${interpolate(logo, [0, 1], [0.78, 1])})`,
            }}
          >
            <Logo size={94} />
          </div>
          <div
            style={{
              color: C.primary,
              fontSize: 148,
              fontWeight: 600,
              letterSpacing: "-0.065em",
              opacity: word,
              transform: `translateX(${interpolate(word, [0, 1], [44, 0])}px)`,
            }}
          >
            Magnus
          </div>
        </div>
        <div
          style={{
            marginTop: 54,
            width: 680 * line,
            height: 2,
            background: C.border,
          }}
        />
        <div
          style={{
            marginTop: 34,
            color: C.secondary,
            fontSize: 34,
            fontWeight: 500,
            letterSpacing: "-0.022em",
            opacity: pop(frame, fps, 32),
          }}
        >
          Ask anything. Move work forward.
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 120,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 16,
          }}
        >
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              style={{
                width: index === 4 ? 110 : 34,
                height: 8,
                borderRadius: 4,
                background:
                  index === 4 ? C.accentBright : C.border,
                transform: `scaleX(${pop(frame, fps, 42 + index * 4)})`,
              }}
            />
          ))}
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

export const WelcomeToMagnusV2 = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: C.canvas}}>
      <Background />
      <Sequence from={0} durationInFrames={70} premountFor={fps}>
        <Intro />
      </Sequence>
      <Sequence from={70} durationInFrames={94} premountFor={fps}>
        <KnowScene />
      </Sequence>
      <Sequence from={164} durationInFrames={96} premountFor={fps}>
        <AskFindScene />
      </Sequence>
      <Sequence from={260} durationInFrames={108} premountFor={fps}>
        <ActionScene />
      </Sequence>
      <Sequence from={368} durationInFrames={120} premountFor={fps}>
        <ConnectedScene />
      </Sequence>
      <Sequence from={488} durationInFrames={142} premountFor={fps}>
        <Finale />
      </Sequence>
      <TransitionStrikes />
      <Audio
        src={staticFile("remotion/audio/magnus-v2-upbeat.wav")}
        volume={(f) =>
          interpolate(f, [0, 12, 600, 630], [0, 0.9, 0.9, 0], clamp)
        }
      />
    </AbsoluteFill>
  );
};
