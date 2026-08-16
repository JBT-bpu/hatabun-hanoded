"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";

type LottieFlameProps = {
  active: boolean;
  replayKey?: number | string;
};

export default function LottieFlame({ active, replayKey }: LottieFlameProps) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const [motionAllowed, setMotionAllowed] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setMotionAllowed(!reducedMotion.matches);
    updatePreference();
    reducedMotion.addEventListener("change", updatePreference);
    return () => reducedMotion.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || motionAllowed !== true) {
      setReady(false);
      return;
    }

    let cancelled = false;
    let animation: AnimationItem | null = null;

    const handleReady = () => {
      if (cancelled || !animation) return;
      setReady(true);
      animation.setSpeed(1);
    };

    const handleComplete = () => {
      if (cancelled || !animation) return;
      animation.goToAndStop(Math.max(0, animation.totalFrames - 1), true);
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
          loop: false,
          autoplay: false,
          animationData,
          rendererSettings: {
            preserveAspectRatio: "xMidYMid meet",
            progressiveLoad: true,
          },
        });
        animationRef.current = animation;
        animation.addEventListener("DOMLoaded", handleReady);
        animation.addEventListener("complete", handleComplete);
      } catch {
        if (!cancelled) setReady(false);
      }
    })();

    return () => {
      cancelled = true;
      animation?.removeEventListener("DOMLoaded", handleReady);
      animation?.removeEventListener("complete", handleComplete);
      animation?.destroy();
      animationRef.current = null;
    };
  }, [motionAllowed]);

  useEffect(() => {
    const animation = animationRef.current;
    if (!ready || !animation) return;
    if (active) animation.goToAndPlay(0, true);
    else animation.goToAndStop(0, true);
  }, [active, ready, replayKey]);

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
