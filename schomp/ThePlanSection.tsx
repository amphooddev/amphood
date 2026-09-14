type Status = "done" | "building";

const ITEMS: {
  n: string;
  title: string;
  status: Status;
  desc: string;
}[] = [
  {
    n: "01",
    title: "The organism",
    status: "done",
    desc: "The digital body exists. An amphipod-inspired organism rendered as a living system rather than a static mascot.",
  },
  {
    n: "02",
    title: "The senses",
    status: "done",
    desc: "Environmental inputs are defined. Chemical signals, touch, vibration, and disturbance can enter the organism as sensory stimuli.",
  },
  {
    n: "03",
    title: "The nervous system",
    status: "done",
    desc: "Sensory signals propagate through a simulated neural network. The organism reacts to stimulation instead of executing predefined commands.",
  },
  {
    n: "04",
    title: "The reflexes",
    status: "done",
    desc: "Movement, recoil, approach, exploration, and inactivity emerge from neural activity and the organism's current internal state.",
  },
  {
    n: "05",
    title: "The chain",
    status: "done",
    desc: "$AMP activity can be observed on-chain and translated into environmental events in real time.",
  },
  {
    n: "06",
    title: "The translator",
    status: "done",
    desc: "Buys, sells, volume, wallet activity, and transaction intensity are converted into biological-style sensory signals before reaching the nervous system.",
  },
  {
    n: "07",
    title: "The live link",
    status: "building",
    desc: "The simulation connects to live $AMP activity. Real events become real-time stimuli. The organism does not read the market. It experiences the market.",
  },
  {
    n: "08",
    title: "The observatory",
    status: "building",
    desc: "A persistent live environment where anyone can watch the same organism experience the chain, neuron by neuron and event by event.",
  },
];

export default function ThePlanSection() {
  return (
    <section id="the-plan" className="bg-black px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
          The plan
        </div>
        <h2
          className="mt-4 text-3xl leading-tight text-zinc-50 sm:text-4xl"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          How it came alive
        </h2>
        <p className="mt-5 max-w-xl leading-relaxed text-slate-400">
          Not a roadmap of promises. A sequence of systems that turn
          on-chain activity into sensation, neural activity, and observable
          behavior.
        </p>
        <p className="mt-3 max-w-xl leading-relaxed text-slate-500">
          Everything marked <span className="text-emerald-400">DONE</span>{" "}
          is already part of the experiment. Everything below the amber
          line is still being built.
        </p>

        <div className="mt-14">
          {ITEMS.map((item, i) => {
            const prevStatus = i > 0 ? ITEMS[i - 1].status : item.status;
            const isBoundary = prevStatus === "done" && item.status === "building";
            return (
              <div key={item.n}>
                {isBoundary && (
                  <div className="my-2 flex items-center gap-3 pl-[3px]">
                    <div className="h-px flex-1 bg-amber-500/30" />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-amber-500/70">
                      building
                    </span>
                    <div className="h-px flex-1 bg-amber-500/30" />
                  </div>
                )}
                <div className="flex gap-5 sm:gap-6">
                  <div className="flex flex-col items-center">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        item.status === "done" ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                    />
                    {i < ITEMS.length - 1 && (
                      <span
                        className={`mt-1 w-px flex-1 ${
                          item.status === "done" ? "bg-emerald-500/25" : "bg-amber-500/25"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-9">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-mono text-xs text-slate-600">{item.n}</span>
                      <span className="font-mono text-sm font-semibold uppercase tracking-wide text-zinc-100">
                        {item.title}
                      </span>
                      <span
                        className={`font-mono text-[9px] uppercase tracking-widest ${
                          item.status === "done" ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {item.status === "done" ? "Done" : "Building"}
                      </span>
                    </div>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-slate-600">
          The organism is built.
          <br />
          The environment is next.
        </p>
      </div>
    </section>
  );
}
