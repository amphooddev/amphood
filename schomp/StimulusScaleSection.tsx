"use client";

import { useEffect, useState } from "react";

const X_LABELS = ["Quiet", "Low", "Medium", "High", "Extreme"];
const Y_EXPONENTS = [0, 1, 2, 3, 4];

const PLOT = { x0: 80, x1: 780, y0: 30, y1: 320 };

function xPos(cat: number) {
  return PLOT.x0 + (cat / 4) * (PLOT.x1 - PLOT.x0);
}
function yPos(exp: number) {
  return PLOT.y1 - (exp / 4) * (PLOT.y1 - PLOT.y0);
}

const POINTS: { cat: number; exp: number; label: string; sub: string }[] = [
  { cat: 0.15, exp: 0.35, label: "Small buy", sub: "chemical pulse" },
  { cat: 0.95, exp: 1.0, label: "Buy", sub: "chemical stimulus" },
  { cat: 1.15, exp: 1.35, label: "Sell", sub: "mechanical disturbance" },
  { cat: 1.9, exp: 1.75, label: "Large buy", sub: "strong chemical stimulus" },
  { cat: 2.6, exp: 2.35, label: "Large sell", sub: "strong mechanical disturbance" },
  { cat: 3.05, exp: 2.75, label: "Volume spike", sub: "environmental vibration" },
  { cat: 3.5, exp: 3.15, label: "Wallet burst", sub: "repeated sensory pulses" },
  { cat: 4.0, exp: 3.85, label: "Extreme activity", sub: "sensory overload" },
];

const PIPELINE = [
  "On-chain event",
  "Event magnitude",
  "Sensory intensity",
  "Nervous system",
  "Emergent response",
];

