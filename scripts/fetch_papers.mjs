#!/usr/bin/env node
/**
 * Fetch paper PDFs (best effort) based on src/content/papers/*.md frontmatter.
 *
 * Usage:
 *   node scripts/fetch_papers.mjs --all
 *   node scripts/fetch_papers.mjs --slug orthogonalization-muon
 *
 * Behavior:
 * - Reads `link:` from frontmatter.
 * - If link is arXiv abstract (https://arxiv.org/abs/...), downloads the PDF.
 * - If link ends with .pdf, downloads directly.
 * - Saves to public/papers/<slug>.pdf
 * - Adds/updates `pdf:` field in frontmatter as /papers/<slug>.pdf
 *
 * Notes:
 * - For publisher pages without a direct PDF link, this will usually fail.
 * - This script is intended for open-access content (arXiv etc.).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const PAPERS_DIR = path.join(ROOT, 'src/content/papers');
const OUT_DIR = path.join(ROOT, 'public/papers');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1] ?? true;
}

async function exists(p) {
  try { await fs.stat(p); return true; } catch { return false; }
}

function toPdfUrl(link) {
  try {
    const u = new URL(link);
    if (u.hostname === 'arxiv.org' && u.pathname.startsWith('/abs/')) {
      const id = u.pathname.replace('/abs/', '').replace(/v\d+$/, '');
      return `https://arxiv.org/pdf/${id}.pdf`;
    }
    if (u.pathname.endsWith('.pdf')) return link;
  } catch {}
  return null;
}

async function download(url, outPath) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buf);
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

  const files = (await fs.readdir(PAPERS_DIR)).filter(f => f.endsWith('.md'));
  for (const f of files) {
    const thisSlug = f.replace(/\.md$/, '');
    if (!all && thisSlug !== slug) continue;

    const mdPath = path.join(PAPERS_DIR, f);
    const raw = await fs.readFile(mdPath, 'utf8');
    const doc = matter(raw);

    const link = doc.data.link;
    const explicit = doc.data.pdf_url;

    if (!link && !explicit) {
      console.warn(`[skip] ${thisSlug}: no link: or pdf_url:`);
      continue;
    }

    const pdfUrl = explicit ?? toPdfUrl(link);
    if (!pdfUrl) {
      console.warn(`[skip] ${thisSlug}: can't infer PDF URL from link (${link})`);
      continue;
    }

    const outRel = `/papers/${thisSlug}.pdf`;
    const outPath = path.join(OUT_DIR, `${thisSlug}.pdf`);

    if (!(await exists(outPath))) {
      console.log(`[dl] ${thisSlug}: ${pdfUrl}`);
      try {
        await download(pdfUrl, outPath);
      } catch (e) {
        console.warn(`[fail] ${thisSlug}: ${e.message}`);
        continue;
      }
    } else {
      console.log(`[ok] ${thisSlug}: already downloaded`);
    }

    await updateFrontmatter(mdPath, { pdf: outRel });
    console.log(`[write] ${thisSlug}: pdf: ${outRel}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
