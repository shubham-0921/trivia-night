"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export interface ConfettiHandle {
  fire: () => void;
}

const COLORS = ["#6C4CF1", "#FF9F1C", "#12B76A", "#4C6BFF", "#C74FE0"];

export const Confetti = forwardRef<ConfettiHandle>(function Confetti(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    fire() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pieces = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        vy: 2 + Math.random() * 3,
        vx: -1 + Math.random() * 2,
        size: 4 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot: Math.random() * 360,
        vr: -6 + Math.random() * 12,
      }));

      const start = performance.now();
      const frame = (now: number) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const elapsed = now - start;
        pieces.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vr;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        });
        if (elapsed < 2600) requestAnimationFrame(frame);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
      };
      requestAnimationFrame(frame);
    },
  }));

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" />;
});
