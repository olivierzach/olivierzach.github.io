#!/usr/bin/env node
/**
 * Extract stronger paper thumbnails from rendered PDF pages.
 *
 * This is intentionally conservative: it keeps the paper cards linking to the
 * source paper/PDF and only publishes small thumbnail crops.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import matter from 'gray-matter';
import sharp from 'sharp';

const ROOT = process.cwd();
const PAPERS_MD_DIR = path.join(ROOT, 'src/content/papers');
const PAPERS_PDF_DIR = path.join(ROOT, 'public/papers');
const OUT_DIR = path.join(PAPERS_PDF_DIR, '_figures');
const TMP_DIR = path.join(ROOT, 'tmp/paper-figures');
const REPORT_PATH = path.join(ROOT, 'docs/paper-figure-extraction.md');
const WIDTHS = [240, 360];

const SKIP_LOCAL_PDF = new Set([
  // The checked-in PDF at this slug is not the Muon article.
  'orthogonalization-muon',
]);

const KEEP_EXISTING_THUMB = new Set([
  'audio-spectrogram-transformer',
  'pitfalls-machine-learning-research',
]);

const OVERRIDES = {
  'how-random-is-a-coin-toss': { page: 7, crop: 'full/upper' },
  tabpfn: { page: 6, crop: 'full/upper' },
  'underspecification-credibility-ml': { page: 8, crop: 'left/upper' },
};

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1] ?? true;
}

async function exists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d.toString()));
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`${cmd} exited ${code}: ${err || out}`));
    });
  });
}

async function updateFrontmatter(mdPath, patch) {
  const raw = await fs.readFile(mdPath, 'utf8');
  const doc = matter(raw);
  doc.data = { ...doc.data, ...patch };
  await fs.writeFile(mdPath, matter.stringify(doc.content, doc.data));
}

async function pdfPages(pdfPath) {
  const info = await run('pdfinfo', [pdfPath]);
  const match = info.match(/^Pages:\s+(\d+)/m);
  return match ? Number(match[1]) : 1;
}

async function pageHints(pdfPath) {
  try {
    const text = await run('pdftotext', ['-layout', pdfPath, '-']);
    const pages = text.split('\f');
    const hints = new Map();
    pages.forEach((pageText, i) => {
      const lower = pageText.toLowerCase();
      const hasFigure = /\b(fig\.|figure)\s*\d+/i.test(pageText);
      const hasTable = /\btable\s*\d+/i.test(pageText);
      if (!hasFigure && !hasTable) return;
      const keywordHits = [
        'architecture',
        'model',
        'overview',
        'results',
        'benchmark',
        'ablation',
        'performance',
        'attention',
        'training',
        'evolution',
        'learned',
        'comparison',
        'pipeline',
        'framework',
      ].filter((word) => lower.includes(word)).length;
      hints.set(i + 1, {
        figure: hasFigure,
        table: hasTable,
        score: (hasFigure ? 0.9 : 0.25) + Math.min(keywordHits, 3) * 0.18,
      });
    });
    return hints;
  } catch {
    return new Map();
  }
}

async function renderPage(pdfPath, slug, page) {
  const dir = path.join(TMP_DIR, slug);
  await fs.mkdir(dir, { recursive: true });
  const base = path.join(dir, `page-${String(page).padStart(3, '0')}`);
  const png = `${base}.png`;
  if (await exists(png)) return png;
  await run('pdftoppm', ['-png', '-singlefile', '-r', '130', '-f', String(page), '-l', String(page), pdfPath, base]);
  return png;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

async function scoreCrop(imagePath, crop) {
  const { data, info } = await sharp(imagePath)
    .extract(crop)
    .resize(96, 96, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let ink = 0;
  let color = 0;
  let dark = 0;
  const pixels = info.width * info.height;
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luma < 246) ink += 1;
    if (luma < 60) dark += 1;
    color += (max - min) / 255;
  }

  const inkDensity = ink / pixels;
  const darkDensity = dark / pixels;
  const colorfulness = color / pixels;
  const aspect = crop.width / crop.height;
  const aspectPenalty = aspect < 0.9 || aspect > 3.6 ? 0.25 : 0;
  const tooSparsePenalty = inkDensity < 0.025 ? 0.45 : 0;
  const tooDensePenalty = inkDensity > 0.62 ? 0.25 : 0;
  const tooDarkPenalty = darkDensity > 0.38 ? 0.25 : 0;

  const usefulInk = Math.min(inkDensity, 0.18) * 1.1;
  return usefulInk + (colorfulness * 4.0) - aspectPenalty - tooSparsePenalty - tooDensePenalty - tooDarkPenalty;
}

function candidateCrops(meta) {
  const w = meta.width;
  const h = meta.height;
  const xs = [
    [0.06, 0.94, 'full'],
    [0.06, 0.50, 'left'],
    [0.50, 0.94, 'right'],
  ];
  const ys = [
    [0.10, 0.42, 'upper'],
    [0.22, 0.58, 'mid-upper'],
    [0.36, 0.72, 'mid-lower'],
    [0.52, 0.88, 'lower'],
    [0.14, 0.86, 'page-core'],
  ];

  const crops = [];
  for (const [x0, x1, xName] of xs) {
    for (const [y0, y1, yName] of ys) {
      const left = Math.round(w * x0);
      const top = Math.round(h * y0);
      const width = Math.round(w * (x1 - x0));
      const height = Math.round(h * (y1 - y0));
      crops.push({
        name: `${xName}/${yName}`,
        left: clamp(left, 0, w - 2),
        top: clamp(top, 0, h - 2),
        width: clamp(width, 2, w - left),
        height: clamp(height, 2, h - top),
      });
    }
  }
  return crops;
}

async function extractBestFigure(slug, pdfPath) {
  const pages = await pdfPages(pdfPath);
  const hints = await pageHints(pdfPath);
  const maxPages = Math.min(pages, 12);
  const override = OVERRIDES[slug];
  let pageOrder = override ? [override.page] : [...hints.keys()].filter((p) => p <= maxPages && p > 1);
  if (!pageOrder.length) {
    for (let p = 2; p <= maxPages; p += 1) pageOrder.push(p);
  }
  if (pages === 1) pageOrder.push(1);
  if (!pageOrder.length) pageOrder.push(1);

  let best = null;
  for (const page of pageOrder) {
    const png = await renderPage(pdfPath, slug, page);
    const meta = await sharp(png).metadata();
    for (const crop of candidateCrops(meta)) {
      if (override && crop.name !== override.crop) continue;
      const score = await scoreCrop(png, crop);
      const hintBonus = hints.get(page)?.score ?? 0;
      const broadTextPenalty = crop.name.includes('page-core') ? 0.42 : 0;
      const adjusted = score + hintBonus - broadTextPenalty - (page === 2 ? 0 : Math.min(page, 8) * 0.01);
      if (!best || adjusted > best.score) {
        best = { page, crop, png, score: adjusted };
      }
    }
  }

  if (!best) throw new Error('no candidate crop');

  for (const width of WIDTHS) {
    await sharp(best.png)
      .extract(best.crop)
      .resize({ width })
      .webp({ quality: 84 })
      .toFile(path.join(OUT_DIR, `${slug}-w${width}.webp`));
  }

  return best;
}

async function writeGeneratedMuonFallback() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <rect width="900" height="600" fill="#fbfdff"/>
  <rect x="64" y="52" width="772" height="496" rx="18" fill="#ffffff" stroke="#d8dee9"/>
  <g stroke="#e5e7eb" stroke-width="1">
    <path d="M120 500H780"/><path d="M120 420H780"/><path d="M120 340H780"/><path d="M120 260H780"/><path d="M120 180H780"/>
    <path d="M180 110V500"/><path d="M300 110V500"/><path d="M420 110V500"/><path d="M540 110V500"/><path d="M660 110V500"/>
  </g>
  <path d="M140 470 C230 395 295 350 380 292 C470 230 555 176 740 130" fill="none" stroke="#60a5fa" stroke-width="7" stroke-linecap="round"/>
  <path d="M170 455 C250 430 330 402 410 372 C510 335 600 292 720 225" fill="none" stroke="#f97316" stroke-width="4" stroke-linecap="round" stroke-dasharray="12 10"/>
  <g fill="none" stroke="#111827" stroke-width="2" opacity="0.85">
    <ellipse cx="395" cy="322" rx="190" ry="70" transform="rotate(-24 395 322)"/>
    <ellipse cx="395" cy="322" rx="125" ry="45" transform="rotate(-24 395 322)"/>
    <ellipse cx="395" cy="322" rx="68" ry="24" transform="rotate(-24 395 322)"/>
  </g>
  <g stroke="#111827" stroke-width="5" stroke-linecap="round">
    <path d="M375 335L488 268"/>
    <path d="M488 268l-18 2m18-2l-7 17"/>
  </g>
  <g stroke="#0f766e" stroke-width="5" stroke-linecap="round">
    <path d="M375 335L440 240"/>
    <path d="M440 240l-3 18m3-18l-17 8"/>
  </g>
  <text x="100" y="98" fill="#111827" font-family="Arial, sans-serif" font-size="34" font-weight="700">Muon optimizer geometry</text>
  <text x="100" y="132" fill="#475569" font-family="Arial, sans-serif" font-size="18">orthogonalized hidden-layer updates</text>
  <text x="512" y="272" fill="#111827" font-family="Arial, sans-serif" font-size="17">gradient update</text>
  <text x="448" y="226" fill="#0f766e" font-family="Arial, sans-serif" font-size="17">orthogonalized update</text>
  <text x="612" y="464" fill="#64748b" font-family="Arial, sans-serif" font-size="15">small generated fallback; source page has no extractable figure</text>
</svg>`;

  for (const width of WIDTHS) {
    await sharp(Buffer.from(svg))
      .resize({ width })
      .webp({ quality: 86 })
      .toFile(path.join(OUT_DIR, `orthogonalization-muon-w${width}.webp`));
  }
}

async function main() {
  const onlySlug = arg('--slug');
  const all = !!arg('--all');
  if (!onlySlug && !all) {
    console.error('Pass --all or --slug <slug>');
    process.exit(2);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });
  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });

  const rows = [];
  const files = (await fs.readdir(PAPERS_MD_DIR)).filter((f) => f.endsWith('.md')).sort();
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    if (!all && slug !== onlySlug) continue;

    const mdPath = path.join(PAPERS_MD_DIR, file);
    const doc = matter(await fs.readFile(mdPath, 'utf8'));
    const pdfRel = doc.data.pdf;
    const pdfPath = pdfRel
      ? path.join(ROOT, 'public', pdfRel.replace(/^\//, ''))
      : path.join(PAPERS_PDF_DIR, `${slug}.pdf`);

    if (slug === 'orthogonalization-muon') {
      await writeGeneratedMuonFallback();
      const thumb = '/papers/_figures/orthogonalization-muon-w360.webp';
      await updateFrontmatter(mdPath, { thumbnail: thumb });
      rows.push({ slug, title: doc.data.title, status: 'fallback', detail: 'Generated Muon thumbnail; source page has no local/extractable PDF figure.' });
      console.log(`[fallback] ${slug}: generated fallback`);
      continue;
    }

    if (SKIP_LOCAL_PDF.has(slug) || KEEP_EXISTING_THUMB.has(slug) || !(await exists(pdfPath))) {
      const reason = KEEP_EXISTING_THUMB.has(slug)
        ? 'No strong figure crop found; kept existing thumbnail.'
        : 'No local PDF available; kept existing thumbnail.';
      await updateFrontmatter(mdPath, { thumbnail: `/papers/_thumbs/${slug}-w360.webp` });
      rows.push({ slug, title: doc.data.title, status: 'fallback', detail: 'No local PDF available; kept existing thumbnail.' });
      rows.at(-1).detail = reason;
      console.log(`[fallback] ${slug}: ${reason}`);
      continue;
    }

    try {
      const best = await extractBestFigure(slug, pdfPath);
      const thumb = `/papers/_figures/${slug}-w360.webp`;
      await updateFrontmatter(mdPath, { thumbnail: thumb });
      rows.push({
        slug,
        title: doc.data.title,
        status: 'done',
        detail: `page ${best.page}, crop ${best.crop.name}, score ${best.score.toFixed(3)}`,
      });
      console.log(`[done] ${slug}: ${rows.at(-1).detail}`);
    } catch (e) {
      rows.push({ slug, title: doc.data.title, status: 'fallback', detail: e.message });
      console.warn(`[fallback] ${slug}: ${e.message}`);
    }
  }

  const lines = [
    '# Paper Figure Extraction',
    '',
    'Small figure thumbnails extracted from local PDFs. Paper cards still link to the original paper or PDF URL.',
    '',
    '| status | paper | detail |',
    '|---|---|---|',
    ...rows.map((row) => `| ${row.status === 'done' ? '[x]' : '[ ]'} | \`${row.slug}\` | ${row.detail.replace(/\|/g, '\\|')} |`),
    '',
  ];
  await fs.writeFile(REPORT_PATH, lines.join('\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
