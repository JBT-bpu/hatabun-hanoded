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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const random = (min: number, max: number) => min + Math.random() * (max - min);

export default function EmberField({ lit }: { lit: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!lit || reducedMotion) return;

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const lowPower = Boolean(connection?.saveData);
    const maxParticles = lowPower ? 16 : coarsePointer ? 26 : 64;
    const ambientRate = lowPower ? 2 : coarsePointer ? 4 : 11;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = 1;
    let particles: Ember[] = [];
    let zones: DOMRect[] = [];
    let sources: HTMLElement[] = [];
    let geometryDirty = true;
    let lastFrame = performance.now();
    let lastScroll = window.scrollY;
    let scrollWind = 0;
    let ambientBudget = 0;
    let animationFrame = 0;
    let lastPointerSpark = 0;
    let pointer = { x: -1000, y: -1000, vx: 0, vy: 0, time: performance.now() };

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, coarsePointer ? 1 : 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      geometryDirty = true;
    }

    function refreshGeometry() {
      zones = Array.from(document.querySelectorAll<HTMLElement>("[data-ember-zone]"))
        .map((element) => element.getBoundingClientRect())
        .filter((rect) => rect.bottom > 0 && rect.top < height && rect.right > 0 && rect.left < width);
      sources = Array.from(document.querySelectorAll<HTMLElement>("[data-ember-source]"));
      geometryDirty = false;
    }

    function pointFrom(element: HTMLElement): Point {
      const rect = element.getBoundingClientRect();
      const xRatio = Number.parseFloat(element.dataset.emberX || "0.5");
      const yRatio = Number.parseFloat(element.dataset.emberY || "0.5");
      return {
        x: rect.left + rect.width * xRatio,
        y: rect.top + rect.height * yRatio,
      };
    }

    function activeSource(): HTMLElement | null {
      const visible = sources.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < height && rect.right > 0 && rect.left < width;
      });
      if (!visible.length) return null;
      return visible.sort((first, second) => {
        const a = first.getBoundingClientRect();
        const b = second.getBoundingClientRect();
        const aDistance = Math.abs(a.top + a.height / 2 - height / 2);
        const bDistance = Math.abs(b.top + b.height / 2 - height / 2);
        return aDistance - bDistance;
      })[0];
    }

    function addEmber(origin: Point, force = 1, burst = false) {
      if (particles.length >= maxParticles) particles.shift();
      const kindRoll = Math.random();
      const kind: Ember["kind"] = kindRoll < 0.72 ? 0 : kindRoll < 0.9 ? 1 : 2;
      const depth = random(0.48, 1);
      const direction = burst ? random(-Math.PI * 0.92, -Math.PI * 0.08) : random(-2.05, -1.08);
      const speed = random(burst ? 52 : 28, burst ? 164 : 92) * force * depth;
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

    function burstAt(origin: Point, count: number, force = 1) {
      const capped = Math.min(count, maxParticles);
      for (let index = 0; index < capped; index += 1) addEmber(origin, force, true);
    }

    function burstFrom(element: HTMLElement | null, count: number, force = 1) {
      if (!element) return;
      burstAt(pointFrom(element), count, force);
    }

    function onClick(event: MouseEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!target) return;
      const trigger = target.closest<HTMLElement>("[data-ember-burst]");
      if (trigger) {
        const isTurningOff = trigger.dataset.emberToggle === "true" && trigger.getAttribute("aria-pressed") === "true";
        if (isTurningOff) return;
        const selector = trigger.dataset.emberTarget;
        const source = selector ? document.querySelector<HTMLElement>(selector) : trigger;
        burstFrom(source, Number.parseInt(trigger.dataset.emberBurst || "16", 10), 1.06);
        return;
      }

      const zone = target.closest<HTMLElement>("[data-ember-zone]");
      if (zone && !target.closest("a, button, summary")) burstAt({ x: event.clientX, y: event.clientY }, 5, 0.72);
    }

    function onPointerMove(event: PointerEvent) {
      if (coarsePointer) return;
      const now = performance.now();
      const elapsed = Math.max(16, now - pointer.time);
      const vx = ((event.clientX - pointer.x) / elapsed) * 1000;
      const vy = ((event.clientY - pointer.y) / elapsed) * 1000;
      pointer = { x: event.clientX, y: event.clientY, vx, vy, time: now };

      const target = event.target instanceof HTMLElement ? event.target : null;
      const overFire = target?.closest("[data-ember-zone]");
      if (overFire && Math.hypot(vx, vy) > 850 && now - lastPointerSpark > 90 && particles.length < maxParticles) {
        addEmber({ x: event.clientX, y: event.clientY }, 0.56, false);
        lastPointerSpark = now;
      }
    }

    function onScroll() {
      const nextScroll = window.scrollY;
      scrollWind = clamp((nextScroll - lastScroll) * 0.22, -32, 32);
      lastScroll = nextScroll;
      geometryDirty = true;
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
      const dt = Math.min(0.032, Math.max(0.001, (now - lastFrame) / 1000));
      lastFrame = now;
      if (geometryDirty) refreshGeometry();

      const source = activeSource();
      ambientBudget += dt * ambientRate;
      while (source && ambientBudget >= 1 && particles.length < maxParticles) {
        addEmber(pointFrom(source), 0.64, false);
        ambientBudget -= 1;
      }

      pointer.vx *= 0.9;
      pointer.vy *= 0.9;
      scrollWind *= 0.92;

      particles = particles.filter((particle) => {
        particle.age += dt;
        if (particle.age >= particle.life) return false;

        const pointerDistance = Math.hypot(particle.x - pointer.x, particle.y - pointer.y);
        if (pointerDistance < 230) {
          const influence = 1 - pointerDistance / 230;
          particle.vx += pointer.vx * influence * 0.0009;
          particle.vy += pointer.vy * influence * 0.00035;
        }

        particle.vx += Math.sin(particle.phase + particle.age * 3.2) * 7 * dt + scrollWind * dt;
        particle.vy -= 3.2 * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        return particle.y > -40 && particle.x > -80 && particle.x < width + 80;
      });

      context.clearRect(0, 0, width, height);
      if (zones.length) {
        context.save();
        context.beginPath();
        zones.forEach((rect) => context.rect(rect.left, rect.top, rect.width, rect.height));
        context.clip();
        context.globalCompositeOperation = "lighter";
        particles.forEach(drawParticle);
        context.restore();
      }

      animationFrame = requestAnimationFrame(frame);
    }

    function onVisibilityChange() {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
      } else {
        lastFrame = performance.now();
        animationFrame = requestAnimationFrame(frame);
      }
    }

    resize();
    refreshGeometry();
    const entryTimer = window.setTimeout(() => {
      const heroSource = document.querySelector<HTMLElement>("[data-ember-source='hero']");
      burstFrom(heroSource, coarsePointer ? 18 : 36, 1.12);
    }, 240);

    const arrival = document.querySelector<HTMLElement>("[data-ember-arrival]");
    let arrivalPlayed = false;
    const arrivalObserver = arrival
      ? new IntersectionObserver((entries) => {
          if (!arrivalPlayed && entries.some((entry) => entry.isIntersecting)) {
            arrivalPlayed = true;
            burstFrom(arrival, coarsePointer ? 12 : 24, 0.92);
          }
        }, { threshold: 0.42 })
      : null;
    if (arrival && arrivalObserver) arrivalObserver.observe(arrival);

    document.addEventListener("click", onClick);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    animationFrame = requestAnimationFrame(frame);

    return () => {
      window.clearTimeout(entryTimer);
      cancelAnimationFrame(animationFrame);
      arrivalObserver?.disconnect();
      document.removeEventListener("click", onClick);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      context.clearRect(0, 0, width, height);
    };
  }, [lit]);

  return <canvas ref={canvasRef} className="ember-field" aria-hidden="true" />;
}
