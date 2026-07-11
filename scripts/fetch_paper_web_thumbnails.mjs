#!/usr/bin/env node
/**
 * Generate thumbnails for web-only paper/article entries.
 *
 * This is for entries that do not have a local PDF, so the Poppler thumbnail
 * path cannot render a first page. Prefer real source-page images; use a
 * source-page card only when the publisher blocks PDF/figure access.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import sharp from 'sharp';

const ROOT = process.cwd();
const PAPERS_DIR = path.join(ROOT, 'src/content/papers');
const OUT_DIR = path.join(ROOT, 'public/papers/_thumbs');
const WIDTHS = [240, 360];
const HEIGHT_RATIO = 466 / 360;

const SOURCES = {
  'annotated-transformer': {
    type: 'first-image',
    page: 'https://nlp.seas.harvard.edu/annotated-transformer/',
  },
  'cs231n-convolutional-neural-networks': {
    type: 'image',
    image: 'https://cs231n.github.io/assets/cnn/convnet.jpeg',
  },
  'dynamic-deephit': {
    type: 'card',
    label: 'IEEE Xplore source page',
  },
  'first-law-complexodynamics': {
    type: 'image',
    image: 'https://scottaaronson.blog/complexity-small.jpg',
  },
  'understanding-lstm-networks': {
    type: 'image',
    image: 'https://colah.github.io/posts/2015-08-Understanding-LSTMs/img/LSTM3-chain.png',
  },
  'unreasonable-effectiveness-rnns': {
    type: 'image',
    image: 'https://karpathy.github.io/assets/rnn/diags.jpeg',
  },
};

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1] ?? true;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function absolutize(src, base) {
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

function dataUrlToBuffer(src) {
  const match = src.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!match) return null;
  const encoded = match[3];
  if (match[2]) return Buffer.from(encoded, 'base64');
  return Buffer.from(decodeURIComponent(encoded));
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function firstImageFromPage(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  const html = await res.text();
  const base = res.url || url;
  const match = html.match(/<img\b[^>]*?src=["']([^"']+)["'][^>]*>/i);
  if (!match) throw new Error(`No image found: ${url}`);
  const src = match[1];
  if (src.startsWith('data:')) return dataUrlToBuffer(src);
  const imageUrl = absolutize(src, base);
  if (!imageUrl) throw new Error(`Invalid image URL: ${src}`);
  return fetchBuffer(imageUrl);
}

function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 7);
}

function cardSvg({ title, label, link }) {
  const lines = wrapText(title, 29);
  const titleLines = lines.map((line, index) =>
    `<text x="28" y="${104 + index * 32}" class="title">${escapeHtml(line)}</text>`
  ).join('');
  const host = link ? new URL(link).hostname.replace(/^www\./, '') : '';

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="466" viewBox="0 0 360 466">
  <rect width="360" height="466" fill="#f6f7f4"/>
  <rect x="0" y="0" width="360" height="72" fill="#20242a"/>
  <rect x="28" y="35" width="86" height="5" fill="#7aa6b8"/>
  <rect x="28" y="48" width="132" height="5" fill="#d7a84f"/>
  <text x="28" y="86" class="label">${escapeHtml(label)}</text>
  ${titleLines}
  <text x="28" y="415" class="host">${escapeHtml(host)}</text>
  <style>
    text { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .label { fill: #697177; font-size: 13px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
    .title { fill: #14171a; font-size: 25px; font-weight: 760; }
    .host { fill: #697177; font-size: 15px; font-weight: 600; }
  </style>
</svg>`);
}

async function updateFrontmatter(mdPath, patch) {
  const raw = await fs.readFile(mdPath, 'utf8');
  const doc = matter(raw);
  doc.data = { ...doc.data, ...patch };
  const next = matter.stringify(doc.content, doc.data);
  await fs.writeFile(mdPath, next);
}

async function sourceBuffer(slug, doc) {
  const source = SOURCES[slug];
  if (!source) return null;
  if (source.type === 'image') return fetchBuffer(source.image);
  if (source.type === 'first-image') return firstImageFromPage(source.page);
  if (source.type === 'card') {
    return cardSvg({
      title: doc.data.title,
      label: source.label,
      link: doc.data.link,
    });
  }
  return null;
}

async function main() {
  const requestedSlug = arg('--slug');
  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const slug of Object.keys(SOURCES)) {
    if (requestedSlug && requestedSlug !== slug) continue;

    const mdPath = path.join(PAPERS_DIR, `${slug}.md`);
    const raw = await fs.readFile(mdPath, 'utf8');
    const doc = matter(raw);
    const input = await sourceBuffer(slug, doc);
    if (!input) continue;

    for (const width of WIDTHS) {
      const height = Math.round(width * HEIGHT_RATIO);
      const outPath = path.join(OUT_DIR, `${slug}-w${width}.webp`);
      await sharp(input, { animated: false })
        .rotate()
        .resize({
          width,
          height,
          fit: 'contain',
          background: '#ffffff',
        })
        .webp({ quality: 84 })
        .toFile(outPath);
      console.log(`[ok] ${slug}: wrote ${path.relative(ROOT, outPath)}`);
    }

    await updateFrontmatter(mdPath, {
      thumbnail: `/papers/_thumbs/${slug}-w360.webp`,
    });
    console.log(`[write] ${slug}: thumbnail set`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
