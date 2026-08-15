"use client";

import { useEffect, useRef } from "react";

const readNumber = (styles: CSSStyleDeclaration, name: string, fallback = 0) => {
  const value = Number.parseFloat(styles.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
};

export default function StoryCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const shell = canvas?.closest<HTMLElement>(".story-scroll");
    if (!canvas || !shell) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const image = new Image();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let visible = true;
    let imageReady = false;
    let cssWidth = 1;
    let cssHeight = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cssWidth = Math.max(1, rect.width);
      cssHeight = Math.max(1, rect.height);
      const width = Math.round(cssWidth * dpr);
      const height = Math.round(cssHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    const drawPanel = (
      panel: number,
      alpha: number,
      heat: number,
      time: number,
    ) => {
      if (alpha < 0.003) return;
      const panelWidth = image.naturalWidth / 3;
      const panelHeight = image.naturalHeight;
      context.save();
      context.globalAlpha = alpha;

      if (heat < 0.012 || reducedMotion) {
        context.drawImage(
          image,
          panel * panelWidth,
          0,
          panelWidth,
          panelHeight,
          0,
          0,
          cssWidth,
          cssHeight,
        );
      } else {
        const strip = 7;
        const overscan = 8;
        for (let y = 0; y < cssHeight; y += strip) {
          const sourceY = (y / cssHeight) * panelHeight;
          const sourceHeight = Math.min(panelHeight - sourceY, (strip / cssHeight) * panelHeight + 1);
          const wave =
            Math.sin(y * 0.072 + time * 0.0042) +
            0.42 * Math.sin(y * 0.19 - time * 0.0064);
          const offset = wave * heat * 7;
          context.drawImage(
            image,
            panel * panelWidth,
            sourceY,
            panelWidth,
            sourceHeight,
            -overscan + offset,
            y,
            cssWidth + overscan * 2,
            strip + 1,
          );
        }
      }

      context.restore();
    };

    const render = (time: number) => {
      frame = 0;
      if (!visible || !imageReady) return;
      resize();

      const styles = getComputedStyle(shell);
      const weights = [
        readNumber(styles, "--stage-0-alpha", 1),
        readNumber(styles, "--stage-1-alpha"),
        readNumber(styles, "--stage-2-alpha"),
      ];
      const heat = reducedMotion ? 0 : readNumber(styles, "--story-heat");

      context.fillStyle = "#100c09";
      context.fillRect(0, 0, cssWidth, cssHeight);
      weights.forEach((weight, index) => drawPanel(index, weight, heat, time));

      if (heat > 0.01) frame = requestAnimationFrame(render);
    };

    const schedule = () => {
      if (visible && !frame) frame = requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) schedule();
        else if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { rootMargin: "18% 0px" },
    );

    const resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(schedule)
      : null;

    image.addEventListener("load", () => {
      imageReady = true;
      schedule();
    });
    image.src = "/fire-story-filmstrip.png";
    observer.observe(canvas);
    resizeObserver?.observe(canvas);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return <canvas ref={canvasRef} className="story-canvas" aria-hidden="true" />;
}
