import {mkdir, writeFile} from "node:fs/promises";

const sampleRate = 48000;
const duration = 21;
const length = sampleRate * duration;
const left = new Float32Array(length);
const right = new Float32Array(length);
const tau = Math.PI * 2;

let seed = 0x4d41474e;
const noise = () => {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return (seed / 0xffffffff) * 2 - 1;
};

const add = (time, value, pan = 0) => {
  const index = Math.floor(time * sampleRate);
  if (index < 0 || index >= length) return;
  const angle = ((pan + 1) * Math.PI) / 4;
  left[index] += value * Math.cos(angle);
  right[index] += value * Math.sin(angle);
};

const ease = (t) => t * t * (3 - 2 * t);
const attackRelease = (t, dur, attack, release) => {
  const a = ease(Math.min(1, t / attack));
  const r = ease(Math.min(1, (dur - t) / release));
  return Math.max(0, Math.min(a, r));
};

const tone = ({
  start,
  duration: dur,
  frequency,
  gain,
  pan = 0,
  attack = 0.01,
  release = 0.2,
  harmonics = [1],
  detune = 0,
}) => {
  const samples = Math.floor(dur * sampleRate);
  const detuned = frequency * 2 ** (detune / 1200);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const env = attackRelease(t, dur, attack, release);
    let value = 0;
    for (let h = 0; h < harmonics.length; h++) {
      value +=
        Math.sin(tau * detuned * (h + 1) * t + h * 0.37) * harmonics[h];
    }
    add(start + t, value * gain * env, pan);
  }
};

const padChord = (start, dur, notes) => {
  const pans = [-0.52, 0.1, 0.5, -0.12];
  notes.forEach((frequency, index) => {
    tone({
      start,
      duration: dur,
      frequency,
      gain: 0.028,
      pan: pans[index],
      attack: 0.65,
      release: 0.9,
      harmonics: [1, 0.28, 0.12, 0.05],
      detune: index % 2 === 0 ? -4 : 4,
    });
  });
};

const pluck = (start, frequency, pan, gain = 0.05) => {
  const dur = 0.42;
  const samples = Math.floor(dur * sampleRate);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-8.5 * t) * Math.min(1, t / 0.006);
    const value =
      Math.sin(tau * frequency * t) +
      0.42 * Math.sin(tau * frequency * 2 * t + 0.2) +
      0.13 * Math.sin(tau * frequency * 3 * t + 0.6);
    add(start + t, value * gain * env, pan);
  }
};

const bass = (start, frequency, strong) => {
  const dur = 0.36;
  const samples = Math.floor(dur * sampleRate);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-5.2 * t) * Math.min(1, t / 0.012);
    const value =
      Math.sin(tau * frequency * t) +
      0.18 * Math.sin(tau * frequency * 2 * t);
    add(start + t, value * (strong ? 0.09 : 0.065) * env, -0.05);
  }
};

const kick = (start, gain = 0.28) => {
  const dur = 0.2;
  const samples = Math.floor(dur * sampleRate);
  let phase = 0;
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const frequency = 48 + 92 * Math.exp(-24 * t);
    phase += (tau * frequency) / sampleRate;
    const env = Math.exp(-18 * t);
    add(start + t, Math.sin(phase) * gain * env, 0);
  }
};

const hat = (start, gain = 0.038, pan = 0.2) => {
  const dur = 0.075;
  const samples = Math.floor(dur * sampleRate);
  let previous = 0;
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const white = noise();
    const high = white - previous * 0.94;
    previous = white;
    const env = Math.exp(-55 * t);
    add(start + t, high * gain * env, pan);
  }
};

const clap = (start, gain = 0.08) => {
  const dur = 0.16;
  const samples = Math.floor(dur * sampleRate);
  let low = 0;
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const white = noise();
    low += 0.18 * (white - low);
    const band = white - low;
    const burst =
      Math.exp(-34 * t) +
      (t > 0.022 ? 0.7 * Math.exp(-42 * (t - 0.022)) : 0) +
      (t > 0.048 ? 0.45 * Math.exp(-48 * (t - 0.048)) : 0);
    add(start + t, band * gain * burst, -0.12);
  }
};

