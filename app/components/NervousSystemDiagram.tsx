"use client";

import { useEffect, useState } from "react";

// Integer-only bit-mixing hash: identical results on every JS engine, so it
// never causes a server/client hydration mismatch the way Math.sin-based
// hashes can (transcendental functions can differ by a ULP across engines).
function hash(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const SIGNAL_COLORS = {
  buy: "#fbbf24",
  sell: "#fb7185",
  volume: "#22d3ee",
  holder: "#34d399",
  largeTx: "#a78bfa",
  idle: "#52525b",
};

const ACTIVITY_TYPES = [
  { label: "Buys", color: SIGNAL_COLORS.buy },
  { label: "New holders", color: SIGNAL_COLORS.holder },
  { label: "Sells", color: SIGNAL_COLORS.sell },
  { label: "Large tx", color: SIGNAL_COLORS.largeTx },
  { label: "Volume", color: SIGNAL_COLORS.volume },
  { label: "Market activity", color: "#a1a1aa" },
];

const SENSORY_MAP = [
  { from: "Buy", to: "food signal", color: SIGNAL_COLORS.buy },
  { from: "Holder", to: "touch", color: SIGNAL_COLORS.holder },
  { from: "Sell", to: "aversive", color: SIGNAL_COLORS.sell },
  { from: "Large tx", to: "strong pulse", color: SIGNAL_COLORS.largeTx },
  { from: "Volume", to: "vibration", color: SIGNAL_COLORS.volume },
  { from: "Idle", to: "deprivation", color: SIGNAL_COLORS.idle },
];

const BEHAVIORS = ["Move", "Turn", "Feed", "Approach", "Avoid", "Freeze", "Explore"];

const STATES = ["FORAGING", "TURNING", "FEEDING", "EXPLORING", "RESTING", "FREEZING"];

function ActivityGrid({ seed }: { seed: number }) {
  const cells = Array.from({ length: 24 }, (_, i) => hash(seed + i));
  return (
    <div className="grid grid-cols-6 gap-[3px]">
      {cells.map((v, i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-[1px]"
          style={{
            backgroundColor: "#fbbf24",
            opacity: 0.15 + hash(seed + i + 90) * 0.7,
          }}
        />
      ))}
    </div>
  );
}

// A small mesh of nodes/edges standing in for the connectome, with a few
// pulses traveling along synapses to suggest live signal propagation.
function Connectome({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const nodeCount = 16;
  const nodes = Array.from({ length: nodeCount }, (_, i) => {
    const angle = hash(i * 3 + 1) * Math.PI * 2;
    const radius = r * (0.25 + hash(i * 3 + 2) * 0.75);
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });
  const edges: [number, number][] = [];
  for (let i = 0; i < nodeCount; i++) {
    edges.push([i, (i + 1) % nodeCount]);
    if (i % 2 === 0) edges.push([i, (i + 5) % nodeCount]);
  }
  const pulseEdges = [0, 4, 9, 13];

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r + 18}
        fill="url(#brainGlow)"
        opacity={0.6}
      />
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="#34d399"
          strokeOpacity={0.25}
          strokeWidth={0.75}
        />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={2.2} fill="#6ee7b7" fillOpacity={0.85} />
      ))}
      {pulseEdges.map((edgeIdx, i) => {
        const [a, b] = edges[edgeIdx];
        const d = `M ${nodes[a].x} ${nodes[a].y} L ${nodes[b].x} ${nodes[b].y}`;
        return (
          <circle key={i} r={2} fill="#a7f3d0">
            <animateMotion
              dur={`${0.5 + i * 0.12}s`}
              repeatCount="indefinite"
              path={d}
            />
          </circle>
        );
      })}
    </g>
  );
}

function OrganismGlyph({ cx, cy }: { cx: number; cy: number }) {
  const size = 76;
  return (
    <image
      href="/organism.png"
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      opacity={0.9}
      className="organism-float"
      filter="url(#blackToAlpha)"
    />
  );
}

