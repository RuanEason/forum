"use client";

import { useEffect, useRef } from "react";

interface Particle {
  alpha: number;
  baseVx: number;
  baseVy: number;
  phase: number;
  radius: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

interface TopicParticleFieldProps {
  className?: string;
}

const MAX_LINK_DISTANCE = 104;
const POINTER_RADIUS = 132;

function createParticles(width: number, height: number): Particle[] {
  const count = Math.min(120, Math.max(36, Math.round((width * height) / 3600)));

  return Array.from({ length: count }, () => {
    const baseVx = (Math.random() - 0.5) * 0.18;
    const baseVy = (Math.random() - 0.5) * 0.1;

    return {
      alpha: 0.28 + Math.random() * 0.48,
      baseVx,
      baseVy,
      phase: Math.random() * Math.PI * 2,
      radius: 0.55 + Math.random() * 1.05,
      vx: baseVx,
      vy: baseVy,
      x: Math.random() * width,
      y: Math.random() * height,
    };
  });
}

export default function TopicParticleField({
  className,
}: TopicParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const canInteract = !reducedMotion && !coarsePointer;
    const computedStyle = getComputedStyle(canvas);
    const particleColor = computedStyle
      .getPropertyValue("--color-topic-ink")
      .trim();
    const particleLineColor = computedStyle
      .getPropertyValue("--color-topic-ink-soft")
      .trim();

    if (!particleColor || !particleLineColor) {
      return;
    }

    let width = 0;
    let height = 0;
    let devicePixelRatio = 1;
    let particles: Particle[] = [];
    let animationFrame = 0;
    let lastTimestamp = performance.now();
    let isVisible = true;
    let isPageVisible = document.visibilityState === "visible";
    const pointer = { active: false, x: 0, y: 0 };

    const draw = () => {
      if (!width || !height) {
        return;
      }

      context.clearRect(0, 0, width, height);
      context.lineWidth = 0.7;
      context.lineCap = "round";

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];

        for (let neighborIndex = index + 1; neighborIndex < particles.length; neighborIndex += 1) {
          const neighbor = particles[neighborIndex];
          const dx = particle.x - neighbor.x;
          const dy = particle.y - neighbor.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > MAX_LINK_DISTANCE) {
            continue;
          }

          context.globalAlpha = (1 - distance / MAX_LINK_DISTANCE) * 0.16;
          context.strokeStyle = particleLineColor;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(neighbor.x, neighbor.y);
          context.stroke();
        }
      }

      for (const particle of particles) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const pointerBoost =
          pointer.active && distance < POINTER_RADIUS
            ? (1 - distance / POINTER_RADIUS) * 0.48
            : 0;

        context.globalAlpha = Math.min(1, particle.alpha + pointerBoost);
        context.fillStyle = particleColor;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();

      width = rect.width;
      height = rect.height;
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      particles = createParticles(width, height);
      draw();
    };

    const updateParticles = (delta: number, timestamp: number) => {
      for (const particle of particles) {
        const current = timestamp * 0.00045;
        const flowX = Math.sin(current + particle.phase) * 0.0018;
        const flowY = Math.cos(current * 0.84 + particle.phase) * 0.0012;

        particle.vx += (particle.baseVx - particle.vx) * 0.012 * delta;
        particle.vy += (particle.baseVy - particle.vy) * 0.012 * delta;
        particle.vx += flowX * delta;
        particle.vy += flowY * delta;

        if (canInteract && pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0 && distance < POINTER_RADIUS) {
            const strength =
              Math.pow(1 - distance / POINTER_RADIUS, 2) * 0.075 * delta;
            particle.vx += (dx / distance) * strength;
            particle.vy += (dy / distance) * strength;
          }
        }

        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;

        if (particle.x < -12) particle.x = width + 12;
        if (particle.x > width + 12) particle.x = -12;
        if (particle.y < -12) particle.y = height + 12;
        if (particle.y > height + 12) particle.y = -12;
      }
    };

    const animate = (timestamp: number) => {
      animationFrame = 0;

      if (!isVisible || !isPageVisible) {
        return;
      }

      const delta = Math.min((timestamp - lastTimestamp) / 16.67, 2);
      lastTimestamp = timestamp;
      updateParticles(delta, timestamp);
      draw();
      animationFrame = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (!canInteract || !isVisible || !isPageVisible || animationFrame) {
        return;
      }

      lastTimestamp = performance.now();
      animationFrame = window.requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      if (!animationFrame) {
        return;
      }

      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!canInteract) {
        return;
      }

      pointer.active = true;
      pointer.x = event.offsetX;
      pointer.y = event.offsetY;
    };

    const clearPointer = () => {
      pointer.active = false;
    };

    const handleVisibilityChange = () => {
      isPageVisible = document.visibilityState === "visible";

      if (isPageVisible) {
        startAnimation();
      } else {
        stopAnimation();
      }
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;

      if (isVisible) {
        startAnimation();
      } else {
        stopAnimation();
      }
    });

    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    canvas.addEventListener("pointermove", handlePointerMove, { passive: true });
    canvas.addEventListener("pointerleave", clearPointer);
    window.addEventListener("blur", clearPointer);
    resizeCanvas();
    startAnimation();

    return () => {
      stopAnimation();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", clearPointer);
      window.removeEventListener("blur", clearPointer);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
