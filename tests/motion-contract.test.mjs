import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, css] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
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
