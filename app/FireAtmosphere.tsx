"use client";

import { useEffect, useRef } from "react";

export type FireProfile = "hero" | "story" | "builder" | "events" | "faq" | "final";

type FireBurstDetail = {
  profile: FireProfile;
  count?: number;
  intensity?: number;
};

type ParticleKind = "ember" | "streak" | "ash" | "debris";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  alpha: number;
  phase: number;
  angle: number;
  spin: number;
  aspect: number;
  color: string;
  kind: ParticleKind;
};

type ProfileConfig = {
  ambient: readonly [number, number];
  interval: readonly [number, number];
  entry: readonly [number, number];
  force: number;
  debris: number;
  wind?: boolean;
  staticOnly?: boolean;
};

type Pocket = {
  element: HTMLElement;
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
  profile: FireProfile;
  config: ProfileConfig;
  particles: Particle[];
  width: number;
  height: number;
  active: boolean;
  entered: boolean;
  nextAmbient: number;
  flashTimer: number;
};

type FireController = {
  setLit: (lit: boolean) => void;
};

export const DESKTOP_PARTICLE_CAP = 36;
export const MOBILE_PARTICLE_CAP = 20;
export const SCROLL_SPEED_THRESHOLD = 650;
export const SCROLL_BOOST_COOLDOWN = 900;

