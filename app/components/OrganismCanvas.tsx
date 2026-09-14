"use client";

import { useEffect, useRef } from "react";

type Particle = {
  u: number; // position along the curled body, 0 = tail, 1 = head
  v: number; // cross-section offset, -1..1
  phase: number; // flicker phase
  flickerSpeed: number;
  bright: boolean;
  size: number;
  baseAlpha: number;
};

type Star = {
  fx: number; // fractional position, so stars redistribute on resize
  fy: number;
  size: number;
  baseAlpha: number;
  phase: number;
  speed: number;
};

type Appendage = {
  uPos: number; // attachment point along the body, ventral side
  angleOffset: number;
  lengthFactor: number;
  curvature: number;
  phase: number;
  wiggleSpeed: number;
};

const PARTICLE_COUNT = 2748;
const LEG_COUNT = 9;
const STAR_COUNT = 220;

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Normalized body silhouette half-width at position u (0=tail tip, 1=head),
// peak = 1. A gentle periodic ripple gives the body a segmented, ringed
// look rather than a smooth featureless capsule.
function widthProfile(u: number) {
  const peak = 0.38;
  const headBase = 0.32;
  let w: number;
  if (u <= peak) {
    w = headBase + (1 - headBase) * smoothstep(0, 1, u / peak);
  } else {
    const t = (u - peak) / (1 - peak);
    w = Math.pow(Math.max(0, 1 - t), 1.6);
  }
  const segments = 7;
  const ripple = 1 + 0.12 * Math.cos(u * segments * Math.PI * 2);
  return w * ripple;
}

function generateParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    let u = 0;
    // rejection sampling so particle density follows the body's silhouette area
    for (let attempt = 0; attempt < 40; attempt++) {
      const candidate = Math.random();
      const wu = widthProfile(1 - candidate);
      if (Math.random() <= wu) {
        u = candidate;
        break;
      }
      u = candidate;
    }
    const bright = Math.random() < 0.14;
    particles.push({
      u,
      v: Math.random() * 2 - 1,
      phase: Math.random() * Math.PI * 2,
      flickerSpeed: 0.6 + Math.random() * (bright ? 3.2 : 1.6),
      bright,
      size: bright ? 1.4 + Math.random() * 1.4 : 0.7 + Math.random() * 1.1,
      baseAlpha: bright ? 0.65 + Math.random() * 0.35 : 0.25 + Math.random() * 0.4,
    });
  }
  return particles;
}

function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const bright = Math.random() < 0.12;
    stars.push({
      fx: Math.random(),
      fy: Math.random(),
      size: bright ? 1.2 + Math.random() * 1 : 0.5 + Math.random() * 0.6,
      baseAlpha: bright ? 0.4 + Math.random() * 0.3 : 0.12 + Math.random() * 0.18,
      phase: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.4,
    });
  }
  return stars;
}

function generateLegs(count: number): Appendage[] {
  const legs: Appendage[] = [];
  for (let i = 0; i < count; i++) {
    legs.push({
      uPos: 0.18 + (i / (count - 1)) * 0.62,
      angleOffset: (Math.random() - 0.5) * 0.5,
      lengthFactor: 0.8 + Math.random() * 0.6,
      curvature: 0.6 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      wiggleSpeed: 0.8 + Math.random() * 0.6,
    });
  }
  return legs;
}

function strandPoints(
  baseX: number,
  baseY: number,
  angle0: number,
  curvature: number,
  length: number,
  segments: number
) {
  const pts: { x: number; y: number }[] = [{ x: baseX, y: baseY }];
  let angle = angle0;
  let x = baseX;
  let y = baseY;
  const stepLen = length / segments;
  for (let i = 0; i < segments; i++) {
    angle += curvature / segments;
    x += Math.cos(angle) * stepLen;
    y += Math.sin(angle) * stepLen;
    pts.push({ x, y });
  }
  return pts;
}

