"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContractBar() {
  const [status, setStatus] = useState<"idle" | "copied" | "notyet">("idle");

  function handleCopy() {
    setStatus("notyet");
    window.setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <div className="border-t border-b border-white/10 bg-[#05070a]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-10">
        <div className="font-mono">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">
            Contract address · $AMP
          </div>
          <div className="mt-1 text-sm text-zinc-300">
            launching — address lands here
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-5">
          <Link
            href="/what-is-this"
            className="font-mono text-xs uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-300"
          >
            What is this? →
          </Link>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md bg-cyan-400 px-5 py-2 font-mono text-sm font-medium text-black transition-colors hover:bg-cyan-300"
          >
            {status === "notyet" ? "Not live yet" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
