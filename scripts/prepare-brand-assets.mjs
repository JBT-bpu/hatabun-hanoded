import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, ".asset-review", "generated");
const generated = path.join(
  "C:\\Users\\COMP13\\.codex\\generated_images\\01a001a0-e1ff-7c43-bdfd-eeb7605f42d6",
);
const publicDir = path.join(root, "public");
const campaignDir = path.join(publicDir, "campaign");
const brandDir = path.join(publicDir, "brand");
const campaignMasterDir = path.join(root, "assets", "campaign-master");

await fs.mkdir(campaignDir, { recursive: true });
await fs.mkdir(brandDir, { recursive: true });

const webp = async (input, output, options = {}) => {
  const image = sharp(input);
  if (options.resize) image.resize(options.resize);
  await image.webp({ quality: options.quality ?? 88, smartSubsample: true }).toFile(output);
};

await webp(
  path.join(campaignMasterDir, "hero-seam-v2.png"),
  path.join(campaignDir, "hero-desktop.webp"),
  {
    quality: 90,
    resize: { width: 1920, height: 1080, fit: "cover", position: "center" },
  },
);
await webp(
  path.join(campaignMasterDir, "hero-seam-v2.png"),
  path.join(campaignDir, "hero-mobile.webp"),
  {
    quality: 90,
    resize: { width: 1080, height: 820, fit: "cover", position: "right" },
  },
);

const storySources = [
  path.join(source, "03-story-arrival.png"),
  path.join(generated, "exec-69ff43d6-b1d1-4c7c-a28d-aa6b3a08c981.png"),
  path.join(source, "05-story-serving.png"),
];
const storyPanels = await Promise.all(
  storySources.map((input) =>
    sharp(input)
      .resize(800, 1200, { fit: "cover", position: sharp.strategy.attention })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  ),
);
await sharp({
  create: { width: 2400, height: 1200, channels: 3, background: "#100c09" },
})
  .composite(storyPanels.map((input, index) => ({ input, left: index * 800, top: 0 })))
  .webp({ quality: 88, smartSubsample: true })
  .toFile(path.join(publicDir, "fire-story-filmstrip.webp"));

await webp(
  path.join(generated, "exec-4a0a2843-a846-457d-8c82-5cf32828bd66.png"),
  path.join(campaignDir, "menu-dairy.webp"),
  { quality: 90 },
);
await webp(
  path.join(generated, "exec-b66c2f3b-9237-4625-86aa-6379960624c3.png"),
  path.join(campaignDir, "menu-meat.webp"),
  { quality: 90 },
);

for (const [input, output] of [
  ["20-gallery-home.png", "event-home.webp"],
  ["21-gallery-nature.png", "event-nature.webp"],
  ["22-gallery-hall-garden.png", "event-venue.webp"],
  ["23-gallery-placeholder.png", "gallery-placeholder.webp"],
]) {
  await webp(path.join(source, input), path.join(campaignDir, output), { quality: 89 });
}

await sharp(path.join(source, "11-camel-oven-icon.png"))
  .resize(1100, 1100, { fit: "inside", withoutEnlargement: true })
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile(path.join(brandDir, "brand-camel-oven-icon-v2.webp"));
await sharp(path.join(source, "19-event-opener.png"))
  .resize(1400, 1050, { fit: "inside", withoutEnlargement: true })
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile(path.join(campaignDir, "event-opener-v2.webp"));
await sharp(path.join(source, "24-final-cta.png"))
  .resize(1400, 1050, { fit: "inside", withoutEnlargement: true })
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile(path.join(campaignDir, "final-cta.webp"));

for (const [input, output] of [
  ["12-icon-flame.png", "icon-flame-v2.png"],
  ["13-icon-wheat.png", "icon-wheat-v2.png"],
  ["14-icon-oven-peel.png", "icon-peel-v2.png"],
  ["15-icon-palm.png", "icon-palm-v2.png"],
  ["16-icon-oven-mouth.png", "icon-oven-v2.png"],
]) {
  await sharp(path.join(source, input))
    .resize(320, 320, { fit: "inside" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(brandDir, output));
}

const ogBackground = await sharp(path.join(source, "25-social-og-background.png"))
  .resize(1732, 909, { fit: "cover" })
  .toBuffer();
const ogLogo = await sharp(path.join(source, "09-horizontal-logo.png"))
  .resize(720, null, { fit: "inside" })
  .toBuffer();
await sharp(ogBackground)
  .composite([{ input: ogLogo, left: 970, top: 285 }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(publicDir, "og.png"));

console.log("Brand assets prepared.");
