"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Shared handle so page code can route programmatic scrolls through Lenis;
// null whenever Lenis is inactive (reduced motion) and native scroll applies.
export const lenisStore: { instance: Lenis | null } = { instance: null };

export function scrollWindowTo(top: number, immediate = false) {
  const lenis = lenisStore.instance;
  if (lenis) lenis.scrollTo(top, immediate ? { immediate: true } : undefined);
  else window.scrollTo({ top, behavior: "auto" });
}

export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      anchors: true,
    });
    lenisStore.instance = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenisStore.instance = null;
      lenis.destroy();
    };
  }, []);

  return null;
}
