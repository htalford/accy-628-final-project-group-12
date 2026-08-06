"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

type Rocket = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  color: string;
  exploded: boolean;
};

const COLORS = [
  "#F59E0B",
  "#EF4444",
  "#22C55E",
  "#3B82F6",
  "#A855F7",
  "#EC4899",
  "#FBBF24",
  "#67E8F9",
];

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)]!;
}

/**
 * Full-viewport fireworks rendered behind celebratory dialogs.
 * Lightweight canvas loop; paused when inactive.
 */
export function FireworksBackdrop({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const rockets: Rocket[] = [];
    const particles: Particle[] = [];
    let spawnTimer = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const explode = (x: number, y: number, color: string) => {
      const count = 28 + Math.floor(Math.random() * 20);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const speed = 1.4 + Math.random() * 3.2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 0.7 + Math.random() * 0.7,
          color: Math.random() > 0.35 ? color : randomColor(),
          size: 1.5 + Math.random() * 2.2,
        });
      }
    };

    const spawnRocket = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      rockets.push({
        x: w * (0.12 + Math.random() * 0.76),
        y: h + 8,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(5.5 + Math.random() * 3.5),
        targetY: h * (0.18 + Math.random() * 0.35),
        color: randomColor(),
        exploded: false,
      });
    };

    const draw = () => {
      if (!running) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      spawnTimer -= 1;
      if (spawnTimer <= 0 && rockets.length < 5) {
        spawnRocket();
        spawnTimer = 18 + Math.floor(Math.random() * 28);
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]!;
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.035;

        ctx.beginPath();
        ctx.fillStyle = r.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = r.color;
        ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (!r.exploded && (r.y <= r.targetY || r.vy >= -0.4)) {
          r.exploded = true;
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
        } else if (r.y > h + 40) {
          rockets.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.vx *= 0.99;
        p.life -= 0.016;
        const t = Math.max(0, p.life / p.maxLife);

        ctx.globalAlpha = t;
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        if (p.life <= 0) particles.splice(i, 1);
      }

      raf = window.requestAnimationFrame(draw);
    };

    resize();
    spawnRocket();
    spawnRocket();
    spawnTimer = 12;
    raf = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
    />
  );
}
