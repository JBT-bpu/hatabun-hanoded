"use client";

import { useEffect, useRef } from "react";

// Procedural fbm-noise flame rendered on a small transparent WebGL canvas.
// Unlike HeatHaze this also runs on mobile — it is the live fire the static
// hero photo can't provide there. Screen-blended over the oven mouth.

const vertexShader = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const fragmentShader = `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform float uLit;
uniform float uLean;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 1.35;

  // Pointer lean bends the upper flame body sideways.
  uv.x -= uLean * uv.y * uv.y * 0.4;

  float turbulence = fbm(vec2(uv.x * 4.2, uv.y * 5.4 - t));
  turbulence = turbulence * 0.72 + 0.28 * fbm(vec2(uv.x * 9.1 + 17.3, uv.y * 11.0 - t * 1.9));

  // Teardrop envelope: wide near the base, licking tips above.
  float width = mix(0.34, 0.05, uv.y);
  float x = (uv.x - 0.5) + (turbulence - 0.5) * 0.42 * (0.25 + uv.y);
  float core = 1.0 - smoothstep(0.0, width + 0.22, abs(x) + uv.y * uv.y * 0.28);
  core *= smoothstep(0.0, 0.14, uv.y) * smoothstep(1.0, 0.6, uv.y);
  core -= (1.0 - turbulence) * 0.22 * uv.y;

  float intensity = clamp(core, 0.0, 1.0) * uLit;

  vec3 color = mix(vec3(0.42, 0.04, 0.0), vec3(1.0, 0.36, 0.05), intensity);
  color = mix(color, vec3(1.0, 0.86, 0.5), pow(intensity, 2.4));

  float alpha = pow(intensity, 1.2);
  gl_FragColor = vec4(color * alpha, alpha);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function ShaderFlame({ lit }: { lit: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const litRef = useRef(lit);

  useEffect(() => {
    litRef.current = lit;
  }, [lit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (reducedMotionQuery.matches || connection?.saveData) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vertex || !fragment) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    const timeUniform = gl.getUniformLocation(program, "uTime");
    const litUniform = gl.getUniformLocation(program, "uLit");
    const leanUniform = gl.getUniformLocation(program, "uLean");
    gl.useProgram(program);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const frameInterval = coarse ? 1000 / 30 : 1000 / 60;
    let animationFrame = 0;
    let frameTimer = 0;
    let heat = 0;
    let lean = 0;
    let targetLean = 0;
    let visible = typeof IntersectionObserver !== "function";
    let pageHidden = document.hidden;
    let disposed = false;
    const startedAt = performance.now();

    function resize() {
      if (!canvas || !gl) return;
      const rect = parent!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    function canRender() {
      return visible && !pageHidden && !disposed;
    }

    function stopLoop() {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (frameTimer) window.clearTimeout(frameTimer);
      animationFrame = 0;
      frameTimer = 0;
    }

    function scheduleFrame() {
      if (!canRender() || animationFrame || frameTimer) return;
      frameTimer = window.setTimeout(() => {
        frameTimer = 0;
        animationFrame = requestAnimationFrame(render);
      }, frameInterval);
    }

    function render(now: number) {
      animationFrame = 0;
      if (!canRender() || !gl) return;
      const targetHeat = litRef.current ? 1 : 0;
      heat += (targetHeat - heat) * 0.045;
      lean += (targetLean - lean) * 0.06;

      gl.useProgram(program);
      gl.uniform1f(timeUniform, (now - startedAt) / 1000);
      gl.uniform1f(litUniform, heat);
      gl.uniform1f(leanUniform, lean);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      scheduleFrame();
    }

    function onPointerMove(event: PointerEvent) {
      if (coarse) return;
      const centerX = window.innerWidth / 2;
      targetLean = Math.max(-1, Math.min(1, (event.clientX - centerX) / centerX)) * 0.5;
    }

    function reconcile() {
      if (canRender()) scheduleFrame();
      else stopLoop();
    }

    function onVisibilityChange() {
      pageHidden = document.hidden;
      reconcile();
    }

    const intersectionObserver = typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => {
          visible = Boolean(entries[0]?.isIntersecting);
          reconcile();
        }, { threshold: 0.02 })
      : null;
    intersectionObserver?.observe(parent);

    const resizeObserver = typeof ResizeObserver === "function"
      ? new ResizeObserver(resize)
      : null;
    resizeObserver?.observe(parent);

    resize();
    scheduleFrame();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      stopLoop();
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return <canvas ref={canvasRef} className="shader-flame-canvas" aria-hidden="true" />;
}
