"use client";

import { useEffect, useRef, useState } from "react";

const vertexShader = `#version 300 es
in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const fragmentShader = `#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uTextureSize;
uniform vec2 uPointer;
uniform float uTime;
uniform float uHeat;
out vec4 outputColor;

vec2 coverUv(vec2 uv) {
  float renderAspect = uResolution.x / uResolution.y;
  float textureAspect = uTextureSize.x / uTextureSize.y;

  if (textureAspect > renderAspect) {
    float visible = renderAspect / textureAspect;
    uv.x = uv.x * visible + (1.0 - visible);
  } else {
    float visible = textureAspect / renderAspect;
    uv.y = uv.y * visible + (1.0 - visible) * 0.5;
  }

  return uv;
}

void main() {
  vec2 uv = vUv;
  vec2 fire = vec2(0.78, 0.54);
  vec2 plumeDelta = (uv - fire) * vec2(1.35, 0.72);
  float plume = smoothstep(0.48, 0.035, length(plumeDelta));
  plume *= smoothstep(0.98, 0.22, uv.y);

  float waveA = sin(uv.y * 52.0 - uTime * 3.1 + sin(uv.x * 19.0 + uTime * 0.9));
  float waveB = sin(uv.y * 87.0 - uTime * 2.15 + uv.x * 31.0) * 0.45;
  float shimmer = (waveA + waveB) * 0.0065 * plume * uHeat;

  float pointerLens = smoothstep(0.23, 0.0, distance(uv, uPointer)) * uHeat;
  vec2 distortion = vec2(shimmer, abs(shimmer) * 0.42);
  distortion += vec2(
    sin((uv.y + uTime * 0.08) * 34.0),
    cos((uv.x - uTime * 0.06) * 27.0)
  ) * 0.0024 * pointerLens;

  vec2 sampleUv = coverUv(clamp(uv + distortion, 0.0, 1.0));
  float chroma = 0.0017 * pointerLens;
  vec3 color;
  color.r = texture(uTexture, sampleUv + vec2(chroma, 0.0)).r;
  color.g = texture(uTexture, sampleUv).g;
  color.b = texture(uTexture, sampleUv - vec2(chroma, 0.0)).b;

  float fireGlow = pow(max(0.0, 1.0 - length(plumeDelta) * 2.1), 3.0) * 0.12 * uHeat;
  color += vec3(1.0, 0.25, 0.025) * fireGlow;
  outputColor = vec4(color, 1.0);
}`;

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
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

export default function HeatHaze({ src, lit }: { src: string; lit: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const litRef = useRef(lit);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    litRef.current = lit;
  }, [lit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (reducedMotion || coarsePointer || connection?.saveData) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    const vertex = createShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
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
    const resolution = gl.getUniformLocation(program, "uResolution");
    const textureSize = gl.getUniformLocation(program, "uTextureSize");
    const pointerUniform = gl.getUniformLocation(program, "uPointer");
    const timeUniform = gl.getUniformLocation(program, "uTime");
    const heatUniform = gl.getUniformLocation(program, "uHeat");

    gl.useProgram(program);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    let imageWidth = 1;
    let imageHeight = 1;
    let animationFrame = 0;
    let heat = 0;
    let pointer = { x: 0.78, y: 0.54 };
    const startedAt = performance.now();

    function resize() {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.4);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    function onPointerMove(event: PointerEvent) {
      const rect = parent.getBoundingClientRect();
      pointer = {
        x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
        y: 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
      };
    }

    function render(now: number) {
      resize();
      const rect = parent.getBoundingClientRect();
      const targetHeat = litRef.current ? 1 : 0;
      heat += (targetHeat - heat) * 0.055;

      if (!document.hidden && rect.bottom > 0 && rect.top < window.innerHeight) {
        gl.useProgram(program);
        gl.uniform2f(resolution, canvas.width, canvas.height);
        gl.uniform2f(textureSize, imageWidth, imageHeight);
        gl.uniform2f(pointerUniform, pointer.x, pointer.y);
        gl.uniform1f(timeUniform, (now - startedAt) / 1000);
        gl.uniform1f(heatUniform, heat);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      animationFrame = requestAnimationFrame(render);
    }

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      imageWidth = image.naturalWidth;
      imageHeight = image.naturalHeight;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      setReady(true);
      animationFrame = requestAnimationFrame(render);
    };
    image.src = src;

    parent.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", resize, { passive: true });

    return () => {
      cancelAnimationFrame(animationFrame);
      parent.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [src]);

  return <canvas ref={canvasRef} className={`heat-haze-canvas${ready ? " is-ready" : ""}`} aria-hidden="true" />;
}
