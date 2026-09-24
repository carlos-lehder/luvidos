// Generates favicon / app icons / Open Graph image from the Heart-Play brand SVG.
// Run: node scripts/generate-brand.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const markSvg = await readFile(path.join(root, "public/brand/logo.svg"));

const HEART_PATH =
  "M32 55C14 42 8 31 12 22c3-7 12-9 17-4l3 3 3-3c5-5 14-3 17 4c4 9-2 20-20 33zM27 27v18l15-9z";

const gradient = (id) => `
  <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#F0ABFC"/>
    <stop offset="1" stop-color="#A21CAF"/>
  </linearGradient>`;

/** Mark on a dark rounded tile (for platforms that don't support transparency well). */
const tileSvg = (size, radiusRatio = 0.22, pad = 0.14) => {
  const r = Math.round(size * radiusRatio);
  const inner = size * (1 - pad * 2);
  const offset = size * pad;
  const scale = inner / 64;
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>${gradient("g")}</defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="#16111a"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path fill="url(#g)" fill-rule="evenodd" d="${HEART_PATH}"/>
  </g>
</svg>`);
};

const ogSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    ${gradient("g")}
    <radialGradient id="glow" cx="0.5" cy="0" r="0.9">
      <stop offset="0" stop-color="#A21CAF" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#16111a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#16111a"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g transform="translate(120 175) scale(4.375)">
    <path fill="url(#g)" fill-rule="evenodd" d="${HEART_PATH}"/>
  </g>
  <g font-family="Inter, 'Segoe UI', Arial, sans-serif" font-weight="700">
    <text x="440" y="330" font-size="120" letter-spacing="-4" fill="#ffffff"><tspan fill="#F0ABFC">Luv</tspan>idos</text>
    <text x="444" y="400" font-size="40" font-weight="500" letter-spacing="-0.5" fill="#c9b8cc">Media Gallery &amp; Streaming</text>
  </g>
  <text x="444" y="470" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="26" fill="#8d7f8f">Upload albums · share one link · stream instantly</text>
</svg>`);

const out = (p) => path.join(root, p);
await mkdir(out("app"), { recursive: true });

await Promise.all([
  // Transparent mark for browsers (Next.js picks up app/icon.svg + app/icon.png).
  writeFile(out("app/icon.svg"), markSvg),
  sharp(markSvg, { density: 384 }).resize(64, 64).png().toFile(out("app/icon.png")),
  // iOS ignores transparency; use the dark tile.
  sharp(tileSvg(180, 0)).png().toFile(out("app/apple-icon.png")),
  sharp(ogSvg).png().toFile(out("app/opengraph-image.png")),
  sharp(tileSvg(512)).png().toFile(out("public/brand/icon-512.png")),
]);

console.log("Brand assets generated.");
