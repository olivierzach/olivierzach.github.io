#!/usr/bin/env node
/**
 * Generate paper thumbnails from PDFs using poppler (pdftoppm).
 *
 * Output:
 * - public/papers/_thumbs/<slug>-w240.webp
 * - public/papers/_thumbs/<slug>-w360.webp
 * - sets frontmatter thumbnail: "/papers/_thumbs/<slug>-w360.webp"
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import matter from 'gray-matter';
import sharp from 'sharp';

const ROOT = process.cwd();
const PAPERS_MD_DIR = path.join(ROOT, 'src/content/papers');
const PAPERS_PDF_DIR = path.join(ROOT, 'public/papers');
const OUT_DIR = path.join(PAPERS_PDF_DIR, '_thumbs');
const TMP_DIR = path.join(ROOT, 'tmp/thumbs');

const WIDTHS = [240, 360];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1] ?? true;
}

async function exists(p) {
  try { await fs.stat(p); return true; } catch { return false; }
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

async function updateFrontmatter(mdPath, patch) {
  const raw = await fs.readFile(mdPath, 'utf8');
  const doc = matter(raw);
  doc.data = { ...doc.data, ...patch };
  const next = matter.stringify(doc.content, doc.data);
  await fs.writeFile(mdPath, next);
}

async function main() {
  const slug = arg('--slug');
  const all = !!arg('--all');
  if (!slug && !all) {
    console.error('Pass --all or --slug <slug>');
    process.exit(2);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });

  const files = (await fs.readdir(PAPERS_MD_DIR)).filter((f) => f.endsWith('.md'));
  for (const f of files) {
    const thisSlug = f.replace(/\.md$/, '');
    if (!all && thisSlug !== slug) continue;

    const mdPath = path.join(PAPERS_MD_DIR, f);
    const raw = await fs.readFile(mdPath, 'utf8');
    const doc = matter(raw);

    const pdfRel = doc.data.pdf;
    const pdfPath = pdfRel
      ? path.join(ROOT, 'public', pdfRel.replace(/^\//, ''))
      : path.join(PAPERS_PDF_DIR, `${thisSlug}.pdf`);

    if (!(await exists(pdfPath))) {
      console.warn(`[skip] ${thisSlug}: missing pdf`);
      continue;
    }

    const out360 = path.join(OUT_DIR, `${thisSlug}-w360.webp`);
    if (await exists(out360)) {
      console.log(`[ok] ${thisSlug}: thumbnails already exist`);
      continue;
    }

    // Render first page to a temporary PNG using pdftoppm.
    const tmpBase = path.join(TMP_DIR, `${thisSlug}`);
    const tmpPng = `${tmpBase}.png`;

    await run('pdftoppm', ['-png', '-f', '1', '-singlefile', '-r', '180', pdfPath, tmpBase]);

    for (const w of WIDTHS) {
      const outWebp = path.join(OUT_DIR, `${thisSlug}-w${w}.webp`);
      await sharp(tmpPng)
        .resize({ width: w })
        .webp({ quality: 82 })
        .toFile(outWebp);
      console.log(`[ok] ${thisSlug}: wrote ${path.relative(ROOT, outWebp)}`);
    }

    await updateFrontmatter(mdPath, { thumbnail: `/papers/_thumbs/${thisSlug}-w360.webp` });
    console.log(`[write] ${thisSlug}: thumbnail set`);

    // cleanup tmp
    await fs.rm(tmpPng, { force: true });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
