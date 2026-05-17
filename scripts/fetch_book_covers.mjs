#!/usr/bin/env node
/**
 * Fetch book cover images via Open Library.
 *
 * Usage:
 *   node scripts/fetch_book_covers.mjs --all
 *   node scripts/fetch_book_covers.mjs --slug mackay-itila
 *
 * It reads src/content/books/*.md frontmatter and if `cover` is missing or points
 * to /covers/placeholder.svg, it will attempt to fetch a cover and write it to:
 *   public/covers/<slug>.jpg
 * and update the Markdown frontmatter `cover:` to that path.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const BOOKS_DIR = path.join(ROOT, 'src/content/books');
const COVERS_DIR = path.join(ROOT, 'public/covers');
const PLACEHOLDER = '/covers/placeholder.svg';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1] ?? true;
}

async function exists(p) {
  try { await fs.stat(p); return true; } catch { return false; }
}

async function openLibrarySearch({ title, authors }) {
  // Title/author search can be surprisingly brittle; fall back to a single `q` query.
  const q = new URL('https://openlibrary.org/search.json');
  const qq = [title, authors].filter(Boolean).join(' ');
  q.searchParams.set('q', qq);
  q.searchParams.set('limit', '10');
  const res = await fetch(q);
  if (!res.ok) throw new Error(`OpenLibrary search failed: ${res.status}`);
  return res.json();
}

async function download(url, outPath) {
  const res = await fetch(url);
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

  await fs.mkdir(COVERS_DIR, { recursive: true });

  const files = (await fs.readdir(BOOKS_DIR)).filter(f => f.endsWith('.md'));
  for (const f of files) {
    const thisSlug = f.replace(/\.md$/, '');
    if (!all && thisSlug !== slug) continue;

    const mdPath = path.join(BOOKS_DIR, f);
    const raw = await fs.readFile(mdPath, 'utf8');
    const doc = matter(raw);
    const title = doc.data.title;
    const authors = doc.data.authors;
    const cover = doc.data.cover;

    const needsCover = !cover || cover === PLACEHOLDER;
    if (!needsCover) continue;
    if (!title) {
      console.warn(`[skip] ${thisSlug}: missing title`);
      continue;
    }

    console.log(`[search] ${thisSlug}: ${title}`);
    const js = await openLibrarySearch({ title, authors });
    const best = (js.docs ?? []).find(d => d.cover_i) ?? (js.docs ?? [])[0];
    if (!best?.cover_i) {
      console.warn(`[miss] ${thisSlug}: no cover found on OpenLibrary`);
      continue;
    }

    const coverUrl = `https://covers.openlibrary.org/b/id/${best.cover_i}-L.jpg`;
    const outRel = `/covers/${thisSlug}.jpg`;
    const outPath = path.join(COVERS_DIR, `${thisSlug}.jpg`);

    if (!(await exists(outPath))) {
      console.log(`[dl] ${coverUrl} -> ${outRel}`);
      await download(coverUrl, outPath);
    } else {
      console.log(`[ok] cover already exists: ${outRel}`);
    }

    await updateFrontmatter(mdPath, { cover: outRel });
    console.log(`[write] updated cover in ${f}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
