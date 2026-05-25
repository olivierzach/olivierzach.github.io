#!/usr/bin/env node
/**
 * Generate paper thumbnails from PDFs.
 *
 * Requirements:
 * - PDFs must exist at public/papers/<slug>.pdf (created by scripts/fetch_papers.mjs)
 *
 * Output:
 * - public/papers/_thumbs/<slug>-w240.webp (and -w360.webp)
 * - updates paper frontmatter: thumbnail: "/papers/_thumbs/<slug>-w360.webp"
 *
 * Usage:
 *   node scripts/thumb_papers.mjs --all
 *   node scripts/thumb_papers.mjs --slug orthogonalization-muon
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import sharp from 'sharp';

const ROOT = process.cwd();
const PAPERS_MD_DIR = path.join(ROOT, 'src/content/papers');
const PAPERS_PDF_DIR = path.join(ROOT, 'public/papers');
const OUT_DIR = path.join(PAPERS_PDF_DIR, '_thumbs');

const WIDTHS = [240, 360];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1] ?? true;
}

async function exists(p) {
  try { await fs.stat(p); return true; } catch { return false; }
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

  const files = (await fs.readdir(PAPERS_MD_DIR)).filter((f) => f.endsWith('.md'));
  for (const f of files) {
    const thisSlug = f.replace(/\.md$/, '');
    if (!all && thisSlug !== slug) continue;

    const mdPath = path.join(PAPERS_MD_DIR, f);
    const raw = await fs.readFile(mdPath, 'utf8');
    const doc = matter(raw);

    const pdfRel = doc.data.pdf;
    const pdfPath = pdfRel ? path.join(ROOT, 'public', pdfRel.replace(/^\//, '')) : path.join(PAPERS_PDF_DIR, `${thisSlug}.pdf`);
    if (!(await exists(pdfPath))) {
      console.warn(`[skip] ${thisSlug}: missing pdf at ${path.relative(ROOT, pdfPath)}`);
      continue;
    }

    // Render first page of PDF. Sharp supports PDFs when libvips has a PDF renderer.
    for (const w of WIDTHS) {
      const outWebp = path.join(OUT_DIR, `${thisSlug}-w${w}.webp`);
      if (await exists(outWebp)) continue;

      try {
        await sharp(pdfPath, { density: 220, page: 0 })
          .resize({ width: w })
          .webp({ quality: 82 })
          .toFile(outWebp);
        console.log(`[ok] ${thisSlug}: wrote ${path.relative(ROOT, outWebp)}`);
      } catch (e) {
        console.warn(`[fail] ${thisSlug}: could not render thumbnail (${e.message})`);
        break;
      }
    }

    const thumbRel = `/papers/_thumbs/${thisSlug}-w360.webp`;
    if (await exists(path.join(OUT_DIR, `${thisSlug}-w360.webp`))) {
      await updateFrontmatter(mdPath, { thumbnail: thumbRel });
      console.log(`[write] ${thisSlug}: thumbnail: ${thumbRel}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
