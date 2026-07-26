import fs from "node:fs";
import path from "node:path";

const sampleRate = 48000;
const duration = 24;
const frames = sampleRate * duration;
const bpm = 126;
const beat = 60 / bpm;
const left = new Float64Array(frames);
const right = new Float64Array(frames);
let seed = 0x4d41474e;

const random = () => {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 0xffffffff;
};

const midi = (note) => 440 * 2 ** ((note - 69) / 12);
const soft = (value) => Math.tanh(value * 1.25) / Math.tanh(1.25);
const panGains = (pan) => [
  Math.cos(((pan + 1) * Math.PI) / 4),
  Math.sin(((pan + 1) * Math.PI) / 4),
];

const add = (time, length, synth, gain = 1, pan = 0) => {
  const start = Math.max(0, Math.floor(time * sampleRate));
  const end = Math.min(frames, Math.ceil((time + length) * sampleRate));
  const [gainL, gainR] = panGains(pan);
  for (let index = start; index < end; index++) {
    const local = (index - start) / sampleRate;
    const value = synth(local, length) * gain;
    left[index] += value * gainL;
    right[index] += value * gainR;
  }
};

const sine = (frequency, t, phase = 0) =>
  Math.sin(Math.PI * 2 * frequency * t + phase);

const padVoice = (notes, time, length, gain) => {
  notes.forEach((note, noteIndex) => {
    const frequency = midi(note);
    add(
      time,
      length,
      (t, d) => {
        const attack = Math.min(1, t / 0.7);
        const release = Math.min(1, (d - t) / 0.85);
        const envelope = attack * release;
        const shimmer = 0.7 + 0.3 * Math.sin(Math.PI * 2 * 0.11 * t);
        return (
          sine(frequency, t) * 0.52 +
          sine(frequency * 1.0035, t, 0.3) * 0.24 +
          sine(frequency * 2, t, 0.1) * 0.12 +
          sine(frequency / 2, t) * 0.12
        ) * envelope * shimmer;
      },
      gain / notes.length,
      (noteIndex - (notes.length - 1) / 2) * 0.24
    );
  });
};

const pluck = (note, time, gain, pan = 0) => {
  const frequency = midi(note);
  add(
    time,
    0.72,
    (t) => {
      const envelope = Math.exp(-t * 5.4);
      return (
        sine(frequency, t) * 0.68 +
        sine(frequency * 2, t, 0.2) * 0.22 +
        sine(frequency * 3, t, 0.5) * 0.1
      ) * envelope;
    },
    gain,
    pan
  );
};

const bass = (note, time, length, gain) => {
  const frequency = midi(note);
  add(
    time,
    length,
    (t, d) => {
      const attack = Math.min(1, t / 0.025);
      const release = Math.min(1, (d - t) / 0.12);
      return (
        sine(frequency, t) * 0.76 +
        sine(frequency * 2, t) * 0.16 +
        sine(frequency / 2, t) * 0.08
      ) * attack * release;
    },
    gain
  );
};

const kick = (time, gain = 1) =>
  add(
    time,
    0.46,
    (t) => {
      const frequency = 44 + 108 * Math.exp(-t * 22);
      const body = sine(frequency, t) * Math.exp(-t * 11);
      const click = (random() * 2 - 1) * Math.exp(-t * 75);
      return body + click * 0.12;
    },
    0.72 * gain
  );

const clap = (time, gain = 1) =>
  add(
    time,
    0.25,
    (t) => {
      const burst =
        Math.exp(-t * 23) +
        (t > 0.025 ? Math.exp(-(t - 0.025) * 34) * 0.65 : 0) +
        (t > 0.052 ? Math.exp(-(t - 0.052) * 42) * 0.42 : 0);
      return (random() * 2 - 1) * burst;
    },
    0.17 * gain,
    0.08
  );

const hat = (time, gain = 1, pan = 0) =>
  add(
    time,
    0.075,
    (t) => (random() * 2 - 1) * Math.exp(-t * 62),
    0.085 * gain,
    pan
  );

const impact = (time, gain = 1) => {
  add(
    time,
    1.75,
    (t) => {
      const low = sine(52 - t * 8, t) * Math.exp(-t * 2.9);
      const air = (random() * 2 - 1) * Math.exp(-t * 6.5);
      return low * 0.82 + air * 0.18;
    },
    0.42 * gain
  );
};