const transitionSweep = (start) => {
  const dur = 0.46;
  const samples = Math.floor(dur * sampleRate);
  let low = 0;
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const white = noise();
    const coefficient = 0.015 + 0.42 * (t / dur) ** 2;
    low += coefficient * (white - low);
    const env = Math.sin(Math.PI * (t / dur)) ** 1.5;
    add(start + t, low * 0.12 * env, 0.35);
  }
  tone({
    start,
    duration: 0.7,
    frequency: 73.416,
    gain: 0.12,
    attack: 0.005,
    release: 0.65,
    harmonics: [1, 0.18],
  });
};

const chords = [
  [146.832, 184.997, 220.0, 293.665],
  [123.471, 146.832, 184.997, 246.942],
  [97.999, 123.471, 146.832, 195.998],
  [110.0, 146.832, 164.814, 220.0],
  [146.832, 184.997, 220.0, 293.665],
  [146.832, 184.997, 220.0, 293.665],
];
const roots = [73.416, 61.735, 48.999, 55.0, 73.416, 73.416];
const arp = [
  [293.665, 440.0, 369.994, 440.0],
  [246.942, 369.994, 293.665, 369.994],
  [195.998, 293.665, 246.942, 293.665],
  [220.0, 329.628, 293.665, 329.628],
  [293.665, 440.0, 369.994, 440.0],
  [293.665, 369.994, 440.0, 587.33],
];

for (let section = 0; section < chords.length; section++) {
  const start = section * 4;
  const dur = section === chords.length - 1 ? 1.4 : 4.6;
  if (start >= duration) break;
  padChord(start, Math.min(dur, duration - start), chords[section]);
}

const beat = 0.5;
for (let beatIndex = 0; beatIndex < 42; beatIndex++) {
  const time = beatIndex * beat;
  const section = Math.min(chords.length - 1, Math.floor(time / 4));
  const withinBar = beatIndex % 8;
  const strong = withinBar === 0 || withinBar === 4;
  bass(time, roots[section], strong);
  if (time >= 1.5) {
    kick(time, strong ? 0.31 : 0.23);
    if (beatIndex % 4 === 2) clap(time, 0.085);
  }
  for (let half = 0; half < 2; half++) {
    const subdivision = beatIndex * 2 + half;
    const note = arp[section][subdivision % 4];
    const pan = subdivision % 2 === 0 ? -0.34 : 0.34;
    pluck(time + half * 0.25, note, pan, time < 2 ? 0.03 : 0.047);
    if (time >= 3) {
      hat(time + half * 0.25, half === 0 ? 0.034 : 0.026, pan * -0.7);
    }
  }
}

[2.35, 5.45, 8.65, 12.15, 15.75, 18.55].forEach(transitionSweep);

for (let i = 0; i < length; i++) {
  const t = i / sampleRate;
  const masterFade =
    Math.min(1, t / 0.45) * Math.min(1, Math.max(0, (duration - t) / 0.8));
  left[i] = Math.tanh(left[i] * 1.15) * masterFade;
  right[i] = Math.tanh(right[i] * 1.15) * masterFade;
}

let peak = 0;
for (let i = 0; i < length; i++) {
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
}
const gain = peak > 0 ? 0.9 / peak : 1;

const dataSize = length * 2 * 2;
const buffer = Buffer.alloc(44 + dataSize);
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(2, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 4, 28);
buffer.writeUInt16LE(4, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < length; i++) {
  const offset = 44 + i * 4;
  buffer.writeInt16LE(
    Math.round(Math.max(-1, Math.min(1, left[i] * gain)) * 32767),
    offset
  );
  buffer.writeInt16LE(
    Math.round(Math.max(-1, Math.min(1, right[i] * gain)) * 32767),
    offset + 2
  );
}

await mkdir("public/remotion/audio", {recursive: true});
await writeFile("public/remotion/audio/magnus-v2-upbeat-raw.wav", buffer);
console.log(
  `Generated ${duration}s stereo score at ${sampleRate}Hz (raw peak ${peak.toFixed(3)})`
);
