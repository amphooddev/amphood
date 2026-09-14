# amphood
A brain on-chain.

<p align="center">
  <img src="public/organism.png" alt="AMPHOOD organism" width="360" />
</p>

<h1 align="center">AMPHOOD</h1>

<p align="center">
  <em>The organism never sees the market. It only feels it.</em>
</p>

<p align="center">
  <a href="https://amphood.vercel.app">amphood.vercel.app</a>
</p>

---

## What this is

AMPHOOD is a living digital organism — an amphipod-inspired creature whose behavior is driven by a simulated nervous system. It doesn't know what a buy is, what a sell is, or what a candlestick looks like. It only knows signal.

$AMP on-chain activity is translated into biological-style sensory stimuli — chemical, mechanical, vibrational — before it ever reaches the organism. Those stimuli propagate through a simulated network, and behavior emerges from the resulting neural activity:




Nobody drives this thing directly. There's no wallet that controls it, no admin key that makes it perform on command. What every visitor does — buying, selling, showing up, going quiet — changes its *environment*. The organism decides what happens next.

> The market is its environment.
> The blockchain is its sensory system.
> The nervous system is its brain.
>
> You don't control the organism. You disturb its world.

## What's actually running

This isn't a single hero animation — it's a handful of independent, honest simulations:

- **The organism** — the creature itself, rendered from real reference artwork, driven by a burst-and-coast locomotion model (a quick power-stroke flex, a coast on inertia, a rest — the way small swimming crustaceans actually move) instead of a looping animation.
- **Where the organism is right now** — a live scope showing one specimen navigating a scent gradient toward a source, with a real run/turn/hunch state machine, a hover inspector, and a click-to-touch interaction.
- **The colony** — a shared tank of specimens, each running the *same* deterministic function (`decideState(vars)`) over its own internal `energy` / `arousal` / `stress` / `attraction` variables. Same function, different state, different reaction — that's the whole point. Global stimulus events visibly travel across the tank before organisms respond to them, and the population keeps drifting and resting even when nothing is happening on-chain.
- **The nervous system** — a diagram of the sensory-input → connectome → behavior pipeline, with live (simulated) neural stats.
- **The sensory map** — a table mapping on-chain events (buy, large buy, sell, large sell, volume spike, new holder, inactivity, touch) to sense → neural pathway → response.
- **The stimulus scale** — a scatter plot of event intensity vs. simulated sensory response, because this is meant to read as an instrument reading, not a price chart.
- **The plan** — an assembly log (not a roadmap) of what's built and what's still being wired up.

**Honesty note:** there is no `$AMP` contract yet (see the contract bar on the live site), and no shared multiplayer backend behind "The colony" — each browser tab runs its own local simulation. Nothing here fakes a connection to real infrastructure that doesn't exist; the simulation is architected so a real event source can be swapped in later without touching the logic underneath.

## Tech

- [Next.js](https://nextjs.org) 16 (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- Hand-written Canvas 2D / SVG animation — no game engine, no physics library
- Deployed on [Vercel](https://vercel.com)

## Running locally

```bash
npm install
npm run dev
