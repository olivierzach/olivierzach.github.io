#!/usr/bin/env node
/**
 * Optimize cover images in public/covers/ for crisp display + fast loads.
 *
 * - Reads public/covers/*.jpg (and *.png)
 * - Writes WebP + JPG variants at fixed widths
 *
 * Output:
 *   public/covers/_optimized/<name>-w240.webp
 *   public/covers/_optimized/<name>-w360.webp
 *   public/covers/_optimized/<name>-w240.jpg
 *   public/covers/_optimized/<name>-w360.jpg
 *
 * Usage:
 *   node scripts/optimize_covers.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const IN_DIR = path.join(ROOT, 'public/covers');
const OUT_DIR = path.join(IN_DIR, '_optimized');

const WIDTHS = [240, 360];

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const files = await fs.readdir(IN_DIR);
  const imgs = files.filter((f) => /\.(jpg|jpeg|png)$/i.test(f) && !f.startsWith('placeholder'));

  for (const f of imgs) {
    const inPath = path.join(IN_DIR, f);
    const base = f.replace(/\.(jpg|jpeg|png)$/i, '');

    const input = sharp(inPath, { failOn: 'none' }).rotate();
    const meta = await input.metadata();
    if (!meta.width || meta.width < 200) {
      console.warn(`[skip] ${f}: too small (${meta.width || '?'}px wide)`);
      continue;
    }

    for (const w of WIDTHS) {
      const webpOut = path.join(OUT_DIR, `${base}-w${w}.webp`);
      const jpgOut = path.join(OUT_DIR, `${base}-w${w}.jpg`);

      await sharp(inPath, { failOn: 'none' })
        .rotate()
        .resize({ width: w })
        .webp({ quality: 82 })
        .toFile(webpOut);

      await sharp(inPath, { failOn: 'none' })
        .rotate()
        .resize({ width: w })
        .jpeg({ quality: 84, mozjpeg: true })
        .toFile(jpgOut);

      console.log(`[ok] ${f} -> ${path.relative(ROOT, webpOut)}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