function FlowPath({ d, dur = "1.8s" }: { d: string; dur?: string }) {
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="#2dd4bf"
        strokeOpacity={0.4}
        strokeWidth={1.1}
        strokeDasharray="1.5 4"
      />
      <circle r={2.2} fill="#5eead4">
        <animateMotion dur={dur} repeatCount="indefinite" path={d} />
      </circle>
    </g>
  );
}

export default function NervousSystemDiagram() {
  const [neuralEvents, setNeuralEvents] = useState(12482);
  const [activeNeurons, setActiveNeurons] = useState(1847);
  const [sensoryPulses, setSensoryPulses] = useState(326);
  const [behaviors, setBehaviors] = useState(74);
  const [stateIdx, setStateIdx] = useState(0);

  useEffect(() => {
    const eventsId = setInterval(
      () => setNeuralEvents((v) => v + Math.floor(1 + Math.random() * 6)),
      2200
    );
    const neuronsId = setInterval(
      () =>
        setActiveNeurons((v) => {
          const next = v + Math.floor((Math.random() - 0.5) * 60);
          return Math.max(1200, Math.min(2600, next));
        }),
      3000
    );
    const pulsesId = setInterval(
      () => setSensoryPulses((v) => v + Math.floor(1 + Math.random() * 3)),
      2600
    );
    const behaviorsId = setInterval(
      () => setBehaviors((v) => v + (Math.random() < 0.6 ? 1 : 0)),
      4500
    );
    const stateId = setInterval(
      () => setStateIdx((i) => (i + 1) % STATES.length),
      6000
    );
    return () => {
      clearInterval(eventsId);
      clearInterval(neuronsId);
      clearInterval(pulsesId);
      clearInterval(behaviorsId);
      clearInterval(stateId);
    };
  }, []);

  return (
    <div
      id="the-brain"
      className="overflow-hidden rounded-lg border border-emerald-500/20 bg-black font-mono"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-[10px] uppercase tracking-widest">
        <span className="text-emerald-400">
          The nervous system <span className="text-emerald-600">·</span>{" "}
          on-chain organism <span className="text-emerald-600">·</span> live
          connectome
        </span>
        <span className="text-emerald-600">
          Live <span className="text-emerald-700">·</span> blockchain{" "}
          <span className="text-emerald-700">→</span> brain{" "}
          <span className="text-emerald-700">→</span> behavior
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox="0 0 1200 480" className="h-auto w-full min-w-[900px]">
          <defs>
            <radialGradient id="brainGlow">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </radialGradient>
            {/* turns the organism artwork's black backdrop transparent by
                deriving alpha from luminance, so only the bright specks show */}
            <filter id="blackToAlpha" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        0.4 0.4 0.4 0 0"
              />
            </filter>
          </defs>

          {/* connecting flow: activity -> sensory input */}
          <FlowPath d="M 250 110 C 380 100, 440 90, 515 68" dur="1.2s" />
          {/* sensory input -> brain */}
          <FlowPath d="M 600 100 C 600 130, 600 155, 600 175" dur="0.7s" />
          {/* brain -> behavior */}
          <FlowPath d="M 700 270 C 800 260, 870 250, 940 235" dur="1.2s" />
          {/* feedback loop: behavior -> live observation -> activity */}
          <path
            d="M 990 300 C 1050 400, 300 430, 190 320"
            fill="none"
            stroke="#4b5563"
            strokeOpacity={0.4}
            strokeWidth={1}
            strokeDasharray="1 5"
          />
          <circle r={2} fill="#9ca3af">
            <animateMotion
              dur="3.2s"
              repeatCount="indefinite"
              path="M 990 300 C 1050 400, 300 430, 190 320"
            />
          </circle>
          <text
            x={600}
            y={412}
            textAnchor="middle"
            className="fill-zinc-500"
            style={{ fontSize: 10 }}
          >
            live observation
          </text>

          {/* LEFT: on-chain activity */}
          <g>
            <text
              x={160}
              y={50}
              textAnchor="middle"
              className="fill-amber-300"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              $AMP
            </text>
            <text
              x={160}
              y={66}
              textAnchor="middle"
              className="fill-zinc-500"
              style={{ fontSize: 9.5 }}
            >
              on-chain activity
            </text>
            <foreignObject x={100} y={78} width={120} height={44}>
              <ActivityGrid seed={11} />
            </foreignObject>
            {ACTIVITY_TYPES.map((a, i) => {
              const col = i % 2;
              const row = Math.floor(i / 2);
              return (
                <g key={a.label} transform={`translate(${70 + col * 100}, ${150 + row * 18})`}>
                  <circle cx={0} cy={-3} r={2.5} fill={a.color} />
                  <text
                    x={8}
                    y={0}
                    className="fill-zinc-400"
                    style={{ fontSize: 9.5 }}
                  >
                    {a.label}
                  </text>
                </g>
              );
            })}
          </g>

          {/* CENTER TOP: sensory input node */}
          <g>
            <rect
              x={520}
              y={48}
              width={160}
              height={30}
              rx={4}
              fill="#0c1a14"
              stroke="#fbbf24"
              strokeOpacity={0.4}
            />
            <text
              x={600}
              y={67}
              textAnchor="middle"
              className="fill-amber-300"
              style={{ fontSize: 11, fontWeight: 700 }}
            >
              SENSORY INPUT
            </text>
            <text
              x={600}
              y={92}
              textAnchor="middle"
              className="fill-zinc-600"
              style={{ fontSize: 8.5 }}
            >
              chain events → biological stimuli
            </text>
          </g>

          {/* THE BRAIN centerpiece */}
          <Connectome cx={600} cy={280} r={80} />
          <text
            x={600}
            y={180}
            textAnchor="middle"
            className="fill-emerald-300"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            THE BRAIN
          </text>
          <text
            x={600}
            y={385}
            textAnchor="middle"
            className="fill-emerald-500"
            style={{ fontSize: 9.5 }}
          >
            biological neural simulation
          </text>
          <text
            x={600}
            y={398}
            textAnchor="middle"
            className="fill-emerald-700"
            style={{ fontSize: 9 }}
          >
            amphipod-inspired circuitry
          </text>

          {/* sensory mapping legend, tucked beside the brain */}
          {SENSORY_MAP.map((m, i) => (
            <g key={m.from} transform={`translate(300, ${210 + i * 15})`}>
              <circle cx={0} cy={-3} r={2} fill={m.color} />
              <text x={7} y={0} className="fill-zinc-600" style={{ fontSize: 8.5 }}>
                {m.from} → {m.to}
              </text>
            </g>
          ))}

          {/* RIGHT: behavior */}
          <g>
            <text
              x={1040}
              y={180}
              textAnchor="middle"
              className="fill-cyan-300"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              BEHAVIOR
            </text>
            <text
              x={1040}
              y={196}
              textAnchor="middle"
              className="fill-zinc-600"
              style={{ fontSize: 9 }}
            >
              observed, not directed
            </text>
            <OrganismGlyph cx={1040} cy={225} />
            {BEHAVIORS.map((b, i) => {
              const col = i % 2;
              const row = Math.floor(i / 2);
              return (
                <text
                  key={b}
                  x={995 + col * 65}
                  y={255 + row * 17}
                  className="fill-cyan-500"
                  style={{ fontSize: 9.5 }}
                >
                  {b}
                </text>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-emerald-500/20 bg-emerald-500/10 text-[10px] uppercase tracking-widest sm:grid-cols-5">
        {[
          { label: "Neural events", value: neuralEvents.toLocaleString("en-US") },
          { label: "Active neurons", value: activeNeurons.toLocaleString("en-US") },
          { label: "Sensory pulses", value: sensoryPulses.toLocaleString("en-US") },
          { label: "Behaviors", value: behaviors.toLocaleString("en-US") },
          { label: "Current state", value: STATES[stateIdx] },
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
