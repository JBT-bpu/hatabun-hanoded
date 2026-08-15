import path from "node:path";
import sharp from "sharp";

const workspace = process.cwd();
const masterDirectory = path.join(workspace, "assets", "campaign-master");
const publicDirectory = path.join(workspace, "public", "campaign");

const jobs = [
  {
    source: "event-opener.png",
    output: "event-opener.webp",
    resize: { width: 1400, height: 1050, fit: "inside", withoutEnlargement: true },
    webp: { quality: 92, alphaQuality: 100, smartSubsample: true },
  },
  ...["home", "nature", "venue"].map((name) => ({
    source: `event-${name}.png`,
    output: `event-${name}.webp`,
    resize: { width: 1200, height: 1500, fit: "cover", position: "centre" },
    webp: { quality: 88, smartSubsample: true },
  })),
];

for (const job of jobs) {
  const outputPath = path.join(publicDirectory, job.output);
  await sharp(path.join(masterDirectory, job.source))
    .resize(job.resize)
    .webp(job.webp)
    .toFile(outputPath);

  const metadata = await sharp(outputPath).metadata();
  console.log(`${job.output}: ${metadata.width}x${metadata.height}, alpha=${Boolean(metadata.hasAlpha)}`);
}
