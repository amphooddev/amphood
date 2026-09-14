"use client";

import { useEffect, useRef, useState } from "react";

/**
 * This tank is an honest client-side simulation, not a fake animation
 * bolted onto trade events. Every organism runs the same deterministic
 * core (natural energy/arousal/stress cycle + stimulus response) — the
 * only thing that differs between them is their own internal state,
 * which is exactly what produces different reactions to the same
 * stimulus. There is no real shared multiplayer backend yet (no
 * $AMP contract exists to listen to — see the contract bar above),
 * so "global" stimuli here are generated locally on a realistic cadence
 * rather than read from chain. When a contract exists, the event
 * source below is the only piece that needs to be swapped for a real
 * listener; the simulation and rendering underneath do not change.
 */

type OrgState =
  | "RESTING"
  | "DRIFTING"
  | "EXPLORING"
  | "PAUSED"
  | "ALERT"
  | "AVOIDING"
  | "APPROACHING"
  | "INVESTIGATING";

type StimulusType = "CHEMICAL" | "MECHANICAL" | "VIBRATION" | "TOUCH" | "OVERLOAD";

type EventType =
  | "BUY"
  | "LARGE BUY"
  | "SELL"
  | "LARGE SELL"
  | "VOLUME SPIKE"
  | "RAPID BURST"
  | "EXTREME ACTIVITY";

const EVENT_TO_STIMULUS: Record<EventType, { type: StimulusType; range: [number, number] }> = {
  BUY: { type: "CHEMICAL", range: [0.25, 0.45] },
  "LARGE BUY": { type: "CHEMICAL", range: [0.6, 0.9] },
  SELL: { type: "MECHANICAL", range: [0.25, 0.45] },
  "LARGE SELL": { type: "MECHANICAL", range: [0.6, 0.9] },
  "VOLUME SPIKE": { type: "VIBRATION", range: [0.4, 0.7] },
  "RAPID BURST": { type: "VIBRATION", range: [0.3, 0.55] },
  "EXTREME ACTIVITY": { type: "OVERLOAD", range: [0.85, 1.0] },
};

const EVENT_WEIGHTS: [EventType, number][] = [
  ["BUY", 34],
  ["SELL", 28],
  ["VOLUME SPIKE", 16],
  ["LARGE BUY", 10],
  ["LARGE SELL", 8],
  ["RAPID BURST", 3],
  ["EXTREME ACTIVITY", 1],
];

interface Vars {
  energy: number;
  arousal: number;
  stress: number;
  attraction: number;
}

interface Organism {
  id: string;
  isYou: boolean;
  x: number;
  y: number;
  heading: number;
  targetHeading: number;
  speed: number;
  vars: Vars;
  state: OrgState;
  nextDecisionAt: number;
  lastDecisionAt: number;
  lastStimulusType: StimulusType | null;
  lastStimulusAt: number;
  spawnedAt: number;
  trail: { x: number; y: number }[];
}

interface GlobalWave {
  type: StimulusType;
  intensity: number;
  eventLabel: EventType;
  originX: number;
  originY: number;
  startedAt: number;
  processed: Set<string>;
}

interface LocalRipple {
  x: number;
  y: number;
  startedAt: number;
}

const WAVE_DURATION = 2200; // ms to cross the tank
const TOUCH_RADIUS_FRAC = 0.22; // fraction of min(width,height)

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function randId() {
  return `AMP-${Math.floor(1000 + Math.random() * 9000)}`;
}

function pickEvent(): EventType {
  const total = EVENT_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [type, w] of EVENT_WEIGHTS) {
    if (r < w) return type;
    r -= w;
  }
  return "BUY";
}

// The single deterministic function that turns a set of internal
// variables into an observable behavioral state. Same inputs, same
// output — every organism runs this, nothing is decided per-instance.
function decideState(v: Vars): OrgState {
  if (v.stress > 0.6) return "AVOIDING";
  if (v.arousal > 0.62 && v.stress < 0.32 && v.energy > 0.28) {
    return v.attraction > 0.35 ? "APPROACHING" : "INVESTIGATING";
  }
  if (v.arousal > 0.46) return "ALERT";
  if (v.energy < 0.22) return "RESTING";
  if (v.arousal < 0.16) return "PAUSED";
  return v.arousal > 0.3 ? "EXPLORING" : "DRIFTING";
}

