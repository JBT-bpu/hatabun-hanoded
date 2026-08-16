import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the branded Hebrew event site", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="he" dir="rtl">/);
  assert.match(html, /הטאבון הנודד/);
  assert.match(html, /האש נדלקת/);
  assert.match(html, /\/campaign\/hero-taboon-centered\.webp/);
  assert.match(html, /\/campaign\/menu-dairy\.webp/);
  assert.match(html, /\/brand\/brand-camel-oven-icon-v2\.webp/);
  assert.doesNotMatch(html, /Building your site|codex-preview|react-loading-skeleton/i);
});

test("keeps the finished metadata and required campaign assets", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /hero-taboon-centered-mobile\.webp/);
  assert.match(page, /menu-meat\.webp/);
  assert.match(layout, /תיאטרון אש נייד לאירועים/);
  assert.match(layout, /\/og\.png/);
  assert.doesNotMatch(page, /SkeletonPreview|_sites-preview/);

  await Promise.all([
    "../public/campaign/hero-taboon-centered.webp",
    "../public/campaign/hero-taboon-centered-mobile.webp",
    "../public/fire-story-filmstrip.webp",
    "../public/campaign/menu-dairy.webp",
    "../public/campaign/menu-meat.webp",
    "../public/og.png",
  ].map((file) => access(new URL(file, import.meta.url))));
});
