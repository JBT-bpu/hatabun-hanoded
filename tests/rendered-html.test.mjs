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
  assert.match(html, /\/forge-blueprint\/focaccia-outline\.png/);
  assert.match(html, /\/forge-blueprint\/stamps\/mozzarella\.png/);
  assert.match(html, /\/brand\/brand-camel-oven-icon-v2\.webp/);
  assert.match(html, /FOCACCIA BLUEPRINT/);
  assert.match(html, /מתכננים\./);
  assert.match(html, /חותמים באש\./);
  assert.match(html, /חתמו באש/);
  assert.match(html, /סלטים, קינוחים ועוד/);
  assert.doesNotMatch(html, /Building your site|codex-preview|react-loading-skeleton/i);
});

test("keeps the finished metadata and required campaign assets", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /hero-taboon-centered-mobile\.webp/);
  assert.match(page, /focacciaToppings/);
  assert.match(page, /שלחו לוואטסאפ/);
  assert.match(layout, /תיאטרון אש נייד לאירועים/);
  assert.match(layout, /\/og\.jpg/);
  assert.doesNotMatch(page, /SkeletonPreview|_sites-preview/);

  await Promise.all([
    "../public/campaign/hero-taboon-centered.webp",
    "../public/campaign/hero-taboon-centered-mobile.webp",
    "../public/fire-story-filmstrip.webp",
    "../public/forge/forge-peel-baked.png",
    "../public/forge-blueprint/focaccia-outline.png",
    "../public/forge-blueprint/toppings/mozzarella.png",
    "../public/forge-blueprint/stamps/mozzarella.png",
    "../public/og.jpg",
  ].map((file) => access(new URL(file, import.meta.url))));
});
