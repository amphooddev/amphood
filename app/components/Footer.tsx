import Link from "next/link";

const LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: "the plan", href: "/#the-plan" },
  { label: "what is this", href: "/what-is-this" },
  { label: "the brain", href: "/#the-brain" },
  {
    label: "github",
    href: "https://github.com/amphooddev/amphood",
    external: true,
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
          {LINKS.map((l) =>
            l.external ? (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline decoration-cyan-400/30 underline-offset-4 transition-colors hover:text-cyan-300"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                href={l.href}
                className="text-cyan-400 underline decoration-cyan-400/30 underline-offset-4 transition-colors hover:text-cyan-300"
              >
                {l.label}
              </Link>
            )
          )}
          <span className="font-mono text-sm text-slate-600">
            explorer{" "}
            <span className="text-[10px] uppercase tracking-widest text-slate-700">
              (soon)
            </span>
          </span>
        </div>

        <div className="mt-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Robinhood chain
          </span>
        </div>

        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-slate-600">
          AMPHOOD is an independent art project exploring the intersection
          of biology, simulation, and blockchain. It is not affiliated with
          any research institution, any blockchain foundation, or any real
          amphipod. $AMP is an experiment in generative art and
          simulation, not an investment, and nothing on this site is
          financial advice. Also, it has never touched open water.
        </p>
      </div>
    </footer>
  );
}
