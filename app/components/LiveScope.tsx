"use client";

import { useEffect, useRef, useState } from "react";

const TABS = ["Smell", "Taste", "Touch", "Light", "Probes"] as const;
type Tab = (typeof TABS)[number];

const TAB_INFO: Record<Tab, string> = {
  Smell: "antennal chemoreceptors sampling the gradient, left vs. right",
  Taste: "chemoreceptors near the mouthparts, active only at the source",
  Touch: "mechanosensory setae along the body wall",
  Light: "photoreceptors — dim when the tab loses focus",
  Probes: "raw membrane traces from a subset of the nervous system",
};

const NEURON_NAMES = [
  "Antennal chemoreceptor",
  "Feeding interneuron",
  "Turn command neuron",
  "Pleopod motor neuron",
  "Mechanosensory seta",
];

type Behavior = "Explore" | "Approach" | "Turn" | "Feed" | "Freeze";
const BEHAVIORS: Behavior[] = ["Explore", "Approach", "Turn", "Feed", "Freeze"];

const CAPTIONS: Record<Behavior, string[]> = {
  Explore: [
    "no clear gradient yet — casting side to side.",
    "drifting on a shallow slope, sampling both sides evenly.",
  ],
  Approach: [
    "gradient rising — turning to follow it.",
    "concentration climbing, holding this heading.",
  ],
  Turn: [
    "reorienting — comparing left and right before committing.",
    "sweeping the head, weighing which side smells stronger.",
  ],
  Feed: [
    "at the source — feeding interneurons active, mouthparts engaged.",
    "holding position, ingestion pattern running.",
  ],
  Freeze: [
    "startled — a brief curl before the next run.",
    "stalled — descending neurons pausing the rhythm.",
  ],
};