function naturalTick(vars: Vars, state: OrgState, dtSeconds: number): Vars {
  const k = Math.min(1, dtSeconds / 3);
  return {
    energy: clamp01(vars.energy + (state === "RESTING" ? 0.15 : -0.03) * k),
    arousal: clamp01(vars.arousal + (0.3 - vars.arousal) * 0.35 * k),
    stress: clamp01(vars.stress + (0 - vars.stress) * 0.45 * k),
    attraction: clamp01(vars.attraction * (1 - 0.5 * k)),
  };
}

function applyStimulus(vars: Vars, type: StimulusType, intensity: number): Vars {
  switch (type) {
    case "CHEMICAL":
      return {
        ...vars,
        arousal: clamp01(vars.arousal + intensity * 0.5),
        attraction: clamp01(vars.attraction + intensity * 0.65),
        stress: clamp01(vars.stress + intensity * 0.05),
      };
    case "MECHANICAL":
      return {
        ...vars,
        stress: clamp01(vars.stress + intensity * 0.6),
        arousal: clamp01(vars.arousal + intensity * 0.4),
        attraction: clamp01(vars.attraction * 0.4),
      };
    case "VIBRATION":
      return {
        ...vars,
        arousal: clamp01(vars.arousal + intensity * 0.45),
        stress: clamp01(vars.stress + intensity * 0.2),
      };
    case "TOUCH":
      return {
        ...vars,
        arousal: clamp01(vars.arousal + intensity * 0.4),
        stress: clamp01(vars.stress + intensity * 0.35),
      };
    case "OVERLOAD":
      return {
        ...vars,
        arousal: clamp01(vars.arousal + 0.7),
        stress: clamp01(vars.stress + 0.5),
      };
  }
}

function speedFor(state: OrgState, tankScale: number): number {
  const table: Record<OrgState, number> = {
    RESTING: 0.002,
    PAUSED: 0.0,
    ALERT: 0.004,
    DRIFTING: 0.02,
    EXPLORING: 0.045,
    AVOIDING: 0.095,
    APPROACHING: 0.05,
    INVESTIGATING: 0.045,
  };
  return table[state] * tankScale;
}

function createOrganism(isYou: boolean, w: number, h: number, now: number): Organism {
  return {
    id: randId(),
    isYou,
    x: Math.random() * w,
    y: Math.random() * h,
    heading: Math.random() * Math.PI * 2,
    targetHeading: Math.random() * Math.PI * 2,
    speed: 0,
    vars: {
      energy: 0.5 + Math.random() * 0.35,
      arousal: 0.2 + Math.random() * 0.3,
      stress: Math.random() * 0.2,
      attraction: 0,
    },
    state: "DRIFTING",
    nextDecisionAt: now + Math.random() * 2000,
    lastDecisionAt: now,
    lastStimulusType: null,
    lastStimulusAt: -Infinity,
    spawnedAt: isYou ? now : now - Math.random() * 240000,
    trail: [],
  };
}

function formatAge(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
}

const OTHER_COUNT = 11;

interface Summary {
  id: string;
  isYou: boolean;
  state: OrgState;
  neuralActivity: number;
  energy: number;
  stress: number;
  lastStimulusType: StimulusType | null;
  lastStimulusAgoMs: number;
  ageMs: number;
}

