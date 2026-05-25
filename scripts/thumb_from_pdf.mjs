#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public/papers/_thumbs');
const TMP_DIR = path.join(ROOT, 'tmp/thumbs');
const WIDTHS = [240, 360];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1] ?? true;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}: ${err}`));
    });
  });
}

const slug = arg('--slug');
const pdf = arg('--pdf');

if (!slug || !pdf) {
  console.error('Usage: node scripts/thumb_from_pdf.mjs --slug <slug> --pdf <path>');
  process.exit(2);
}

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.mkdir(TMP_DIR, { recursive: true });

const pdfPath = path.resolve(pdf);
const tmpBase = path.join(TMP_DIR, slug);
const tmpPng = `${tmpBase}.png`;

await run('pdftoppm', ['-png', '-f', '1', '-singlefile', '-r', '180', pdfPath, tmpBase]);

for (const width of WIDTHS) {
  await sharp(tmpPng)
    .resize({ width })
    .webp({ quality: 82 })
    .toFile(path.join(OUT_DIR, `${slug}-w${width}.webp`));
}

await fs.rm(tmpPng, { force: true });
console.log(`wrote thumbnails for ${slug}`);
