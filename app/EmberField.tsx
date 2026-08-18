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
  kind: 0 | 1 | 2 | 3;
  color: string;
  zone: HTMLElement | null;
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
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = 1;
    let particles: Ember[] = [];
    let animationFrame = 0;
    let ignitionTimer = 0;
    let ambientTimer = 0;
    let lastFrame = 0;
    let lastScrollY = window.scrollY;
    let scrollDistance = 0;
    let lastScrollBurst = 0;
    let reducedMotion = reducedMotionQuery.matches;
    let pageHidden = document.hidden;
    let isLit = false;
    const visibleSources = new Set<HTMLElement>();
    const hoverCooldown = new WeakMap<HTMLElement, number>();
    const touchCooldown = new WeakMap<HTMLElement, number>();

    const particleCap = () => {
      const viewportCap = mobileQuery.matches ? 32 : 52;
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

    function zoneFor(element: HTMLElement | null) {
      return element?.closest<HTMLElement>("[data-ember-zone]") || null;
    }

    function zoneAt(point: Point) {
      const target = document.elementFromPoint(
        clamp(point.x, 0, Math.max(0, width - 1)),
        clamp(point.y, 0, Math.max(0, height - 1)),
      );
      return target?.closest<HTMLElement>("[data-ember-zone]") || null;
    }

    function addEmber(origin: Point, force: number, zone: HTMLElement | null = null) {
      const cap = particleCap();
      if (particles.length >= cap) particles.shift();

      const kindRoll = Math.random();
      const highHeat = force >= 1.1;
      const lowAmbient = force < 0.4;
      const kind: Ember["kind"] = highHeat
        ? kindRoll < 0.34 ? 0 : kindRoll < 0.56 ? 1 : kindRoll < 0.72 ? 2 : 3
        : lowAmbient
          ? kindRoll < 0.64 ? 0 : kindRoll < 0.9 ? 1 : 2
        : kindRoll < 0.52 ? 0 : kindRoll < 0.8 ? 1 : kindRoll < 0.9 ? 2 : 3;
      const depth = random(0.48, 1);
      const direction = random(-Math.PI * 0.92, -Math.PI * 0.08);
      const speed = random(kind === 3 ? 74 : 52, kind === 3 ? 190 : 164) * force * depth;

      particles.push({
        x: origin.x + random(-9, 9),
        y: origin.y + random(-7, 7),
        vx: Math.cos(direction) * speed + random(-12, 12),
        vy: Math.sin(direction) * speed - random(5, 22),
        age: 0,
        life: kind === 3
          ? random(0.82, 1.45)
          : random(kind === 2 ? 2.4 : 1.35, kind === 2 ? 4 : 3.15),
        size: random(kind === 2 ? 0.7 : kind === 3 ? 2.4 : 0.9, kind === 2 ? 1.6 : kind === 3 ? 4.8 : 2.7) * depth,
        phase: random(0, Math.PI * 2),
        depth,
        kind,
        color: kind === 2 ? "#f1e7d2" : kind === 3 ? "#fff1c8" : Math.random() > 0.38 ? "#ffb43e" : "#ff541b",
        zone,
      });
    }

    function startAnimation() {
      if (animationFrame || !particles.length || reducedMotion || pageHidden) return;
      lastFrame = performance.now();
      animationFrame = requestAnimationFrame(frame);
    }

    function burstAt(origin: Point, requestedCount: number, requestedIntensity = 1, zone: HTMLElement | null = null) {
      if (reducedMotion || pageHidden) return;

      const cap = particleCap();
      const count = clamp(Math.round(Number.isFinite(requestedCount) ? requestedCount : 16), 1, cap);
      const intensity = clamp(Number.isFinite(requestedIntensity) ? requestedIntensity : 1, 0.2, 2);
      for (let index = 0; index < count; index += 1) addEmber(origin, intensity, zone);
      startAnimation();
    }

    function burstFrom(element: HTMLElement | null, count: number, intensity = 1) {
      if (element) burstAt(pointFrom(element), count, intensity, zoneFor(element));
    }

    function nearestVisibleSource() {
      let closest: HTMLElement | null = null;
      let closestDistance = Number.POSITIVE_INFINITY;
      visibleSources.forEach((source) => {
        if (!source.isConnected) {
          visibleSources.delete(source);
          return;
        }
        const rect = source.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= height || rect.right <= 0 || rect.left >= width) return;
        const distance = Math.abs(rect.top + rect.height * 0.5 - height * 0.5);
        if (distance < closestDistance) {
          closest = source;
          closestDistance = distance;
        }
      });
      return closest;
    }

    function stopAmbient() {
      if (ambientTimer) window.clearTimeout(ambientTimer);
      ambientTimer = 0;
    }

    function scheduleAmbient() {
      stopAmbient();
      if (reducedMotion || pageHidden || connection?.saveData) return;
      const delay = isLit
        ? mobileQuery.matches ? random(820, 1320) : random(780, 1240)
        : mobileQuery.matches ? random(1250, 1950) : random(1350, 2150);
      ambientTimer = window.setTimeout(runAmbient, delay);
    }

    function runAmbient() {
      ambientTimer = 0;
      const source = nearestVisibleSource();
      if (source && !reducedMotion && !pageHidden) {
        burstFrom(
          source,
          isLit ? mobileQuery.matches ? 4 : 4 : mobileQuery.matches ? 2 : 1,
          isLit ? mobileQuery.matches ? 0.54 : 0.53 : mobileQuery.matches ? 0.37 : 0.29,
        );
      }
      scheduleAmbient();
    }

    function drawParticle(particle: Ember) {
      if (particle.zone) {
        if (!particle.zone.isConnected) return;
        const rect = particle.zone.getBoundingClientRect();
        const clipLeft = Math.max(0, rect.left);
        const clipRight = Math.min(width, rect.right);
        const clipTop = Math.max(0, rect.top);
        const clipBottom = Math.min(height, rect.bottom);
        if (clipRight <= clipLeft || clipBottom <= clipTop) return;
        context.save();
        context.beginPath();
        context.rect(clipLeft, clipTop, clipRight - clipLeft, clipBottom - clipTop);
        context.clip();
      }

      const fadeIn = clamp(particle.age / 0.16, 0, 1);
      const fadeOut = Math.pow(clamp(1 - particle.age / particle.life, 0, 1), 1.32);
      context.globalAlpha = fadeIn * fadeOut * particle.depth * (particle.kind === 2 ? 0.42 : 0.92);
      context.shadowColor = particle.color;
      context.shadowBlur = particle.kind === 2 ? 0 : particle.kind === 3 ? 4 * particle.depth : 1.5 * particle.depth;

      if (particle.kind === 1) {
        context.strokeStyle = particle.color;
        context.lineWidth = Math.max(0.7, particle.size * 0.72);
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(particle.x - particle.vx * 0.035, particle.y - particle.vy * 0.035);
        context.stroke();
        if (particle.zone) context.restore();
        return;
      }

      if (particle.kind === 3) {
        context.fillStyle = particle.color;
        context.shadowBlur = 5 * particle.depth;
        context.beginPath();
        context.ellipse(
          particle.x,
          particle.y,
          Math.max(0.8, particle.size * 0.52),
          particle.size * 2.35,
          Math.atan2(particle.vy, particle.vx) - Math.PI / 2,
          0,
          Math.PI * 2,
        );
        context.fill();
        if (particle.zone) context.restore();
        return;
      }

      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
      if (particle.zone) context.restore();
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

      const recentTouchBurst = performance.now() - (touchCooldown.get(trigger) || 0) < 620;
      if ((mobileQuery.matches || coarsePointerQuery.matches) && recentTouchBurst) return;

      const toggle = trigger.dataset.emberToggle === "true";
      const isTurningOff = toggle && trigger.getAttribute("aria-pressed") === "true";
      const isTurningOn = toggle && !isTurningOff;
      if (isTurningOff || (!isLit && !isTurningOn)) return;

      const parsedCount = Number.parseInt(trigger.dataset.emberBurst || "16", 10);
      const parsedIntensity = Number.parseFloat(trigger.dataset.emberIntensity || "1.06");
      const source = findElement(trigger.dataset.emberTarget) || trigger;
      burstFrom(source, parsedCount, parsedIntensity);
    }

    function onPointerDown(event: PointerEvent) {
      const isTouchLike = event.pointerType === "touch" || event.pointerType === "pen" || coarsePointerQuery.matches;
      if (!event.isPrimary || !isTouchLike || !isLit || reducedMotion || pageHidden) return;

      const target = event.target instanceof Element ? event.target : null;
      const trigger = target?.closest<HTMLElement>("[data-ember-burst]");
      if (!trigger) return;

      const parsedCount = Number.parseInt(trigger.dataset.emberBurst || "16", 10);
      const parsedIntensity = Number.parseFloat(trigger.dataset.emberIntensity || "1.06");
      const touchCount = Math.max(10, Math.min(22, Math.round(parsedCount * 0.58)));
      const specifiedSource = findElement(trigger.dataset.emberTarget);
      const origin = specifiedSource
        ? pointFrom(specifiedSource)
        : { x: event.clientX, y: event.clientY };

      touchCooldown.set(trigger, performance.now());
      burstAt(origin, touchCount, Math.min(0.94, parsedIntensity * 0.82));
    }

    let trailDistance = 0;
    let trailLast: Point | null = null;

    function onTrailMove(event: PointerEvent) {
      if (!isLit || reducedMotion || pageHidden) return;
      if (event.pointerType !== "mouse" || coarsePointerQuery.matches) return;
      const point = { x: event.clientX, y: event.clientY };
      if (trailLast) {
        trailDistance += Math.hypot(point.x - trailLast.x, point.y - trailLast.y);
        if (trailDistance >= 120) {
          trailDistance = 0;
          const zone = zoneAt(point);
          if (zone) addEmber(point, 0.3, zone);
          startAnimation();
        }
      }
      trailLast = point;
    }

    function onScroll() {
      const currentScrollY = window.scrollY;
      const delta = Math.min(140, Math.abs(currentScrollY - lastScrollY));
      lastScrollY = currentScrollY;
      if (reducedMotion || pageHidden || connection?.saveData || delta < 1) return;

      scrollDistance += delta;
      const threshold = mobileQuery.matches ? 185 : 165;
      const now = performance.now();
      if (scrollDistance < threshold || now - lastScrollBurst < (mobileQuery.matches ? 440 : 320)) return;

      scrollDistance = 0;
      lastScrollBurst = now;
      const source = nearestVisibleSource();
      if (!source) return;
      burstFrom(
        source,
        isLit ? mobileQuery.matches ? 3 : 4 : mobileQuery.matches ? 2 : 2,
        isLit ? mobileQuery.matches ? 0.48 : 0.42 : mobileQuery.matches ? 0.34 : 0.27,
      );
    }

    function onPointerOver(event: PointerEvent) {
      if (!isLit || reducedMotion || pageHidden || mobileQuery.matches) return;
      const target = event.target instanceof Element ? event.target : null;
      const trigger = target?.closest<HTMLElement>("[data-ember-burst]");
      if (!trigger) return;

      const relatedTarget = event.relatedTarget;
      if (relatedTarget instanceof Node && trigger.contains(relatedTarget)) return;
      const now = performance.now();
      if (now - (hoverCooldown.get(trigger) || 0) < 760) return;
      hoverCooldown.set(trigger, now);

      const parsedCount = Number.parseInt(trigger.dataset.emberBurst || "16", 10);
      const parsedIntensity = Number.parseFloat(trigger.dataset.emberIntensity || "1.06");
      const hoverCount = Math.max(6, Math.min(12, Math.round(parsedCount * 0.34)));
      const source = findElement(trigger.dataset.emberTarget) || trigger;
      burstFrom(source, hoverCount, Math.min(0.78, parsedIntensity * 0.68));
    }

    function onFireBurst(event: Event) {
      const detail = (event as CustomEvent<FireBurstDetail>).detail || {};
      const hasCoordinates = Number.isFinite(detail.x) && Number.isFinite(detail.y);
      const selectedSource = detail.selector ? findElement(detail.selector) : null;
      const origin = hasCoordinates
        ? { x: detail.x as number, y: detail.y as number }
        : selectedSource
          ? pointFrom(selectedSource)
          : { x: width / 2, y: height / 2 };
      burstAt(origin, detail.count ?? 16, detail.intensity ?? 1, zoneFor(selectedSource) || zoneAt(origin));
    }

    function onVisibilityChange() {
      pageHidden = document.hidden;
      if (pageHidden) {
        stopAmbient();
        stopAndClear();
      } else {
        scheduleAmbient();
      }
    }

    function onReducedMotionChange(event: MediaQueryListEvent) {
      reducedMotion = event.matches;
      if (reducedMotion) {
        stopAmbient();
        stopAndClear();
      } else {
        scheduleAmbient();
      }
    }

    function scheduleIgnitionBurst() {
      window.clearTimeout(ignitionTimer);
      ignitionTimer = window.setTimeout(() => {
        if (!isLit) return;
        const heroSource = document.querySelector<HTMLElement>("[data-ember-source='hero']");
        burstFrom(heroSource, mobileQuery.matches ? 38 : 56, 1.16);
      }, 180);
    }

    const emberSources = Array.from(document.querySelectorAll<HTMLElement>("[data-ember-source]"));
    const ambientObserver = typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const source = entry.target as HTMLElement;
            if (entry.isIntersecting) {
              const isNewlyVisible = !visibleSources.has(source);
              visibleSources.add(source);
              if (isNewlyVisible && !reducedMotion && !pageHidden && !connection?.saveData) {
                burstFrom(
                  source,
                  isLit ? mobileQuery.matches ? 4 : 6 : mobileQuery.matches ? 3 : 2,
                  isLit ? mobileQuery.matches ? 0.54 : 0.48 : mobileQuery.matches ? 0.38 : 0.3,
                );
              }
            } else visibleSources.delete(source);
          });
        }, { threshold: 0.04 })
      : null;
    if (ambientObserver) emberSources.forEach((source) => ambientObserver.observe(source));
    else emberSources.forEach((source) => visibleSources.add(source));

    controllerRef.current = {
      setLit(nextLit) {
        if (nextLit === isLit) return;
        isLit = nextLit;
        window.clearTimeout(ignitionTimer);
        if (isLit) {
          scheduleIgnitionBurst();
          scheduleAmbient();
        } else {
          stopAmbient();
          stopAndClear();
          scheduleAmbient();
        }
      },
    };

    resize();
    scheduleAmbient();
    document.addEventListener("click", onClick);
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("pointermove", onTrailMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("fire:burst", onFireBurst);
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotionQuery.addEventListener("change", onReducedMotionChange);

    return () => {
      window.clearTimeout(ignitionTimer);
      stopAmbient();
      stopAndClear();
      controllerRef.current = null;
      ambientObserver?.disconnect();
      visibleSources.clear();
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointermove", onTrailMove);
      window.removeEventListener("scroll", onScroll);
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