const PROFILE_CONFIG: Record<FireProfile, ProfileConfig> = {
  hero: { ambient: [2, 4], interval: [2400, 3600], entry: [4, 6], force: 0.72, debris: 0.26 },
  story: { ambient: [1, 3], interval: [3000, 4500], entry: [4, 6], force: 0.58, debris: 0.18 },
  builder: { ambient: [0, 0], interval: [4200, 5200], entry: [1, 2], force: 0.42, debris: 0.34 },
  events: { ambient: [1, 3], interval: [3200, 4600], entry: [4, 6], force: 0.5, debris: 0.14, wind: true },
  faq: { ambient: [0, 0], interval: [5000, 6000], entry: [0, 0], force: 0, debris: 0, staticOnly: true },
  final: { ambient: [2, 4], interval: [2400, 3600], entry: [0, 0], force: 0.72, debris: 0.3 },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const random = (min: number, max: number) => min + Math.random() * (max - min);
const randomCount = ([min, max]: readonly [number, number]) => Math.round(random(min, max));

export default function FireAtmosphere({ lit }: { lit: boolean }) {
  const controllerRef = useRef<FireController | null>(null);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const saveData = Boolean(connection?.saveData);
    let reducedMotion = reducedMotionQuery.matches;
    let isLit = false;
    let pageHidden = document.hidden;
    let animationFrame = 0;
    let lastPaint = 0;
    let ambientTimer = 0;
    let lastScrollY = window.scrollY;
    let lastScrollAt = performance.now();
    let lastScrollBoost = 0;

    const pocketElements = Array.from(document.querySelectorAll<HTMLElement>("[data-fire-pocket][data-fire-profile]"));
    const pockets: Pocket[] = pocketElements.flatMap((element) => {
      const profile = element.dataset.fireProfile as FireProfile;
      const config = PROFILE_CONFIG[profile];
      if (!config) return [];

      element.dataset.lit = "false";
      element.dataset.static = reducedMotion || saveData ? "true" : "false";
      let canvas: HTMLCanvasElement | null = null;
      let context: CanvasRenderingContext2D | null = null;
      if (!config.staticOnly) {
        canvas = document.createElement("canvas");
        canvas.className = "fire-pocket__canvas";
        canvas.setAttribute("aria-hidden", "true");
        context = canvas.getContext("2d");
        element.appendChild(canvas);
      }

      return [{
        element,
        canvas,
        context,
        profile,
        config,
        particles: [],
        width: 1,
        height: 1,
        active: false,
        entered: false,
        nextAmbient: performance.now() + random(...config.interval),
        flashTimer: 0,
      }];
    });

    const particleCap = () => mobileQuery.matches ? MOBILE_PARTICLE_CAP : DESKTOP_PARTICLE_CAP;
    const frameInterval = () => 1000 / (mobileQuery.matches ? 30 : 45);
    const totalParticles = () => pockets.reduce((sum, pocket) => sum + pocket.particles.length, 0);

    function resizePocket(pocket: Pocket) {
      if (!pocket.canvas || !pocket.context) return;
      const rect = pocket.element.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, mobileQuery.matches ? 1 : 1.5);
      pocket.width = width;
      pocket.height = height;
      pocket.canvas.width = Math.round(width * dpr);
      pocket.canvas.height = Math.round(height * dpr);
      pocket.canvas.style.width = `${width}px`;
      pocket.canvas.style.height = `${height}px`;
      pocket.context.setTransform(dpr, 0, 0, dpr, 0, 0);
      pocket.particles = pocket.particles.filter((particle) => particle.x <= width && particle.y <= height);
    }

    function resizeAll() {
      pockets.forEach(resizePocket);
    }

    function visiblePockets() {
      return pockets
        .filter((pocket) => pocket.active && !pocket.config.staticOnly)
        .sort((a, b) => {
          const aRect = a.element.getBoundingClientRect();
          const bRect = b.element.getBoundingClientRect();
          return Math.abs(aRect.top + aRect.height / 2 - window.innerHeight / 2)
            - Math.abs(bRect.top + bRect.height / 2 - window.innerHeight / 2);
        })
        .slice(0, 2);
    }

    function trimForCapacity(requested: number) {
      let available = particleCap() - totalParticles();
      if (available >= requested) return requested;
      while (available < requested) {
        const fullest = pockets.reduce<Pocket | null>((best, pocket) => (
          !best || pocket.particles.length > best.particles.length ? pocket : best
        ), null);
        if (!fullest?.particles.length) break;
        fullest.particles.shift();
        available += 1;
      }
      return Math.max(0, Math.min(requested, available));
    }

    function addParticle(pocket: Pocket, force: number, burstIntensity: number) {
      const wind = Boolean(pocket.config.wind);
      const heat = isLit ? 1 : 0.74;
      const kindRoll = Math.random();
      const debrisChance = clamp(
        pocket.config.debris + (burstIntensity >= 0.9 ? 0.12 : -0.08),
        0,
        0.44,
      );
      const kind: ParticleKind = kindRoll < debrisChance
        ? "debris"
        : wind
          ? kindRoll < debrisChance + 0.46 ? "ash" : kindRoll < debrisChance + 0.7 ? "ember" : "streak"
          : kindRoll < debrisChance + 0.4 ? "ember" : kindRoll < debrisChance + 0.68 ? "streak" : "ash";
      const depth = random(0.58, 1);
      const x = wind
        ? pocket.width * random(0.08, 0.24)
        : pocket.width * random(0.38, 0.62);
      const y = wind
        ? pocket.height * random(0.58, 0.82)
        : pocket.height * random(0.68, 0.88);

      pocket.particles.push({
        x,
        y,
        vx: wind
          ? random(26, 74) * force * depth
          : random(kind === "debris" ? -58 : -34, kind === "debris" ? 58 : 34) * force * depth,
        vy: wind
          ? random(-34, -8) * force * depth
          : random(kind === "debris" ? -132 : -112, kind === "debris" ? -72 : -54) * force * depth,
        age: 0,
        life: random(
          kind === "ash" ? 1.2 : kind === "debris" ? 0.9 : 0.8,
          kind === "ash" ? 1.8 : kind === "debris" ? 1.45 : 1.55,
        ),
        size: random(
          kind === "debris" ? 2.8 : kind === "streak" ? 1.4 : kind === "ash" ? 0.9 : 1,
          kind === "debris" ? 5.8 : kind === "streak" ? 3 : kind === "ash" ? 2.4 : 2.8,
        ) * depth,
        alpha: random(
          kind === "ash" ? 0.32 : kind === "debris" ? 0.72 : 0.66,
          kind === "ash" ? 0.58 : 1,
        ) * heat,
        phase: random(0, Math.PI * 2),
        angle: random(0, Math.PI * 2),
        spin: random(-7.5, 7.5),
        aspect: random(0.62, 1.48),
        color: kind === "ash"
          ? "#d8c4a4"
          : kind === "debris"
            ? Math.random() > 0.5 ? "#ff8a24" : "#ff4d18"
            : Math.random() > 0.42 ? "#ffb43e" : "#ff541b",
        kind,
      });
    }

    function startAnimation() {
      if (animationFrame || reducedMotion || saveData || pageHidden || !totalParticles()) return;
      lastPaint = performance.now();
      animationFrame = requestAnimationFrame(frame);
    }

    function flashPocket(pocket: Pocket) {
      window.clearTimeout(pocket.flashTimer);
      pocket.element.classList.remove("is-fire-flashing");
      void pocket.element.offsetWidth;
      pocket.element.classList.add("is-fire-flashing");
      pocket.flashTimer = window.setTimeout(() => pocket.element.classList.remove("is-fire-flashing"), 620);
    }

    function burstPocket(pocket: Pocket, requestedCount: number, requestedIntensity = 1) {
      if (!pocket.canvas || !pocket.context || pageHidden) return;
      flashPocket(pocket);
      if (reducedMotion || saveData) return;
      const count = trimForCapacity(clamp(Math.round(requestedCount), 1, particleCap()));
      const force = clamp(requestedIntensity, 0.24, 1.5) * pocket.config.force;
      for (let index = 0; index < count; index += 1) addParticle(pocket, force, requestedIntensity);
      startAnimation();
    }

    function drawParticle(context: CanvasRenderingContext2D, particle: Particle) {
      const fadeIn = clamp(particle.age / 0.12, 0, 1);
      const fadeOut = Math.pow(clamp(1 - particle.age / particle.life, 0, 1), 1.4);
      context.save();
      context.globalAlpha = fadeIn * fadeOut * particle.alpha;
      context.globalCompositeOperation = particle.kind === "ash" || particle.kind === "debris" ? "source-over" : "lighter";
      context.fillStyle = particle.color;
      context.strokeStyle = particle.color;
      context.shadowColor = particle.color;
      context.shadowBlur = particle.kind === "ash" ? 0 : 6;

      if (particle.kind === "streak") {
        context.lineWidth = Math.max(0.8, particle.size * 0.62);
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(particle.x - particle.vx * 0.045, particle.y - particle.vy * 0.045);
        context.stroke();
      } else if (particle.kind === "debris") {
        context.translate(particle.x, particle.y);
        context.rotate(particle.angle);
        context.lineWidth = Math.max(0.8, particle.size * 0.24);
        context.fillStyle = "#2b130d";
        context.beginPath();
        context.moveTo(-particle.size * particle.aspect, -particle.size * 0.34);
        context.lineTo(particle.size * 0.58, -particle.size * 0.72);
        context.lineTo(particle.size * particle.aspect, particle.size * 0.28);
        context.lineTo(-particle.size * 0.42, particle.size * 0.76);
        context.closePath();
        context.fill();
        context.stroke();
      } else if (particle.kind === "ash") {
        context.translate(particle.x, particle.y);
        context.rotate(particle.angle);
        context.fillRect(
          -particle.size * particle.aspect,
          -particle.size * 0.36,
          particle.size * particle.aspect * 2,
          particle.size * 0.72,
        );
      } else {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }

    function paintPocket(pocket: Pocket, dt: number) {
      if (!pocket.context) return;
      pocket.context.clearRect(0, 0, pocket.width, pocket.height);
      pocket.particles = pocket.particles.filter((particle) => {
        particle.age += dt;
        if (particle.age >= particle.life) return false;
        particle.vx += Math.sin(particle.phase + particle.age * 4) * 5 * dt;
        if (particle.kind === "debris") {
          particle.vy += 118 * dt;
          particle.vx *= Math.pow(0.988, dt * 60);
        } else {
          particle.vy -= particle.kind === "ash" ? 1.4 * dt : 5 * dt;
        }
        particle.angle += particle.spin * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        if (
          particle.x < -30
          || particle.x > pocket.width + 30
          || particle.y < -30
          || particle.y > pocket.height + 30
        ) return false;
        drawParticle(pocket.context as CanvasRenderingContext2D, particle);
        return true;
      });
    }

    function frame(now: number) {
      animationFrame = 0;
      if (reducedMotion || saveData || pageHidden) {
        pockets.forEach((pocket) => {
          pocket.particles = [];
          pocket.context?.clearRect(0, 0, pocket.width, pocket.height);
        });
        return;
      }

      const elapsed = now - lastPaint;
      if (elapsed < frameInterval()) {
        animationFrame = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(0.04, elapsed / 1000);
      lastPaint = now;
      pockets.forEach((pocket) => paintPocket(pocket, dt));
      if (totalParticles()) animationFrame = requestAnimationFrame(frame);
    }

    function stopAmbient() {
      window.clearTimeout(ambientTimer);
      ambientTimer = 0;
    }

    function scheduleAmbient() {
      stopAmbient();
      if (reducedMotion || saveData || pageHidden || !visiblePockets().length) return;
      const now = performance.now();
      const nextAt = Math.min(...visiblePockets().map((pocket) => pocket.nextAmbient));
      ambientTimer = window.setTimeout(runAmbient, Math.max(240, nextAt - now));
    }

    function runAmbient() {
      ambientTimer = 0;
      const now = performance.now();
      visiblePockets().forEach((pocket) => {
        if (pocket.nextAmbient > now || pocket.config.ambient[1] === 0) return;
        const count = randomCount(pocket.config.ambient);
        burstPocket(pocket, isLit ? count : Math.max(1, count - 1), isLit ? 0.72 : 0.54);
        pocket.nextAmbient = now + random(...pocket.config.interval);
      });
      scheduleAmbient();
    }

    function onBurst(event: Event) {
      const detail = (event as CustomEvent<FireBurstDetail>).detail;
      if (!detail?.profile) return;
      const pocket = pockets.find((candidate) => candidate.profile === detail.profile);
      if (!pocket) return;
      burstPocket(pocket, detail.count ?? 6, detail.intensity ?? 0.72);
    }

    function onScroll() {
      const now = performance.now();
      const currentY = window.scrollY;
      const elapsed = Math.max(16, now - lastScrollAt);
      const speed = Math.abs(currentY - lastScrollY) / elapsed * 1000;
      lastScrollY = currentY;
      lastScrollAt = now;
      if (
        reducedMotion
        || saveData
        || pageHidden
        || speed < SCROLL_SPEED_THRESHOLD
        || now - lastScrollBoost < SCROLL_BOOST_COOLDOWN
      ) return;

      const pocket = visiblePockets().find((candidate) => candidate.profile !== "builder" && candidate.profile !== "faq");
      if (!pocket) return;
      lastScrollBoost = now;
      burstPocket(pocket, mobileQuery.matches ? 3 : 5, 0.62);
    }

    function onVisibilityChange() {
      pageHidden = document.hidden;
      if (pageHidden) {
        stopAmbient();
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        pockets.forEach((pocket) => {
          pocket.particles = [];
          pocket.context?.clearRect(0, 0, pocket.width, pocket.height);
        });
      } else scheduleAmbient();
    }

    function onMotionPreferenceChange(event: MediaQueryListEvent) {
      reducedMotion = event.matches;
      pockets.forEach((pocket) => {
        pocket.element.dataset.static = reducedMotion || saveData ? "true" : "false";
      });
      if (reducedMotion) {
        stopAmbient();
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        pockets.forEach((pocket) => {
          pocket.particles = [];
          pocket.context?.clearRect(0, 0, pocket.width, pocket.height);
        });
      } else scheduleAmbient();
    }

    const observer = typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const pocket = pockets.find((candidate) => candidate.element === entry.target);
            if (!pocket) return;
            pocket.active = entry.isIntersecting;
            if (!entry.isIntersecting) {
              pocket.particles = [];
              pocket.context?.clearRect(0, 0, pocket.width, pocket.height);
              return;
            }
            resizePocket(pocket);
            pocket.nextAmbient = performance.now() + random(...pocket.config.interval);
            if (!pocket.entered) {
              pocket.entered = true;
              const entryCount = randomCount(pocket.config.entry);
              if (entryCount > 0) {
                burstPocket(pocket, mobileQuery.matches ? Math.max(1, entryCount - 2) : entryCount, 0.68);
              }
            }
          });
          scheduleAmbient();
        }, { threshold: 0.12, rootMargin: "-6% 0px -8% 0px" })
      : null;

    pockets.forEach((pocket) => {
      resizePocket(pocket);
      if (observer) observer.observe(pocket.element);
      else pocket.active = true;
    });

    controllerRef.current = {
      setLit(nextLit) {
        isLit = nextLit;
        pockets.forEach((pocket) => { pocket.element.dataset.lit = String(nextLit); });
        scheduleAmbient();
      },
    };

    window.addEventListener("fire-pocket:burst", onBurst);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resizeAll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotionQuery.addEventListener("change", onMotionPreferenceChange);
    scheduleAmbient();

    return () => {
      stopAmbient();
      if (animationFrame) cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      pockets.forEach((pocket) => {
        window.clearTimeout(pocket.flashTimer);
        pocket.canvas?.remove();
      });
      controllerRef.current = null;
      window.removeEventListener("fire-pocket:burst", onBurst);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resizeAll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotionQuery.removeEventListener("change", onMotionPreferenceChange);
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setLit(lit);
  }, [lit]);

  return null;
}
