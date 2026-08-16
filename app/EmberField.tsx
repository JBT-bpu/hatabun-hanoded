"use client";

import { useEffect, useRef } from "react";

type Ember = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  phase: number;
  depth: number;
  kind: 0 | 1 | 2;
  color: string;
};

type Point = { x: number; y: number };

type FireBurstDetail = {
  selector?: string;
  count?: number;
  intensity?: number;
  x?: number;
  y?: number;
};

type EmberController = {
  setLit: (nextLit: boolean) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const random = (min: number, max: number) => min + Math.random() * (max - min);

export default function EmberField({ lit }: { lit: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<EmberController | null>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const contextResult = canvasElement.getContext("2d");
    if (!contextResult) return;
    const canvas: HTMLCanvasElement = canvasElement;
    const context: CanvasRenderingContext2D = contextResult;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = 1;
    let particles: Ember[] = [];
    let animationFrame = 0;
    let ignitionTimer = 0;
    let lastFrame = 0;
    let reducedMotion = reducedMotionQuery.matches;
    let pageHidden = document.hidden;
    let isLit = false;

    const particleCap = () => {
      const viewportCap = mobileQuery.matches ? 18 : 42;
      return connection?.saveData ? Math.min(viewportCap, 12) : viewportCap;
    };

    function clearCanvas() {
      context.clearRect(0, 0, width, height);
    }

    function stopAndClear() {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      particles = [];
      clearCanvas();
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, mobileQuery.matches ? 1 : 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cap = particleCap();
      if (particles.length > cap) particles = particles.slice(-cap);
    }

    function pointFrom(element: HTMLElement): Point {
      const rect = element.getBoundingClientRect();
      const parsedX = Number.parseFloat(element.dataset.emberX || "0.5");
      const parsedY = Number.parseFloat(element.dataset.emberY || "0.5");
      const xRatio = Number.isFinite(parsedX) ? clamp(parsedX, 0, 1) : 0.5;
      const yRatio = Number.isFinite(parsedY) ? clamp(parsedY, 0, 1) : 0.5;
      return {
        x: rect.left + rect.width * xRatio,
        y: rect.top + rect.height * yRatio,
      };
    }

    function findElement(selector?: string) {
      if (!selector) return null;
      try {
        return document.querySelector<HTMLElement>(selector);
      } catch {
        return null;
      }
    }

    function addEmber(origin: Point, force: number) {
      const cap = particleCap();
      if (particles.length >= cap) particles.shift();

      const kindRoll = Math.random();
      const kind: Ember["kind"] = kindRoll < 0.72 ? 0 : kindRoll < 0.9 ? 1 : 2;
      const depth = random(0.48, 1);
      const direction = random(-Math.PI * 0.92, -Math.PI * 0.08);
      const speed = random(52, 164) * force * depth;

      particles.push({
        x: origin.x + random(-9, 9),
        y: origin.y + random(-7, 7),
        vx: Math.cos(direction) * speed + random(-12, 12),
        vy: Math.sin(direction) * speed - random(5, 22),
        age: 0,
        life: random(kind === 2 ? 2.4 : 1.35, kind === 2 ? 4 : 3.15),
        size: random(kind === 2 ? 0.7 : 0.9, kind === 2 ? 1.6 : 2.7) * depth,
        phase: random(0, Math.PI * 2),
        depth,
        kind,
        color: kind === 2 ? "#f1e7d2" : Math.random() > 0.38 ? "#ffb43e" : "#ff541b",
      });
    }

    function startAnimation() {
      if (animationFrame || !particles.length || reducedMotion || pageHidden) return;
      lastFrame = performance.now();
      animationFrame = requestAnimationFrame(frame);
    }

    function burstAt(origin: Point, requestedCount: number, requestedIntensity = 1) {
      if (reducedMotion || pageHidden) return;

      const cap = particleCap();
      const count = clamp(Math.round(Number.isFinite(requestedCount) ? requestedCount : 16), 1, cap);
      const intensity = clamp(Number.isFinite(requestedIntensity) ? requestedIntensity : 1, 0.2, 2);
      for (let index = 0; index < count; index += 1) addEmber(origin, intensity);
      startAnimation();
    }

    function burstFrom(element: HTMLElement | null, count: number, intensity = 1) {
      if (element) burstAt(pointFrom(element), count, intensity);
    }

    function drawParticle(particle: Ember) {
      const fadeIn = clamp(particle.age / 0.16, 0, 1);
      const fadeOut = Math.pow(clamp(1 - particle.age / particle.life, 0, 1), 1.32);
      context.globalAlpha = fadeIn * fadeOut * particle.depth * (particle.kind === 2 ? 0.42 : 0.92);
      context.shadowColor = particle.color;
      context.shadowBlur = particle.kind === 2 ? 0 : 5 * particle.depth;

      if (particle.kind === 1) {
        context.strokeStyle = particle.color;
        context.lineWidth = Math.max(0.7, particle.size * 0.72);
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(particle.x - particle.vx * 0.035, particle.y - particle.vy * 0.035);
        context.stroke();
        return;
      }

      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    }

    function frame(now: number) {
      animationFrame = 0;
      if (reducedMotion || pageHidden) {
        stopAndClear();
        return;
      }

      const dt = Math.min(0.032, Math.max(0.001, (now - lastFrame) / 1000));
      lastFrame = now;
      particles = particles.filter((particle) => {
        particle.age += dt;
        if (particle.age >= particle.life) return false;

        particle.vx += Math.sin(particle.phase + particle.age * 3.2) * 7 * dt;
        particle.vy -= 3.2 * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        return particle.y > -40 && particle.x > -80 && particle.x < width + 80;
      });

      clearCanvas();
      if (particles.length) {
        context.save();
        context.globalCompositeOperation = "lighter";
        particles.forEach(drawParticle);
        context.restore();
        animationFrame = requestAnimationFrame(frame);
      }
    }

    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const trigger = target?.closest<HTMLElement>("[data-ember-burst]");
      if (!trigger) return;

      const toggle = trigger.dataset.emberToggle === "true";
      const isTurningOff = toggle && trigger.getAttribute("aria-pressed") === "true";
      const isTurningOn = toggle && !isTurningOff;
      if (isTurningOff || (!isLit && !isTurningOn)) return;

      const parsedCount = Number.parseInt(trigger.dataset.emberBurst || "16", 10);
      const parsedIntensity = Number.parseFloat(trigger.dataset.emberIntensity || "1.06");
      const source = findElement(trigger.dataset.emberTarget) || trigger;
      burstFrom(source, parsedCount, parsedIntensity);
    }

    function onFireBurst(event: Event) {
      const detail = (event as CustomEvent<FireBurstDetail>).detail || {};
      const hasCoordinates = Number.isFinite(detail.x) && Number.isFinite(detail.y);
      const origin = hasCoordinates
        ? { x: detail.x as number, y: detail.y as number }
        : detail.selector
          ? pointFrom(findElement(detail.selector) || canvas)
          : { x: width / 2, y: height / 2 };
      burstAt(origin, detail.count ?? 16, detail.intensity ?? 1);
    }

    function onVisibilityChange() {
      pageHidden = document.hidden;
      if (pageHidden) stopAndClear();
    }

    function onReducedMotionChange(event: MediaQueryListEvent) {
      reducedMotion = event.matches;
      if (reducedMotion) stopAndClear();
    }

    function scheduleIgnitionBurst() {
      window.clearTimeout(ignitionTimer);
      ignitionTimer = window.setTimeout(() => {
        if (!isLit) return;
        const heroSource = document.querySelector<HTMLElement>("[data-ember-source='hero']");
        burstFrom(heroSource, mobileQuery.matches ? 16 : 30, 1.12);
      }, 180);
    }

    controllerRef.current = {
      setLit(nextLit) {
        if (nextLit === isLit) return;
        isLit = nextLit;
        window.clearTimeout(ignitionTimer);
        if (isLit) scheduleIgnitionBurst();
        else stopAndClear();
      },
    };

    resize();
    document.addEventListener("click", onClick);
    window.addEventListener("fire:burst", onFireBurst);
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotionQuery.addEventListener("change", onReducedMotionChange);

    return () => {
      window.clearTimeout(ignitionTimer);
      stopAndClear();
      controllerRef.current = null;
      document.removeEventListener("click", onClick);
      window.removeEventListener("fire:burst", onFireBurst);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setLit(lit);
  }, [lit]);

  return <canvas ref={canvasRef} className="ember-field" aria-hidden="true" />;
}
