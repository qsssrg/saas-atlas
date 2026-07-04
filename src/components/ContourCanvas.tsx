"use client";

import { useEffect, useRef } from "react";

/**
 * Cartographic contour + graticule backdrop for the hero.
 * Static (no animation): a fixed-seed terrain drawn on a canvas that
 * redraws on resize and when the OS colour scheme changes.
 */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function draw(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  const host = canvas.parentElement;
  if (!ctx || !host) return;

  const dpr = window.devicePixelRatio || 1;
  const w = host.clientWidth;
  const h = host.clientHeight;
  if (w === 0 || h === 0) return;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const stroke =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--contour")
      .trim() || "#B4AECF";
  const rnd = mulberry32(1851); // fixed seed keeps the terrain stable

  // Graticule grid
  ctx.strokeStyle = stroke;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 1;
  for (let gx = 0; gx < w; gx += 120) {
    ctx.beginPath();
    ctx.moveTo(gx + 0.5, 0);
    ctx.lineTo(gx + 0.5, h);
    ctx.stroke();
  }
  for (let gy = 0; gy < h; gy += 120) {
    ctx.beginPath();
    ctx.moveTo(0, gy + 0.5);
    ctx.lineTo(w, gy + 0.5);
    ctx.stroke();
  }

  // Contour rings, centred toward the right of the hero
  const cx = w * 0.82;
  const cy = h * 0.42;
  const base: number[] = [];
  for (let k = 0; k < 14; k++) base.push(0.55 + rnd() * 0.9);
  for (let ring = 0; ring < 9; ring++) {
    const r0 = 60 + ring * 46;
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const th = (i / 64) * Math.PI * 2;
      let wob = 0;
      for (let k2 = 0; k2 < 4; k2++) {
        wob +=
          Math.sin(th * (k2 + 2) + base[k2] * 7 + ring * base[k2 + 4]) *
          (7 - k2);
      }
      const r = r0 + wob * (1 + ring * 0.22);
      const x = cx + Math.cos(th) * r * 1.25;
      const y = cy + Math.sin(th) * r * 0.85;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.42 - ring * 0.035;
    ctx.lineWidth = ring % 3 === 0 ? 1.5 : 1;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export default function ContourCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const render = () => draw(canvas);
    render();

    window.addEventListener("resize", render);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", render);

    return () => {
      window.removeEventListener("resize", render);
      media.removeEventListener("change", render);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
