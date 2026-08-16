"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Scroll-scrubbed depth: the hero photo sinks slower than the page while the
// copy lifts away, and any [data-drift="N"] element drifts N percent of its
// height over its own viewport transit. Purely decorative — skipped entirely
// under reduced motion.
export default function CinematicScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const hero = document.querySelector<HTMLElement>(".poster-hero");
      const photo = document.querySelector<HTMLElement>(".poster-photo");
      const copy = document.querySelector<HTMLElement>(".poster-copy-inner");

      if (hero && photo) {
        gsap.to(photo, {
          yPercent: 9,
          scale: 1.05,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
        });
      }
      if (hero && copy) {
        gsap.to(copy, {
          yPercent: -14,
          opacity: 0.3,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "70% top", scrub: true },
        });
      }

      document.querySelectorAll<HTMLElement>("[data-drift]").forEach((element) => {
        const drift = Number.parseFloat(element.dataset.drift || "0");
        if (!drift) return;
        // data-drift-scale overscales the element so the drift never exposes
        // the container edges behind it (parallax inside a masked frame).
        const scale = Number.parseFloat(element.dataset.driftScale || "1");
        gsap.fromTo(
          element,
          { yPercent: -drift, scale },
          {
            yPercent: drift,
            scale,
            ease: "none",
            scrollTrigger: {
              trigger: element,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
    });

    return () => ctx.revert();
  }, []);

  return null;
}