function hash(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export default function LiveScope() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Smell");
  const [lastEvent, setLastEvent] = useState("idle");
  const [listening, setListening] = useState(false);

  const [activeNeurons, setActiveNeurons] = useState(59);
  const [potential, setPotential] = useState(-33.4);
  const [spark, setSpark] = useState<number[]>(() => Array(40).fill(50));
  const [neuronLevels, setNeuronLevels] = useState<number[]>([40, 25, 15, 55, 10]);
  const [behaviorProbs, setBehaviorProbs] = useState<Record<Behavior, number>>({
    Explore: 0.4,
    Approach: 0.25,
    Turn: 0.15,
    Feed: 0.1,
    Freeze: 0.1,
  });
  const [currentBehavior, setCurrentBehavior] = useState<Behavior>("Explore");
  const [caption, setCaption] = useState(CAPTIONS.Explore[0]);
  const [footer, setFooter] = useState({
    signalsIn: 115,
    turns: 135,
    feeds: 94,
    totalFires: 897757,
    seizures: 0,
  });

  const simRef = useRef({
    x: 0,
    y: 0,
    heading: 0,
    state: "run" as "run" | "turn" | "hunch",
    stateTimer: 0,
    trail: [] as { x: number; y: number }[],
    ripples: [] as { x: number; y: number; t: number }[],
    turnDir: 1,
    lastFeedAt: -10,
    time: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const organismImg = new Image();
    organismImg.src = "/organism.png";

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const sim = simRef.current;
    sim.x = 0;
    sim.y = 0;
    sim.heading = Math.random() * Math.PI * 2;

    let raf = 0;
    let last = performance.now();
    let statTick = 0;

    function source() {
      return { x: width * 0.76, y: height * 0.3 };
    }

    function concentrationAt(x: number, y: number) {
      const s = source();
      const d = Math.hypot(x - s.x, y - s.y);
      return 1 / (1 + d / (Math.min(width, height) * 0.28));
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const sim = simRef.current;
      sim.time += dt;

      if (sim.x === 0 && sim.y === 0 && width > 0) {
        sim.x = width * 0.28;
        sim.y = height * 0.65;
      }

      const s = source();
      const distToSource = Math.hypot(sim.x - s.x, sim.y - s.y);
      const feedRadius = Math.min(width, height) * 0.09;

      sim.stateTimer -= dt;

      if (distToSource < feedRadius) {
        if (sim.state !== "hunch" && sim.time - sim.lastFeedAt > 3) {
          sim.lastFeedAt = sim.time;
          setFooter((f) => ({ ...f, feeds: f.feeds + 1 }));
        }
      }

      if (sim.stateTimer <= 0) {
        if (sim.state === "run") {
          sim.state = "turn";
          sim.stateTimer = 0.4 + hash(Math.floor(sim.time * 100)) * 0.6;
          const left = concentrationAt(
            sim.x + Math.cos(sim.heading + 0.6) * 20,
            sim.y + Math.sin(sim.heading + 0.6) * 20
          );
          const right = concentrationAt(
            sim.x + Math.cos(sim.heading - 0.6) * 20,
            sim.y + Math.sin(sim.heading - 0.6) * 20
          );
          sim.turnDir = left > right ? 1 : -1;
          setFooter((f) => ({ ...f, turns: f.turns + 1 }));
          setLastEvent("turn");
        } else if (sim.state === "turn") {
          sim.state = hash(Math.floor(sim.time * 57)) < 0.06 ? "hunch" : "run";
          sim.stateTimer =
            sim.state === "hunch"
              ? 0.5 + hash(Math.floor(sim.time * 31)) * 0.4
              : 0.7 + hash(Math.floor(sim.time * 13)) * 1.3;
          if (sim.state === "hunch") setLastEvent("startle");
        } else {
          sim.state = "run";
          sim.stateTimer = 0.7 + hash(Math.floor(sim.time * 13)) * 1.3;
        }
      }

      if (sim.state === "turn") {
        sim.heading += sim.turnDir * 3.6 * dt;
      } else if (sim.state === "run") {
        sim.heading += Math.sin(sim.time * 3) * 0.15 * dt;
        const speed = Math.min(width, height) * 0.26;
        sim.x += Math.cos(sim.heading) * speed * dt;
        sim.y += Math.sin(sim.heading) * speed * dt;
      }

      const margin = Math.min(width, height) * 0.09 + 12;
      if (sim.x < margin) {
        sim.x = margin;
        sim.heading = Math.PI - sim.heading;
      }
      if (sim.x > width - margin) {
        sim.x = width - margin;
        sim.heading = Math.PI - sim.heading;
      }
      if (sim.y < margin) {
        sim.y = margin;
        sim.heading = -sim.heading;
      }
      if (sim.y > height - margin) {
        sim.y = height - margin;
        sim.heading = -sim.heading;
      }

      sim.trail.push({ x: sim.x, y: sim.y });
      if (sim.trail.length > 420) sim.trail.shift();

      // draw
      ctx!.fillStyle = "#000502";
      ctx!.fillRect(0, 0, width, height);

      ctx!.strokeStyle = "rgba(52,211,153,0.08)";
      ctx!.lineWidth = 1;
      const gridStep = 34;
      for (let gx = 0; gx < width; gx += gridStep) {
        ctx!.beginPath();
        ctx!.moveTo(gx, 0);
        ctx!.lineTo(gx, height);
        ctx!.stroke();
      }
      for (let gy = 0; gy < height; gy += gridStep) {
        ctx!.beginPath();
        ctx!.moveTo(0, gy);
        ctx!.lineTo(width, gy);
        ctx!.stroke();
      }

      const grad = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, Math.min(width, height) * 0.3);
      grad.addColorStop(0, "rgba(110,231,183,0.16)");
      grad.addColorStop(1, "rgba(110,231,183,0)");
      ctx!.fillStyle = grad;
      ctx!.beginPath();
      ctx!.arc(s.x, s.y, Math.min(width, height) * 0.3, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = "rgba(110,231,183,0.7)";
      ctx!.font = "9px var(--font-geist-mono)";
      ctx!.fillText("SOURCE", s.x + 10, s.y - 8);

      const trailLen = sim.trail.length;
      for (let i = 1; i < trailLen; i++) {
        const age = i / trailLen; // 0 = oldest, 1 = newest
        const p0 = sim.trail[i - 1];
        const p1 = sim.trail[i];
        ctx!.strokeStyle = `rgba(94,234,212,${0.05 + age * 0.55})`;
        ctx!.lineWidth = 0.75 + age * 1.25;
        ctx!.beginPath();
        ctx!.moveTo(p0.x, p0.y);
        ctx!.lineTo(p1.x, p1.y);
        ctx!.stroke();
      }

      // organism glyph: the actual reference artwork, rotated to face the
      // direction of travel and drawn centered on the simulated position
      if (organismImg.complete && organismImg.naturalWidth > 0) {
        const glyphSize = Math.min(width, height) * 0.34;
        ctx!.save();
        ctx!.translate(sim.x, sim.y);
        ctx!.rotate(sim.heading + Math.PI);
        ctx!.globalAlpha = 0.92;
        ctx!.globalCompositeOperation = "lighten";
        ctx!.drawImage(
          organismImg,
          -glyphSize / 2,
          -glyphSize / 2,
          glyphSize,
          glyphSize
        );
        ctx!.restore();
      }

      // ripples from touch clicks
      sim.ripples = sim.ripples.filter((r) => now - r.t < 700);
      for (const r of sim.ripples) {
        const age = (now - r.t) / 700;
        ctx!.strokeStyle = `rgba(94,234,212,${1 - age})`;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.arc(r.x, r.y, 6 + age * 30, 0, Math.PI * 2);
        ctx!.stroke();
      }

      // throttled react-state sync
      statTick += dt;
      if (statTick > 0.4) {
        statTick = 0;
        const conc = concentrationAt(sim.x, sim.y);
        const behavior: Behavior =
          distToSource < feedRadius
            ? "Feed"
            : sim.state === "hunch"
              ? "Freeze"
              : sim.state === "turn"
                ? "Turn"
                : conc > 0.35
                  ? "Approach"
                  : "Explore";

        setCurrentBehavior(behavior);
        setActiveNeurons(Math.round(30 + conc * 60 + hash(Math.floor(now)) * 15));
        setPotential(-40 + conc * 12 + (hash(Math.floor(now) + 3) - 0.5) * 6);
        setSpark((s) => {
          const next = [...s.slice(1), 30 + conc * 60 + hash(Math.floor(now) + 9) * 20];
          return next;
        });
        setNeuronLevels([
          Math.round(conc * 100),
          Math.round(behavior === "Feed" ? 80 + hash(Math.floor(now)) * 20 : 10 + hash(Math.floor(now)) * 15),
          Math.round(behavior === "Turn" ? 70 + hash(Math.floor(now) + 1) * 25 : 8 + hash(Math.floor(now) + 1) * 12),
          Math.round(
            behavior === "Explore" || behavior === "Approach"
              ? 55 + hash(Math.floor(now) + 2) * 30
              : 15 + hash(Math.floor(now) + 2) * 10
          ),
          Math.round(behavior === "Freeze" ? 60 + hash(Math.floor(now) + 4) * 30 : 5 + hash(Math.floor(now) + 4) * 10),
        ]);
        setBehaviorProbs((prev) => {
          const next = { ...prev };
          for (const b of BEHAVIORS) {
            const target = b === behavior ? 1 : 0;
            next[b] = prev[b] * 0.85 + target * 0.15;
          }
          return next;
        });
        setCaption((c) => {
          const pool = CAPTIONS[behavior];
          return pool[Math.floor(hash(Math.floor(now / 3000)) * pool.length)] ?? c;
        });
        setFooter((f) => ({
          ...f,
          totalFires: f.totalFires + Math.round(20 + conc * 40),
          signalsIn: f.signalsIn + (hash(Math.floor(now) + 21) < 0.15 ? 1 : 0),
        }));
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    function handleClick(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const sim = simRef.current;
      const d = Math.hypot(cx - sim.x, cy - sim.y);
      if (d < 40) {
        sim.ripples.push({ x: sim.x, y: sim.y, t: performance.now() });
        sim.state = "hunch";
        sim.stateTimer = 0.6;
        setLastEvent("touch");
      }
    }
    canvas.addEventListener("click", handleClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClick);
    };
  }, []);

  function handleListen() {
    if (listening) return;
    setListening(true);
    setLastEvent("listen");
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const spikes = 10;
      for (let i = 0; i < spikes; i++) {
        const t = ctx.currentTime + i * (0.08 + hash(i) * 0.12);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 340 + hash(i + 50) * 260;
        osc.type = "square";
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.08, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.06);
      }
      window.setTimeout(() => {
        ctx.close();
        setListening(false);
      }, 1800);
    } catch {
      setListening(false);
    }
  }

  const sparkPath = spark
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (spark.length - 1)) * 100} ${40 - (v / 100) * 36}`)
    .join(" ");

  return (
    <div
      id="live-scope"
      className="overflow-hidden rounded-lg border border-emerald-500/20 bg-black font-mono"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-[10px] uppercase tracking-widest">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-2 text-emerald-400">Amphood live</span>
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded border px-2 py-0.5 transition-colors ${
                activeTab === tab
                  ? "border-emerald-400/60 text-emerald-300"
                  : "border-white/10 text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            type="button"
            onClick={handleListen}
            className={`rounded border px-2 py-0.5 transition-colors ${
              listening
                ? "border-cyan-400/60 text-cyan-300"
                : "border-white/10 text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {listening ? "Listening…" : "Listen"}
          </button>
        </div>
        <div className="flex items-center gap-3 text-emerald-600">
          <span>Last event: {lastEvent}</span>
          <span className="flex items-center gap-1.5">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        </div>
      </div>

      <div className="text-[9px] text-zinc-600 px-4 pt-2">{TAB_INFO[activeTab]}</div>

      <div className="flex flex-col lg:flex-row">
        <div className="relative h-[360px] flex-1 sm:h-[420px]">
          <canvas ref={canvasRef} className="h-full w-full cursor-pointer" />
          <div className="pointer-events-none absolute bottom-2 left-3 right-3 text-[9px] leading-relaxed text-emerald-600">
            internal state: {caption}
          </div>
        </div>

        <div className="w-full shrink-0 border-t border-emerald-500/10 p-4 text-[10px] lg:w-64 lg:border-l lg:border-t-0">
          <div className="text-zinc-600 uppercase tracking-widest">Neural activity</div>
          <div className="mt-1 text-3xl font-semibold text-emerald-300">{activeNeurons}</div>
          <div className="text-zinc-600">neurons firing now</div>

          <div className="mt-3 flex justify-between text-zinc-500">
            <span>Membrane (avg)</span>
            <span className="text-emerald-500">{potential.toFixed(1)} mV</span>
          </div>

          <svg viewBox="0 0 100 40" className="mt-2 h-10 w-full">
            <path d={sparkPath} fill="none" stroke="#34d399" strokeWidth={1} />
          </svg>

          <div className="mt-4 text-zinc-600 uppercase tracking-widest">
            Contributing neurons
          </div>
          <div className="mt-2 space-y-1.5">
            {NEURON_NAMES.map((name, i) => (
              <div key={name}>
                <div className="flex justify-between text-zinc-500">
                  <span>{name}</span>
                  <span>{neuronLevels[i]}%</span>
                </div>
                <div className="mt-0.5 h-1 w-full rounded-full bg-emerald-500/10">
                  <div
                    className="h-1 rounded-full bg-emerald-400/70"
                    style={{ width: `${neuronLevels[i]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-zinc-600 uppercase tracking-widest">
            Behavior probability
          </div>
          <div className="mt-2 space-y-1.5">
            {BEHAVIORS.map((b) => (
              <div key={b}>
                <div className="flex justify-between text-zinc-500">
                  <span className={b === currentBehavior ? "text-cyan-300" : ""}>{b}</span>
                  <span>{Math.round(behaviorProbs[b] * 100)}%</span>
                </div>
                <div className="mt-0.5 h-1 w-full rounded-full bg-cyan-500/10">
                  <div
                    className="h-1 rounded-full bg-cyan-400/60"
                    style={{ width: `${Math.round(behaviorProbs[b] * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-emerald-500/20 bg-emerald-500/10 text-[10px] uppercase tracking-widest sm:grid-cols-5">
        {[
          { label: "Signals in", value: footer.signalsIn.toLocaleString("en-US") },
          { label: "Turns taken", value: footer.turns.toLocaleString("en-US") },
          { label: "Feeds", value: footer.feeds.toLocaleString("en-US") },
          { label: "Total fires", value: footer.totalFires.toLocaleString("en-US") },
          { label: "Seizures", value: footer.seizures.toLocaleString("en-US") },
        ].map((s) => (
          <div key={s.label} className="bg-black px-4 py-3">
            <div className="text-emerald-700">{s.label}</div>
            <div className="mt-1 text-base font-semibold normal-case tracking-normal text-emerald-300">
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
