import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [source, outputDirectory] = process.argv.slice(2);

if (!source || !outputDirectory) {
  throw new Error("Usage: node scripts/extract-brand-assets.mjs <source> <output-directory>");
}

const assets = [
  { name: "brand-primary-logo.png", left: 58, top: 8, width: 756, height: 892 },
  { name: "brand-round-seal.png", left: 914, top: 22, width: 492, height: 449 },
  { name: "brand-camel-oven-icon.png", left: 986, top: 486, width: 378, height: 270 },
  { name: "brand-horizontal-logo.png", left: 862, top: 747, width: 577, height: 222 },
  { name: "icon-flame.png", left: 834, top: 1007, width: 91, height: 79 },
  { name: "icon-wheat.png", left: 930, top: 1007, width: 92, height: 79 },
  { name: "icon-peel.png", left: 1020, top: 1007, width: 145, height: 79 },
  { name: "icon-palm.png", left: 1155, top: 1007, width: 145, height: 79 },
  { name: "icon-oven.png", left: 1286, top: 1007, width: 157, height: 79 },
];

const isBoardBackground = (red, green, blue) =>
  red >= 205 && green >= 184 && blue >= 145 && red - green <= 55 && green - blue <= 75;

async function extractAsset(asset) {
  const { data, info } = await sharp(source)
    .extract(asset)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const background = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pixel = y * width + x;
    if (background[pixel]) return;
    const offset = pixel * channels;
    if (!isBoardBackground(data[offset], data[offset + 1], data[offset + 2])) return;
    background[pixel] = 1;
    queue[tail++] = pixel;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (head < tail) {
    const pixel = queue[head++];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  let transparentPixels = 0;
  for (let pixel = 0; pixel < background.length; pixel += 1) {
    if (!background[pixel]) continue;
    data[pixel * channels + 3] = 0;
    transparentPixels += 1;
  }

  const outputPath = path.join(outputDirectory, asset.name);
  await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(outputPath);
  const alphaCoverage = 1 - transparentPixels / background.length;
  console.log(`${asset.name}: ${width}x${height}, opaque coverage ${(alphaCoverage * 100).toFixed(1)}%`);
}

await fs.mkdir(outputDirectory, { recursive: true });
for (const asset of assets) await extractAsset(asset);