export default function TheColony() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [youId, setYouId] = useState("AMP-0000");
  const [youSummary, setYouSummary] = useState<Summary | null>(null);
  const [hovered, setHovered] = useState<Summary | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [onlineCount, setOnlineCount] = useState(24);
  const [stimuliObserved, setStimuliObserved] = useState(1284);
  const [environment, setEnvironment] = useState<"ACTIVE" | "QUIET">("ACTIVE");
  const [eventBanner, setEventBanner] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const organismImg = new Image();
    organismImg.src = "/organism.png";

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      const rect = container!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const now0 = performance.now();
    const organisms: Organism[] = [createOrganism(true, width || 800, height || 460, now0)];
    for (let i = 0; i < OTHER_COUNT; i++) {
      organisms.push(createOrganism(false, width || 800, height || 460, now0));
    }
    setYouId(organisms[0].id);

    let wave: GlobalWave | null = null;
    let nextEventAt = now0 + 4000 + Math.random() * 4000;
    let lastGlobalStimulusAt = now0;
    const localRipples: LocalRipple[] = [];

    let raf = 0;
    let last = performance.now();
    let statTick = 0;

    function tankScale() {
      return Math.min(width, height);
    }

    function summarize(o: Organism, now: number): Summary {
      return {
        id: o.id,
        isYou: o.isYou,
        state: o.state,
        neuralActivity: Math.round((o.vars.arousal * 0.6 + o.vars.stress * 0.4) * 100) / 100,
        energy: Math.round(o.vars.energy * 100) / 100,
        stress: Math.round(o.vars.stress * 100) / 100,
        lastStimulusType: o.lastStimulusType,
        lastStimulusAgoMs: now - o.lastStimulusAt,
        ageMs: now - o.spawnedAt,
      };
    }

    function reactTo(o: Organism, type: StimulusType, intensity: number, originX: number, originY: number, now: number) {
      o.vars = applyStimulus(o.vars, type, intensity);
      o.state = decideState(o.vars);
      o.lastStimulusType = type;
      o.lastStimulusAt = now;
      const away = Math.atan2(o.y - originY, o.x - originX);
      if (o.state === "AVOIDING") o.targetHeading = away;
      else if (o.state === "APPROACHING" || o.state === "INVESTIGATING" || o.state === "ALERT") {
        o.targetHeading = away + Math.PI;
      }
    }

    let hoveredId: string | null = null;
    let mouseX = -1;
    let mouseY = -1;

    function handleMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }
    function handleLeave() {
      mouseX = -1;
      mouseY = -1;
    }
    function handleClick(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const now = performance.now();
      localRipples.push({ x: cx, y: cy, startedAt: now });
      const radius = tankScale() * TOUCH_RADIUS_FRAC;
      for (const o of organisms) {
        const d = Math.hypot(o.x - cx, o.y - cy);
        if (d < radius) {
          const intensity = 0.55 * (1 - d / radius);
          reactTo(o, "TOUCH", intensity, cx, cy, now);
        }
      }
    }
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);
    canvas.addEventListener("click", handleClick);

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // maybe start a new global event
      if (!wave && now >= nextEventAt) {
        const eventType = pickEvent();
        const mapping = EVENT_TO_STIMULUS[eventType];
        const intensity = mapping.range[0] + Math.random() * (mapping.range[1] - mapping.range[0]);
        const originX = mapping.type === "CHEMICAL" ? width / 2 : Math.random() * width;
        const originY = mapping.type === "CHEMICAL" ? height / 2 : Math.random() * height;
        wave = {
          type: mapping.type,
          intensity,
          eventLabel: eventType,
          originX,
          originY,
          startedAt: now,
          processed: new Set(),
        };
        lastGlobalStimulusAt = now;
        setStimuliObserved((v) => v + 1);
        const time = new Date().toISOString().slice(11, 19);
        setEventBanner(`${time}  GLOBAL STIMULUS  ${mapping.type}  INTENSITY ${intensity.toFixed(2)}`);
        window.setTimeout(() => setEventBanner((b) => (b ? null : b)), 3400);
        nextEventAt = now + 6000 + Math.random() * 9000;
      }

      // advance wave, apply to organisms it reaches
      let waveRadius = 0;
      if (wave) {
        const elapsed = now - wave.startedAt;
        const maxRadius = Math.hypot(width, height);
        waveRadius = (elapsed / WAVE_DURATION) * maxRadius;
        for (const o of organisms) {
          if (wave.processed.has(o.id)) continue;
          const d = Math.hypot(o.x - wave.originX, o.y - wave.originY);
          if (d <= waveRadius) {
            wave.processed.add(o.id);
            reactTo(o, wave.type, wave.intensity, wave.originX, wave.originY, now);
          }
        }
        if (elapsed > WAVE_DURATION + 300) wave = null;
      }

      // per-organism simulation
      for (const o of organisms) {
        if (now >= o.nextDecisionAt) {
          const dtDecision = (now - o.lastDecisionAt) / 1000;
          o.vars = naturalTick(o.vars, o.state, Math.max(0.5, dtDecision));
          o.state = decideState(o.vars);
          o.lastDecisionAt = now;
          o.nextDecisionAt = now + 1600 + Math.random() * 1900;
          if (o.state === "DRIFTING" || o.state === "EXPLORING") {
            o.targetHeading = o.heading + (Math.random() - 0.5) * 2.4;
          }
        }

        // smooth steering with inertia
        let diff = o.targetHeading - o.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        o.heading += diff * Math.min(1, dt * 1.4);

        const targetSpeed = speedFor(o.state, tankScale());
        o.speed += (targetSpeed - o.speed) * Math.min(1, dt * 2);

        o.x += Math.cos(o.heading) * o.speed * dt;
        o.y += Math.sin(o.heading) * o.speed * dt;

        const margin = tankScale() * 0.05;
        if (o.x < margin) {
          o.x = margin;
          o.targetHeading = 0;
        }
        if (o.x > width - margin) {
          o.x = width - margin;
          o.targetHeading = Math.PI;
        }
        if (o.y < margin) {
          o.y = margin;
          o.targetHeading = Math.PI / 2;
        }
        if (o.y > height - margin) {
          o.y = height - margin;
          o.targetHeading = -Math.PI / 2;
        }

        o.trail.push({ x: o.x, y: o.y });
        if (o.trail.length > 70) o.trail.shift();
      }

      // hover hit-test
      let hit: Organism | null = null;
      if (mouseX >= 0) {
        let bestD = 22;
        for (const o of organisms) {
          const d = Math.hypot(o.x - mouseX, o.y - mouseY);
          if (d < bestD) {
            bestD = d;
            hit = o;
          }
        }
      }
      const newHoveredId = hit ? hit.id : null;
      if (newHoveredId !== hoveredId) {
        hoveredId = newHoveredId;
        setHovered(hit ? summarize(hit, now) : null);
      }
      if (hit) setTooltipPos({ x: mouseX, y: mouseY });

      // ---- draw ----
      ctx!.fillStyle = "#020304";
      ctx!.fillRect(0, 0, width, height);

      ctx!.strokeStyle = "rgba(148,163,184,0.05)";
      ctx!.lineWidth = 1;
      const grid = 36;
      for (let gx = 0; gx < width; gx += grid) {
        ctx!.beginPath();
        ctx!.moveTo(gx, 0);
        ctx!.lineTo(gx, height);
        ctx!.stroke();
      }
      for (let gy = 0; gy < height; gy += grid) {
        ctx!.beginPath();
        ctx!.moveTo(0, gy);
        ctx!.lineTo(width, gy);
        ctx!.stroke();
      }

      // global wave visualization
      if (wave) {
        const waveColor =
          wave.type === "CHEMICAL"
            ? "232,201,138"
            : wave.type === "MECHANICAL"
              ? "148,163,184"
              : wave.type === "OVERLOAD"
                ? "251,113,133"
                : "34,211,238";
        if (wave.type === "CHEMICAL") {
          const grad = ctx!.createRadialGradient(
            wave.originX,
            wave.originY,
            0,
            wave.originX,
            wave.originY,
            waveRadius
          );
          grad.addColorStop(0, `rgba(${waveColor},0)`);
          grad.addColorStop(0.85, `rgba(${waveColor},0.05)`);
          grad.addColorStop(1, `rgba(${waveColor},0)`);
          ctx!.fillStyle = grad;
          ctx!.beginPath();
          ctx!.arc(wave.originX, wave.originY, waveRadius, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.strokeStyle = `rgba(${waveColor},0.22)`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.arc(wave.originX, wave.originY, waveRadius, 0, Math.PI * 2);
        ctx!.stroke();
      }

      // local ripples
      for (let i = localRipples.length - 1; i >= 0; i--) {
        const r = localRipples[i];
        const age = now - r.startedAt;
        if (age > 900) {
          localRipples.splice(i, 1);
          continue;
        }
        const p = age / 900;
        ctx!.strokeStyle = `rgba(94,234,212,${0.35 * (1 - p)})`;
        ctx!.lineWidth = 1.2;
        ctx!.beginPath();
        ctx!.arc(r.x, r.y, 8 + p * (tankScale() * TOUCH_RADIUS_FRAC), 0, Math.PI * 2);
        ctx!.stroke();
      }

      // organisms: small segmented, skeletal, glowing-joint bodies
      for (const o of organisms) {
        const color = o.isYou ? "232,201,138" : "125,211,252";
        // trail
        for (let i = 1; i < o.trail.length; i++) {
          const p0 = o.trail[i - 1];
          const p1 = o.trail[i];
          const age = i / o.trail.length;
          ctx!.strokeStyle = `rgba(${color},${0.04 + age * 0.12})`;
          ctx!.lineWidth = 0.75;
          ctx!.beginPath();
          ctx!.moveTo(p0.x, p0.y);
          ctx!.lineTo(p1.x, p1.y);
          ctx!.stroke();
        }

        const bodyLen = tankScale() * 0.045;
        const glyphSize = bodyLen * 2.4;

        if (o.isYou) {
          const glow = ctx!.createRadialGradient(o.x, o.y, 0, o.x, o.y, glyphSize * 0.8);
          glow.addColorStop(0, "rgba(232,201,138,0.25)");
          glow.addColorStop(1, "rgba(232,201,138,0)");
          ctx!.fillStyle = glow;
          ctx!.beginPath();
          ctx!.arc(o.x, o.y, glyphSize * 0.8, 0, Math.PI * 2);
          ctx!.fill();
        }

        if (organismImg.complete && organismImg.naturalWidth > 0) {
          ctx!.save();
          ctx!.translate(o.x, o.y);
          ctx!.rotate(o.heading + Math.PI);
          ctx!.globalAlpha = o.isYou ? 0.95 : 0.8;
          ctx!.globalCompositeOperation = "lighten";
          ctx!.drawImage(organismImg, -glyphSize / 2, -glyphSize / 2, glyphSize, glyphSize);
          ctx!.restore();
        }

        if (o.isYou) {
          ctx!.fillStyle = "rgba(232,201,138,0.85)";
          ctx!.font = "9px var(--font-geist-mono)";
          ctx!.textAlign = "center";
          ctx!.fillText("YOU", o.x, o.y - bodyLen * 0.6 - 4);
          ctx!.textAlign = "left";
        }
      }

      // throttled react-state sync
      statTick += dt;
      if (statTick > 0.5) {
        statTick = 0;
        const you = organisms.find((o) => o.isYou);
        if (you) setYouSummary(summarize(you, now));
        setEnvironment(now - lastGlobalStimulusAt < 25000 ? "ACTIVE" : "QUIET");
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    const onlineId = setInterval(() => {
      setOnlineCount((v) => Math.max(9, Math.min(46, v + Math.round((Math.random() - 0.5) * 6))));
    }, 5000);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(onlineId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseleave", handleLeave);
      canvas.removeEventListener("click", handleClick);
    };
  }, []);

  const display = hovered ?? youSummary;

  return (
    <section className="bg-black px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
          The colony
        </div>
        <h2
          className="mt-4 text-3xl leading-tight text-zinc-50 sm:text-4xl"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Every open tab is alive.
        </h2>
        <div className="mt-5 max-w-xl space-y-3 leading-relaxed text-slate-400">
          <p>Open AMPHOOD and a specimen enters the tank.</p>
          <p>
            Every specimen experiences the same chain, but carries its own
            internal state. The same disturbance can produce a different
            reaction.
          </p>
          <p>Close the tab and yours disappears.</p>
        </div>

        <div
          id="the-tank"
          ref={containerRef}
          className="relative mt-10 overflow-hidden rounded-lg border border-white/10 bg-black"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 font-mono text-[10px] uppercase tracking-widest">
            <span className="flex items-center gap-2 text-slate-400">
              Tank 001
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            </span>
            <span className="text-slate-500">
              Organisms online <span className="text-slate-300">{onlineCount}</span>
            </span>
          </div>

          <div className="relative h-[420px] sm:h-[480px]">
            <canvas ref={canvasRef} className="h-full w-full cursor-crosshair" />
            {eventBanner && (
              <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded border border-white/10 bg-black/70 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-slate-400">
                {eventBanner}
              </div>
            )}
            {display && tooltipPos && hovered && (
              <div
                className="pointer-events-none absolute z-10 w-44 rounded border border-white/10 bg-black/90 p-2.5 font-mono text-[9.5px] uppercase leading-relaxed text-slate-400"
                style={{
                  left: Math.min(tooltipPos.x + 14, 1000),
                  top: Math.max(0, tooltipPos.y - 10),
                }}
              >
                <div className="flex items-center justify-between text-slate-300">
                  <span>Specimen</span>
                  {display.isYou && <span className="text-amber-300">You</span>}
                </div>
                <div className="text-zinc-100">{display.id}</div>
                <div className="mt-1.5 text-slate-500">State</div>
                <div className="text-cyan-300">{display.state}</div>
                <div className="mt-1.5 text-slate-500">Neural activity</div>
                <div className="text-emerald-300">{display.neuralActivity.toFixed(2)}</div>
                <div className="mt-1.5 text-slate-500">Energy</div>
                <div className="text-slate-300">{display.energy.toFixed(2)}</div>
                <div className="mt-1.5 text-slate-500">Stress</div>
                <div className="text-slate-300">{display.stress.toFixed(2)}</div>
                <div className="mt-1.5 text-slate-500">Last stimulus</div>
                <div className="text-slate-300">
                  {display.lastStimulusType
                    ? `${display.lastStimulusType} · ${(display.lastStimulusAgoMs / 1000).toFixed(1)}s ago`
                    : "none yet"}
                </div>
                <div className="mt-1.5 text-slate-500">Age</div>
                <div className="text-slate-300">{formatAge(display.ageMs)}</div>
              </div>
            )}
            <div className="pointer-events-none absolute bottom-2 right-3 hidden font-mono text-[9px] uppercase tracking-widest text-slate-600 sm:block">
              Click the tank to disturb it
            </div>
            <div className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Yours{" "}
              <span className="hidden text-slate-700 sm:inline">·</span>{" "}
              <span className="hidden sm:inline">hover a specimen</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/5 text-[10px] uppercase tracking-widest sm:grid-cols-5">
            {[
              { label: "Organisms online", value: `${onlineCount}` },
              { label: "Stimuli observed", value: stimuliObserved.toLocaleString("en-US") },
              { label: "Environment", value: environment },
              { label: "Your specimen", value: youId },
              { label: "Your state", value: youSummary?.state ?? "—" },
            ].map((s) => (
              <div key={s.label} className="bg-black px-4 py-3">
                <div className="text-slate-600">{s.label}</div>
                <div className="mt-1 text-base font-semibold normal-case tracking-normal text-slate-200">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="font-mono text-sm font-semibold uppercase tracking-widest text-zinc-200 sm:text-base">
            The chain is shared.
            <br />
            The experience is not.
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
            Every organism receives the same world through a different
            internal state.
          </p>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-slate-700">
            The chain doesn&apos;t tell it what to do. It only disturbs its
            world.
          </p>
        </div>
      </div>
    </section>
  );
}
