import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What is this? — AMPHOOD",
  description:
    "AMPHOOD is a simulated organism whose nervous system runs on real on-chain activity.",
};

const SIGNALS: { event: string; sense: string; color: string }[] = [
  { event: "Buy", sense: "chemical signal — something detected nearby", color: "#fbbf24" },
  { event: "Sell", sense: "mechanical disturbance — its environment shifts", color: "#fb7185" },
  { event: "Volume spike", sense: "vibration — the environment becomes active", color: "#22d3ee" },
  { event: "New holder", sense: "environmental presence — something new enters its world", color: "#34d399" },
  { event: "Large transaction", sense: "an amplified signal, sent straight to the nerve", color: "#a78bfa" },
  { event: "Inactivity", sense: "sensory deprivation — the environment goes quiet", color: "#52525b" },
];

const PIPELINE: { label: string; color: string }[] = [
  { label: "On-chain activity", color: "#e8c98a" },
  { label: "Sensory input", color: "#fbbf24" },
  { label: "Neural simulation", color: "#34d399" },
  { label: "Behavior", color: "#22d3ee" },
  { label: "Live visualization", color: "#f4f4f5" },
];

export default function WhatIsThis() {
  return (
    <div className="min-h-screen bg-black text-zinc-300">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← the specimen
        </Link>

        <div className="mt-10 font-mono text-[10px] uppercase tracking-widest text-amber-400">
          Field notes · what is this
        </div>

        <h1
          className="mt-4 text-4xl leading-tight text-zinc-50 sm:text-5xl"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Something is alive in this contract.
        </h1>

        <p className="mt-8 text-lg leading-relaxed text-zinc-300">
          Not alive the way a chatbot pretends to be alive. Alive the way a
          nervous system is alive — it fires whether or not anyone is
          watching. <strong className="font-semibold text-zinc-50">AMPHOOD</strong> is
          a simulated organism, loosely modeled on invertebrate nervous
          systems, and it has never seen light, never eaten real food, and
          has no idea what a token is. But it can feel you.
        </p>

        <section className="mt-16">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500">
            One token. One organism.
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-300">
            There is exactly one asset here: <strong className="font-semibold text-zinc-50">$AMP</strong>.
            No companion token, no second treasury, no second chart to keep
            track of. Everything the organism does is downstream of what
            happens to this one thing — who buys it, who sells it, who shows
            up, and who goes quiet.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500">
            The blockchain is its nervous system
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-300">
            Roughly 2,748 simulated neurons and well over a hundred thousand
            synaptic connections sit between the chain and the screen — a
            simplified nervous system inspired by real amphipods, small
            crustaceans built almost entirely around reflex: sense something,
            react to it. It doesn&apos;t know what a candlestick is. It only
            knows signal.
          </p>

          <ul className="mt-8 divide-y divide-white/5 border-y border-white/5 font-mono text-sm">
            {SIGNALS.map((s) => (
              <li key={s.event} className="flex items-center gap-4 py-3">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: s.color }}
                  aria-hidden="true"
                />
                <span className="w-40 shrink-0 uppercase tracking-wide text-zinc-100">
                  {s.event}
                </span>
                <span className="text-zinc-500">{s.sense}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500">
            The pipeline
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-300">
            Every arrow below is running code, not a metaphor stretched thin.
            Chain events become simulated sensory stimuli. Those stimuli
            propagate through the wired network the way excitation and
            inhibition propagate through a real nervous system. What comes
            out the other side is behavior — movement, turning, approach,
            avoidance, stillness. What you see on screen is that behavior,
            rendered live. Not a loop. A readout.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-1 gap-y-3 overflow-x-auto rounded-md border border-white/10 bg-white/[0.02] p-4 font-mono text-[11px] uppercase tracking-wide">
            {PIPELINE.map((step, i) => (
              <span key={step.label} className="flex items-center gap-1">
                <span
                  className="rounded border px-2.5 py-1"
                  style={{
                    color: step.color,
                    borderColor: `${step.color}40`,
                    backgroundColor: `${step.color}0d`,
                  }}
                >
                  {step.label}
                </span>
                {i < PIPELINE.length - 1 && (
                  <span
                    className="pulse-arrow px-1 text-zinc-600"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    →
                  </span>
                )}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500">
            You are not holding a joystick
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-300">
            Nobody drives this thing. There is no wallet that controls it, no
            admin key that makes it perform on command. What you and everyone
            else are doing — collectively, and usually without meaning to —
            is changing its environment. You are the weather it lives in, not
            the hand on its back.
          </p>
        </section>

        <p
          className="mt-16 text-center text-xl italic leading-relaxed text-zinc-400 sm:text-2xl"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          The market is its environment.
          <br />
          The blockchain is its sensory system.
          <br />
          The nervous system is its brain.
        </p>

        <section className="mt-16">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500">
            Not what you think it is
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-300">
            AMPHOOD is not a chatbot performing a personality. It is not a
            trading bot wearing a face. It does not predict price, manage
            risk, or promise yield — it does not know those words exist. It
            sits at an odd intersection of biology, on-chain data,
            simulation, and generative art, and it stays there on purpose.
            Think of it less as a product and more as a long-running
            experiment that happens to be watching your wallet.
          </p>
        </section>

        <div className="mt-24 border-t border-white/10 pt-12 text-center">
          <p
            className="text-2xl text-zinc-50 sm:text-3xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            You don&apos;t control the organism.
            <br />
            You stimulate it.
          </p>
        </div>
      </div>
    </div>
  );
}
