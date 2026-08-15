"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";

export default function LottieFlame({ active }: { active: boolean }) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const activeRef = useRef(active);
  const [ready, setReady] = useState(false);

  activeRef.current = active;

  useEffect(() => {
    const host = hostRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!host || reducedMotion.matches) return;

    let cancelled = false;
    let animation: AnimationItem | null = null;

    const handleReady = () => {
      if (cancelled || !animation) return;
      setReady(true);
      animation.setSpeed(1);
      if (activeRef.current) animation.goToAndPlay(0, true);
      else animation.goToAndStop(0, true);
    };

    void (async () => {
      try {
        const [lottieModule, response] = await Promise.all([
          import("lottie-web/build/player/lottie_light"),
          fetch("/flame-ignition.json"),
        ]);
        if (!response.ok) throw new Error("Unable to load the ignition animation");

        const animationData = await response.json();
        if (cancelled) return;

        animation = lottieModule.default.loadAnimation({
          container: host,
          renderer: "svg",
          loop: true,
          autoplay: false,
          animationData,
          rendererSettings: {
            preserveAspectRatio: "xMidYMid meet",
            progressiveLoad: true,
          },
        });
        animationRef.current = animation;
        animation.addEventListener("DOMLoaded", handleReady);
      } catch {
        if (!cancelled) setReady(false);
      }
    })();

    return () => {
      cancelled = true;
      animation?.removeEventListener("DOMLoaded", handleReady);
      animation?.destroy();
      animationRef.current = null;
    };
  }, []);

  useEffect(() => {
    const animation = animationRef.current;
    if (!ready || !animation) return;
    if (active) animation.goToAndPlay(0, true);
    else animation.goToAndStop(0, true);
  }, [active, ready]);

  return (
    <span
      className={`ignition-animation ${ready ? "is-ready" : ""}`}
      aria-hidden="true"
    >
      <span ref={hostRef} className="ignition-lottie" />
      <span className="ignition-core ignition-fallback"><i /></span>
    </span>
  );
}