function hash(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export default function StimulusScaleSection() {
  const [intensity, setIntensity] = useState(0.73);

  useEffect(() => {
    const id = setInterval(() => {
      setIntensity((v) => {
        const next = v + (hash(Math.floor(Date.now() / 100)) - 0.5) * 0.08;
        return Math.min(0.85, Math.max(0.55, next));
      });
    }, 2600);
    return () => clearInterval(id);
  }, []);

  // Placed in the open gap between the buy/sell cluster and the large-sell/
  // volume-spike cluster, rather than directly on the trend line, so its
  // label never collides with the fixed example points.
  const liveCat = 2.1 + (intensity - 0.5) * 0.6;
  const liveExp = 0.9 + (intensity - 0.5) * 0.6;

  return (
    <section className="bg-black px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            The stimulus scale
          </div>
          <h2
            className="mt-4 text-3xl leading-tight text-zinc-50 sm:text-4xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            The organism never sees the market.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-slate-400">
            It doesn&apos;t know what a buy is. It doesn&apos;t know what a
            sell is. The chain is translated into sensation before it
            reaches the nervous system. Size, velocity, and intensity
            determine how strongly the organism&apos;s world is disturbed.
          </p>
        </div>

        <div className="mt-12 rounded-lg border border-white/10 bg-white/[0.015] p-4 sm:p-6">
          <div className="overflow-x-auto">
            <svg viewBox="0 0 860 380" className="h-auto w-full min-w-[640px]">
              {/* grid */}
              {Y_EXPONENTS.map((e) => (
                <line
                  key={`gy-${e}`}
                  x1={PLOT.x0}
                  y1={yPos(e)}
                  x2={PLOT.x1}
                  y2={yPos(e)}
                  stroke="rgba(255,255,255,0.045)"
                  strokeWidth={1}
                />
              ))}
              {X_LABELS.map((_, i) => (
                <line
                  key={`gx-${i}`}
                  x1={xPos(i)}
                  y1={PLOT.y0}
                  x2={xPos(i)}
                  y2={PLOT.y1}
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth={1}
                />
              ))}

              {/* axis labels */}
              {Y_EXPONENTS.map((e) => (
                <text
                  key={`yl-${e}`}
                  x={PLOT.x0 - 14}
                  y={yPos(e) + 3}
                  textAnchor="end"
                  className="fill-slate-600"
                  style={{ fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                >
                  10^{e}
                </text>
              ))}
              {X_LABELS.map((label, i) => (
                <text
                  key={label}
                  x={xPos(i)}
                  y={PLOT.y1 + 22}
                  textAnchor="middle"
                  className="fill-slate-600"
                  style={{
                    fontSize: 10,
                    letterSpacing: 1,
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  {label.toUpperCase()}
                </text>
              ))}
              <text
                x={PLOT.x0}
                y={16}
                className="fill-slate-500"
                style={{ fontSize: 9.5, fontFamily: "var(--font-geist-mono)" }}
              >
                SENSORY RESPONSE
              </text>
              <text
                x={PLOT.x1}
                y={PLOT.y1 + 44}
                textAnchor="end"
                className="fill-slate-500"
                style={{ fontSize: 9.5, fontFamily: "var(--font-geist-mono)" }}
              >
                ON-CHAIN EVENT INTENSITY
              </text>

              {/* diagonal reference line */}
              <line
                x1={xPos(0)}
                y1={yPos(0)}
                x2={xPos(4)}
                y2={yPos(4)}
                stroke="#64748b"
                strokeOpacity={0.4}
                strokeWidth={1}
                strokeDasharray="2 5"
              />
              <text
                x={xPos(3.15)}
                y={yPos(3.55)}
                textAnchor="middle"
                transform={`rotate(-32 ${xPos(3.15)} ${yPos(3.55)})`}
                className="fill-slate-600"
                style={{ fontSize: 9, letterSpacing: 1, fontFamily: "var(--font-geist-mono)" }}
              >
                STIMULUS INTENSITY
              </text>

              {/* event points */}
              {POINTS.map((p) => (
                <g key={p.label}>
                  <circle
                    cx={xPos(p.cat)}
                    cy={yPos(p.exp)}
                    r={4}
                    fill="#22d3ee"
                    fillOpacity={0.85}
                  />
                  <circle
                    cx={xPos(p.cat)}
                    cy={yPos(p.exp)}
                    r={8}
                    fill="#22d3ee"
                    fillOpacity={0.12}
                  />
                  <text
                    x={xPos(p.cat) + 9}
                    y={yPos(p.exp) - 6}
                    className="fill-slate-300"
                    style={{ fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
                  >
                    {p.label}
                  </text>
                  <text
                    x={xPos(p.cat) + 9}
                    y={yPos(p.exp) + 6}
                    className="fill-slate-600"
                    style={{ fontSize: 8.5, fontFamily: "var(--font-geist-mono)" }}
                  >
                    {p.sub}
                  </text>
                </g>
              ))}

              {/* live highlighted point */}
              <circle cx={xPos(liveCat)} cy={yPos(liveExp)} r={12} fill="#e8c98a" fillOpacity={0.15} />
              <circle cx={xPos(liveCat)} cy={yPos(liveExp)} r={5} fill="#e8c98a" />
              <text
                x={xPos(liveCat)}
                y={yPos(liveExp) - 16}
                textAnchor="middle"
                className="fill-amber-200"
                style={{ fontSize: 10.5, fontWeight: 700, fontFamily: "var(--font-geist-mono)" }}
              >
                LIVE STIMULUS
              </text>
              <text
                x={xPos(liveCat)}
                y={yPos(liveExp) + 22}
                textAnchor="middle"
                className="fill-amber-200/70"
                style={{ fontSize: 9, fontFamily: "var(--font-geist-mono)" }}
              >
                LIVE · {intensity.toFixed(2)} INTENSITY · CHEMICAL
              </text>
            </svg>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-1 gap-y-3 overflow-x-auto rounded-md border border-white/10 bg-white/[0.02] p-3 font-mono text-[10px] uppercase tracking-wide">
            {PIPELINE.map((step, i) => (
              <span key={step} className="flex items-center gap-1">
                <span className="rounded border border-white/10 px-2 py-1 text-slate-300">
                  {step}
                </span>
                {i < PIPELINE.length - 1 && (
                  <span
                    className="pulse-arrow px-1 text-slate-600"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    →
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-xl text-center text-xs leading-relaxed text-slate-600">
          Large events create stronger input. They do not guarantee a
          specific behavior. The organism&apos;s current neural state
          determines what happens after the stimulus enters the nervous
          system.
        </p>

        <div className="mt-16 border-t border-white/10 pt-10 text-center">
          <p className="font-mono text-sm font-semibold uppercase tracking-widest text-zinc-200 sm:text-base">
            The chain doesn&apos;t tell it what to do.
            <br />
            It only disturbs its world.
          </p>
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-slate-600">
            The nervous system decides what happens next.
          </p>
        </div>
      </div>
    </section>
  );
}
