import NervousSystemDiagram from "./NervousSystemDiagram";

export default function NervousSystemSection() {
  return (
    <section className="bg-black px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
              The nervous system · how it reacts
            </div>
            <p className="mt-3 text-lg leading-relaxed text-zinc-300">
              <span className="font-semibold text-zinc-50">
                $AMP is a living on-chain organism.
              </span>{" "}
              Its behavior is driven by a simulated nervous system loosely
              modeled on invertebrate sensory circuits. Every buy, sell, and
              quiet stretch becomes a sensory signal. The diagram below is
              the live loop — activity in, behavior out.
            </p>
          </div>
          <a
            href="#the-brain"
            className="shrink-0 rounded-md bg-amber-400 px-5 py-2.5 font-mono text-sm font-medium text-black transition-colors hover:bg-amber-300"
          >
            See the brain →
          </a>
        </div>

        <div className="mt-10">
          <NervousSystemDiagram />
        </div>

        <div className="mt-12 text-center">
          <p className="font-mono text-sm font-semibold uppercase tracking-widest text-zinc-200 sm:text-base">
            The market is its environment.
            <br />
            The blockchain is its sensory system.
            <br />
            The connectome is its brain.
          </p>
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-zinc-600">
            You don&apos;t control the organism.
            <br />
            You stimulate it.
          </p>
        </div>
      </div>
    </section>
  );
}
