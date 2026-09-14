"use client";

import { useEffect, useRef } from "react";

type Star = {
  fx: number; // fractional position, so stars redistribute on resize
  fy: number;
  size: number;
  baseAlpha: number;
  phase: number;
  speed: number;
};

const STAR_COUNT = 220;

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

// The hero's ambient backdrop: a faint instrument-panel grid plus a slowly
// twinkling starfield, so the tank reads as deep and inhabited rather than
// flat black space around the (separately rendered) organism artwork.
export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

    let rafId = 0;
    const start = performance.now();

    function frame(now: number) {
      const t = (now - start) / 1000;

      ctx!.fillStyle = "#000000";
      ctx!.fillRect(0, 0, width, height);

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

      for (const s of stars) {
        const sx = s.fx * width;
        const sy = s.fy * height;
        const flicker = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
        const alpha = s.baseAlpha * (0.4 + 0.6 * flicker);
        ctx!.fillStyle = `rgba(226,232,240,${alpha})`;
        ctx!.fillRect(sx, sy, s.size, s.size);
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
