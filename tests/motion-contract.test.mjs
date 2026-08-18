import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, css, fireAtmosphere] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/FireAtmosphere.tsx", import.meta.url), "utf8"),
]);

function cssRulesFor(className) {
  const rules = [];
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;

  for (const match of css.matchAll(rulePattern)) {
    if (match[1].includes(className)) {
      rules.push({ selector: match[1].trim(), declarations: match[2] });
    }
  }

  return rules;
}

function assertAbsent(source, pattern, message) {
  assert.equal(pattern.test(source), false, message);
}

function nestedCssBlock(source, start) {
  const openingBrace = source.indexOf("{", start);
  assert.notEqual(openingBrace, -1, "expected CSS block opening brace");

  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(openingBrace + 1, index);
  }

  assert.fail("expected CSS block closing brace");
}

test("keeps page motion free of the legacy reveal and StoryCanvas systems", () => {
  assertAbsent(page, /data-reveal/, "legacy data-reveal system remains in page.tsx");
  assertAbsent(page, /\bStoryCanvas\b/, "legacy StoryCanvas remains in page.tsx");
});

test("does not smooth or lerp scroll-linked motion", () => {
  const htmlRules = cssRulesFor("html");
  assert.ok(htmlRules.length > 0, "expected at least one html CSS rule");

  for (const rule of htmlRules) {
    assertAbsent(
      rule.declarations,
      /scroll-behavior\s*:\s*smooth\b/i,
      `global scroll smoothing found in: ${rule.selector}`,
    );
  }

  assertAbsent(page, /\bdistance\s*\*\s*0?\.14\b/, "legacy story lerp remains in page.tsx");
});

test("keeps event-card layout fixed during interaction", () => {
  const eventGridRules = cssRulesFor(".events-grid");
  assert.ok(eventGridRules.length > 0, "expected .events-grid CSS rules");

  for (const rule of eventGridRules) {
    assertAbsent(
      rule.declarations,
      /transition(?:-property)?\s*:[^;}]*\bgrid-template-columns\b/i,
      `grid-template-columns transition found in: ${rule.selector}`,
    );
  }
});

test("provides a reduced-motion CSS fallback", () => {
  const mediaStart = css.search(
    /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i,
  );
  assert.notEqual(mediaStart, -1, "missing prefers-reduced-motion media query");

  const reducedMotionRules = nestedCssBlock(css, mediaStart);
  assert.equal(
    /scroll-behavior\s*:\s*auto\b/i.test(reducedMotionRules),
    true,
    "reduced-motion rules must disable smooth scrolling",
  );
  assert.equal(
    /animation(?:-duration)?\s*:/i.test(reducedMotionRules),
    true,
    "reduced-motion rules must suppress animation",
  );
  assert.equal(
    /transition(?:-duration)?\s*:/i.test(reducedMotionRules),
    true,
    "reduced-motion rules must suppress transitions",
  );
});

test("uses local fire pockets instead of a global ember layer", () => {
  const source = `${page}\n${css}`;
  assert.match(page, /\bFireAtmosphere\b/);
  assertAbsent(source, /\bEmberField\b/, "legacy EmberField remains");
  assertAbsent(source, /className=["'][^"']*\bember-field\b/, "global ember canvas remains");
  assertAbsent(source, /data-ember-[\w-]+/, "legacy ember data hook remains");
  assertAbsent(source, /["']fire:burst["']/, "legacy selector burst event remains");
  assertAbsent(css, /main::before\s*,\s*main::after/, "fixed whole-page heat screens remain");
  assertAbsent(fireAtmosphere, /addEventListener\(\s*["']pointermove["']/, "mouse ember trail remains");
});

test("keeps local warmth when motion or data saving disables particles", () => {
  assert.match(fireAtmosphere, /prefers-reduced-motion\s*:\s*reduce/);
  assert.match(fireAtmosphere, /navigator[\s\S]{0,180}\bconnection\b[\s\S]{0,180}\bsaveData\b/);
  assert.match(fireAtmosphere, /IntersectionObserver/);
  assert.match(css, /\.fire-pocket::before[\s\S]{0,900}radial-gradient/);
  assert.match(css, /\.fire-pocket__canvas\s*,\s*\.heat-haze-canvas\s*\{\s*display:\s*none/);
  assertAbsent(css, /\.fire-pocket\s*\{[^}]*display\s*:\s*none/is, "reduced-motion hides static fire warmth");
});

test("locks the agreed mobile budgets and scroll trigger", () => {
  assert.match(fireAtmosphere, /DESKTOP_PARTICLE_CAP\s*=\s*36/);
  assert.match(fireAtmosphere, /MOBILE_PARTICLE_CAP\s*=\s*20/);
  assert.match(fireAtmosphere, /SCROLL_SPEED_THRESHOLD\s*=\s*650/);
  assert.match(fireAtmosphere, /SCROLL_BOOST_COOLDOWN\s*=\s*900/);
  for (const profile of ["hero", "story", "builder", "events", "faq", "final"]) {
    assert.match(fireAtmosphere, new RegExp(`\\b${profile}:\\s*\\{`));
  }
});