export default function OrganismCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles = generateParticles(PARTICLE_COUNT);
    const legs = generateLegs(LEG_COUNT);
    const stars = generateStars(STAR_COUNT);

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // wandering swim state, in CSS pixel space
    let cx = 0;
    let cy = 0;
    let initialized = false;

    // burst-and-coast locomotion, the way small swimming crustaceans
    // actually move: a quick tail-flick accelerates them, then they coast
    // on inertia while the body relaxes, then they rest — rather than
    // cruising forever at a constant, perfectly periodic speed.
    type SwimState = "pause" | "burst" | "glide";
    let swimState: SwimState = "pause";
    let swimTimer = 1;
    let curSpeed = 0;
    let headingCur = Math.random() * Math.PI * 2;
    let headingTarget = headingCur;

    let rafId = 0;
    let lastTime = performance.now();
    const start = lastTime;

    function frame(now: number) {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const t = (now - start) / 1000;

      if (!initialized) {
        cx = width / 2;
        cy = height / 2;
        initialized = true;
      }

      const bodyLength = Math.min(width, height) * 0.42;
      const maxWidthPx = bodyLength * 0.27;
      const radius = bodyLength * 0.6;
      const margin = bodyLength * 0.75;

      // advance the burst / glide / pause cycle, each with its own
      // randomized duration so it never settles into an exact loop
      swimTimer -= dt;
      if (swimTimer <= 0) {
        if (swimState === "pause") {
          swimState = "burst";
          swimTimer = 0.45 + Math.random() * 0.35;
          headingTarget = headingCur + (Math.random() - 0.5) * 1.3;
        } else if (swimState === "burst") {
          swimState = "glide";
          swimTimer = 1.1 + Math.random() * 1.6;
        } else {
          swimState = "pause";
          swimTimer = 1.3 + Math.random() * 2.4;
        }
      }

      // curled, amphipod-like body: sharp power-stroke flexes during a
      // burst, a relaxed idle wobble while coasting or resting
      const arcSpan =
        swimState === "burst"
          ? 3.1 + 0.55 * Math.sin(t * 9)
          : swimState === "glide"
            ? 3.25 + 0.12 * Math.sin(t * 1.1)
            : 3.15 + 0.05 * Math.sin(t * 0.6);

      // inertia: quick to accelerate on a burst, slow to bleed off speed
      // while coasting, quick to settle to a stop at rest
      const speedTarget = swimState === "burst" ? bodyLength * 0.16 : 0;
      const speedRate = swimState === "burst" ? 3.5 : swimState === "glide" ? 0.7 : 2.2;
      curSpeed += (speedTarget - curSpeed) * Math.min(1, dt * speedRate);

      let headingDiff = headingTarget - headingCur;
      while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
      while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;
      headingCur += headingDiff * Math.min(1, dt * 1.3);

      const theta = headingCur;
      const thetaEff = theta - Math.PI / 2;

      cx += Math.cos(theta) * curSpeed * dt;
      cy += Math.sin(theta) * curSpeed * dt * 0.6;

      if (cx < -margin) cx = width + margin;
      if (cx > width + margin) cx = -margin;
      if (cy < -margin) cy = height + margin;
      if (cy > height + margin) cy = -margin;

      const cosT = Math.cos(thetaEff);
      const sinT = Math.sin(thetaEff);

      ctx!.fillStyle = "#000000";
      ctx!.fillRect(0, 0, width, height);

      // faint structural grid, tying the hero to the rest of the site's
      // instrument-panel aesthetic instead of leaving it as flat void
      ctx!.strokeStyle = "rgba(148,163,184,0.035)";
      ctx!.lineWidth = 1;
      const gridStep = 56;
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

      // ambient starfield so the tank reads as deep and inhabited rather
      // than empty black space around a single small shape
      for (const s of stars) {
        const sx = s.fx * width;
        const sy = s.fy * height;
        const flicker = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
        const alpha = s.baseAlpha * (0.4 + 0.6 * flicker);
        ctx!.fillStyle = `rgba(226,232,240,${alpha})`;
        ctx!.fillRect(sx, sy, s.size, s.size);
      }

      // centroid of the raw curl, so it rotates/translates about its own middle
      let centroidX = 0;
      let centroidY = 0;
      const centroidSamples = 12;
      for (let i = 0; i < centroidSamples; i++) {
        const u = i / (centroidSamples - 1);
        const angle = (u - 1) * arcSpan;
        centroidX += radius * Math.cos(angle);
        centroidY += radius * Math.sin(angle);
      }
      centroidX /= centroidSamples;
      centroidY /= centroidSamples;

      // world position at body parameter (u, v) — u: 0 tail -> 1 head,
      // v: -1..1 across the body's cross-section.
      function toWorld(u: number, v: number) {
        const angle = (u - 1) * arcSpan;
        const halfWidthAtU = widthProfile(u) * maxWidthPx;
        const r = radius + v * halfWidthAtU;
        const localX = r * Math.cos(angle) - centroidX;
        const localY = r * Math.sin(angle) - centroidY;
        return {
          x: cx + localX * cosT - localY * sinT,
          y: cy + localX * sinT + localY * cosT,
        };
      }
      // rotates a local-frame direction vector into world space (no translation)
      function rotateDir(dx: number, dy: number) {
        return { x: dx * cosT - dy * sinT, y: dx * sinT + dy * cosT };
      }

      for (const p of particles) {
        const { x: worldX, y: worldY } = toWorld(p.u, p.v);

        const flicker = 0.5 + 0.5 * Math.sin(t * p.flickerSpeed + p.phase);
        const alpha = Math.min(1, p.baseAlpha * (0.5 + flicker));

        ctx!.fillStyle = p.bright
          ? `rgba(255,244,214,${alpha})`
          : `rgba(196,163,102,${alpha})`;
        ctx!.fillRect(worldX, worldY, p.size, p.size);
      }

      // legs: short curved strands trailing from the ventral (inner) edge
      const legColor = "196,163,102";
      for (const leg of legs) {
        const base = toWorld(leg.uPos, -1);
        const localAngle = (leg.uPos - 1) * arcSpan;
        const inward = rotateDir(-Math.cos(localAngle), -Math.sin(localAngle));
        const baseAngle = Math.atan2(inward.y, inward.x) + leg.angleOffset;
        const wiggle = Math.sin(t * leg.wiggleSpeed + leg.phase) * 0.12;
        const legLen = maxWidthPx * leg.lengthFactor;
        const pts = strandPoints(
          base.x,
          base.y,
          baseAngle + wiggle,
          leg.curvature,
          legLen,
          4
        );
        ctx!.strokeStyle = `rgba(${legColor},0.28)`;
        ctx!.lineWidth = 0.6;
        ctx!.beginPath();
        pts.forEach((pt, i) => (i === 0 ? ctx!.moveTo(pt.x, pt.y) : ctx!.lineTo(pt.x, pt.y)));
        ctx!.stroke();
        pts.forEach((pt, i) => {
          if (i === 0) return;
          const fade = 1 - i / pts.length;
          ctx!.fillStyle = `rgba(${legColor},${0.35 * fade})`;
          ctx!.beginPath();
          ctx!.arc(pt.x, pt.y, 0.9 * fade, 0, Math.PI * 2);
          ctx!.fill();
        });
      }

      // head + antennae
      const head = toWorld(1, 0);
      const forwardAngle = theta;
      const antColor = "196,163,102";
      const antennaSpecs = [
        { angle: -0.3, len: bodyLength * 0.32, curve: -0.4, seg: 6 },
        { angle: 0.3, len: bodyLength * 0.32, curve: 0.4, seg: 6 },
        { angle: -0.65, len: bodyLength * 0.14, curve: -0.2, seg: 3 },
        { angle: 0.65, len: bodyLength * 0.14, curve: 0.2, seg: 3 },
      ];
      for (const spec of antennaSpecs) {
        const pts = strandPoints(
          head.x,
          head.y,
          forwardAngle + spec.angle,
          spec.curve,
          spec.len,
          spec.seg
        );
        ctx!.strokeStyle = `rgba(${antColor},0.45)`;
        ctx!.lineWidth = 0.7;
        ctx!.beginPath();
        pts.forEach((pt, i) => (i === 0 ? ctx!.moveTo(pt.x, pt.y) : ctx!.lineTo(pt.x, pt.y)));
        ctx!.stroke();
        pts.forEach((pt, i) => {
          const fade = 1 - i / pts.length;
          ctx!.fillStyle = `rgba(255,244,214,${0.5 * fade})`;
          ctx!.beginPath();
          ctx!.arc(pt.x, pt.y, 1 * fade + 0.3, 0, Math.PI * 2);
          ctx!.fill();
        });
      }

      // eye: a small ring of particles just behind the head tip
      const eyeCenter = toWorld(0.9, 0.4);
      const eyeR = bodyLength * 0.018;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        ctx!.fillStyle = "rgba(255,244,214,0.6)";
        ctx!.beginPath();
        ctx!.arc(eyeCenter.x + Math.cos(a) * eyeR, eyeCenter.y + Math.sin(a) * eyeR, 0.8, 0, Math.PI * 2);
        ctx!.fill();
      }

      // tail fan (uropods): several short strands fanning from the tail tip
      const tail = toWorld(0, 0);
      const backAngle = theta + Math.PI;
      const fanSpecs = [-0.55, -0.2, 0.2, 0.55];
      for (const off of fanSpecs) {
        const pts = strandPoints(
          tail.x,
          tail.y,
          backAngle + off,
          off * 0.3,
          bodyLength * 0.1,
          3
        );
        ctx!.strokeStyle = "rgba(196,163,102,0.4)";
        ctx!.lineWidth = 0.7;
        ctx!.beginPath();
        pts.forEach((pt, i) => (i === 0 ? ctx!.moveTo(pt.x, pt.y) : ctx!.lineTo(pt.x, pt.y)));
        ctx!.stroke();
      }

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