const riser = (time, length, gain = 1) =>
  add(
    time,
    length,
    (t, d) => {
      const progress = t / d;
      const frequency = 170 + 780 * progress ** 2;
      const noise = (random() * 2 - 1) * (0.18 + progress * 0.42);
      return (
        sine(frequency, t) * 0.34 +
        sine(frequency * 1.51, t) * 0.15 +
        noise
      ) * progress ** 1.8;
    },
    0.2 * gain
  );

const chords = [
  [50, 57, 60, 64],
  [46, 53, 57, 60],
  [41, 48, 53, 57],
  [48, 55, 60, 62],
];
const roots = [38, 34, 29, 36];

for (let section = 0; section < 6; section++) {
  const chord = chords[section % chords.length];
  padVoice(chord, section * 4, 4.35, section === 0 ? 0.34 : 0.48);
}

for (let beatIndex = 0; beatIndex < Math.ceil(duration / beat); beatIndex++) {
  const time = beatIndex * beat;
  const section = Math.min(5, Math.floor(time / 4));
  const energy = section === 0 ? 0.38 : section === 5 ? 0.78 : 1;
  if (beatIndex % 2 === 0 || section >= 3) kick(time, energy);
  if (beatIndex % 4 === 2 && time > 3) clap(time, energy);
  if (time > 2.7) {
    hat(time, 0.6 * energy, beatIndex % 2 === 0 ? -0.34 : 0.34);
    if (section >= 2) hat(time + beat / 2, 0.42 * energy, 0.45);
  }
  const root = roots[Math.floor(time / 4) % roots.length];
  if (beatIndex % 2 === 0 && time > 3.5) {
    bass(root, time, beat * 1.55, 0.29 * energy);
  }
}

const arpPattern = [0, 7, 12, 16, 12, 7, 19, 16];
for (let step = 0; step < Math.floor(duration / (beat / 2)); step++) {
  const time = step * (beat / 2);
  if (time < 4.1 || (time > 19.9 && step % 2 === 1)) continue;
  const section = Math.floor(time / 4);
  const root = roots[section % roots.length] + 12;
  const lift = time > 15.5 ? 0.13 : 0;
  pluck(
    root + arpPattern[step % arpPattern.length],
    time,
    0.12 + lift,
    (step % 4 - 1.5) * 0.22
  );
}

[0, 3.5, 7.5, 12, 16.5, 20.5].forEach((time, index) =>
  impact(time, index === 0 ? 0.72 : 1)
);
[2.7, 6.7, 11.15, 15.65, 19.65].forEach((time) =>
  riser(time, 0.85, 1)
);

for (let index = 0; index < frames; index++) {
  const time = index / sampleRate;
  const localBeat = (time % beat) / beat;
  const duck = time > 3.3 ? 0.82 + 0.18 * Math.min(1, localBeat / 0.32) : 1;
  const intro = Math.min(1, time / 0.55);
  const outro = Math.min(1, (duration - time) / 1.3);
  left[index] = soft(left[index] * duck * intro * outro * 0.91);
  right[index] = soft(right[index] * duck * intro * outro * 0.91);
}

let peak = 0;
for (let index = 0; index < frames; index++) {
  peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
}
const normalization = 0.92 / Math.max(peak, 0.001);
const pcm = Buffer.alloc(frames * 4);
for (let index = 0; index < frames; index++) {
  pcm.writeInt16LE(
    Math.max(-32768, Math.min(32767, Math.round(left[index] * normalization * 32767))),
    index * 4
  );
  pcm.writeInt16LE(
    Math.max(-32768, Math.min(32767, Math.round(right[index] * normalization * 32767))),
    index * 4 + 2
  );
}

const wav = Buffer.alloc(44 + pcm.length);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + pcm.length, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 4, 28);
wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(pcm.length, 40);
pcm.copy(wav, 44);

const output = path.resolve(
  "public/remotion/audio/magnus-v3-cinematic-raw.wav"
);
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, wav);
console.log(
  `Generated ${duration}s cinematic score at ${sampleRate}Hz (raw peak ${peak.toFixed(3)})`
);
