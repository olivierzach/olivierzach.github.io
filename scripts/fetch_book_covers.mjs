#!/usr/bin/env node
/**
 * Fetch book cover images via explicit URLs, ISBN lookup, and Open Library.
 *
 * Usage:
 *   node scripts/fetch_book_covers.mjs --all
 *   node scripts/fetch_book_covers.mjs --slug mackay-itila
 *
 * It reads src/content/books/*.md frontmatter and if `cover` is missing or points
 * to /covers/placeholder.svg, it will attempt to fetch a cover from:
 *   1. `cover_url`
 *   2. Open Library ISBN lookup (`isbn`)
 *   3. Google Books ISBN lookup (`isbn`)
 *   4. Open Library title/author search
 * and write it to:
 *   public/covers/<slug>.jpg
 * and update the Markdown frontmatter `cover:` to that path.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import sharp from 'sharp';

const ROOT = process.cwd();
const BOOKS_DIR = path.join(ROOT, 'src/content/books');
const COVERS_DIR = path.join(ROOT, 'public/covers');
const PLACEHOLDER = '/covers/placeholder.svg';
const MIN_COVER_WIDTH = 200;

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1] ?? true;
}

async function exists(p) {
  try { await fs.stat(p); return true; } catch { return false; }
}

async function usableImage(p) {
  try {
    const meta = await sharp(p, { failOn: 'none' }).metadata();
    return (meta.width ?? 0) >= MIN_COVER_WIDTH;
  } catch {
    return false;
  }
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

function normalizeIsbn(isbn) {
  return String(isbn ?? '').replace(/[^0-9Xx]/g, '');
}

async function googleBooksCover({ isbn, title, authors }) {
  const q = new URL('https://www.googleapis.com/books/v1/volumes');
  if (isbn) {
    q.searchParams.set('q', `isbn:${normalizeIsbn(isbn)}`);
  } else {
    q.searchParams.set('q', [title, authors].filter(Boolean).join(' '));
  }
  q.searchParams.set('maxResults', '5');

  const res = await fetch(q);
  if (!res.ok) throw new Error(`Google Books search failed: ${res.status}`);
  const js = await res.json();
  const links = (js.items ?? [])
    .map((item) => item.volumeInfo?.imageLinks)
    .filter(Boolean);
  const best = links.find((link) => link.extraLarge || link.large || link.medium || link.thumbnail);
  const url = best?.extraLarge ?? best?.large ?? best?.medium ?? best?.thumbnail;
  return url ? url.replace(/^http:/, 'https:') : null;
}

async function candidateCoverUrls({ coverUrl, isbn, title, authors }) {
  const candidates = [];
  if (coverUrl) candidates.push({ label: 'cover_url', url: coverUrl });

  const cleanIsbn = normalizeIsbn(isbn);
  if (cleanIsbn) {
    candidates.push({
      label: 'openlibrary-isbn',
      url: `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`,
    });
    try {
      const googleUrl = await googleBooksCover({ isbn: cleanIsbn });
      if (googleUrl) candidates.push({ label: 'google-books-isbn', url: googleUrl });
    } catch (e) {
      console.warn(`[warn] Google Books ISBN lookup failed: ${e.message}`);
    }
  }

  try {
    const js = await openLibrarySearch({ title, authors });
    const best = (js.docs ?? []).find(d => d.cover_i) ?? (js.docs ?? [])[0];
    if (best?.cover_i) {
      candidates.push({
        label: 'openlibrary-search',
        url: `https://covers.openlibrary.org/b/id/${best.cover_i}-L.jpg`,
      });
    }
  } catch (e) {
    console.warn(`[warn] OpenLibrary search failed: ${e.message}`);
  }

  if (!candidates.length) {
    try {
      const googleUrl = await googleBooksCover({ title, authors });
      if (googleUrl) candidates.push({ label: 'google-books-search', url: googleUrl });
    } catch (e) {
      console.warn(`[warn] Google Books title lookup failed: ${e.message}`);
    }
  }

  return candidates;
}

async function download(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buf);
  if (!(await usableImage(outPath))) {
    await fs.rm(outPath, { force: true });
    throw new Error(`Downloaded image is smaller than ${MIN_COVER_WIDTH}px wide`);
  }
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
    const coverUrl = doc.data.cover_url;
    const isbn = doc.data.isbn;

    const localCoverPath = cover?.startsWith('/')
      ? path.join(ROOT, 'public', cover.replace(/^\//, ''))
      : null;
    const hasUsableCover = cover
      && cover !== PLACEHOLDER
      && (!localCoverPath || ((await exists(localCoverPath)) && (await usableImage(localCoverPath))));
    const needsCover = !hasUsableCover;
    if (!needsCover) continue;
    if (!title) {
      console.warn(`[skip] ${thisSlug}: missing title`);
      continue;
    }

    const outRel = `/covers/${thisSlug}.jpg`;
    const outPath = path.join(COVERS_DIR, `${thisSlug}.jpg`);

    if ((await exists(outPath)) && (await usableImage(outPath))) {
      console.log(`[ok] cover already exists: ${outRel}`);
    } else {
      if (await exists(outPath)) {
        console.log(`[refresh] ${thisSlug}: existing cover is too small or unreadable`);
      }
      console.log(`[search] ${thisSlug}: ${title}`);
      const candidates = await candidateCoverUrls({ coverUrl, isbn, title, authors });
      let downloaded = false;
      for (const candidate of candidates) {
        console.log(`[try] ${thisSlug}: ${candidate.label}`);
        try {
          await download(candidate.url, outPath);
          downloaded = true;
          console.log(`[dl] ${candidate.url} -> ${outRel}`);
          break;
        } catch (e) {
          console.warn(`[fail] ${thisSlug}: ${candidate.label}: ${e.message}`);
        }
      }

      if (!downloaded) {
        console.warn(`[miss] ${thisSlug}: no usable cover found`);
        continue;
      }
    }

    await updateFrontmatter(mdPath, { cover: outRel });
    console.log(`[write] updated cover in ${f}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
