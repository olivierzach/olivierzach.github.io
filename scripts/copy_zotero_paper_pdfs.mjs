import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import matter from 'gray-matter';

const repoRoot = new URL('..', import.meta.url).pathname;
const zoteroRoot = '/Users/statsparrot/Zotero';
const zoteroDb = '/private/tmp/zotero-import-snapshot/zotero.sqlite';
const liveZoteroDb = join(zoteroRoot, 'zotero.sqlite');
const papersDir = join(repoRoot, 'src/content/papers');
const outDir = join(repoRoot, 'public/papers');

function runSql(sql) {
  const output = execFileSync('sqlite3', ['-json', zoteroDb, sql], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
  });
  return JSON.parse(output || '[]');
}

function normalize(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function attachmentPath(row) {
  if (!row.path) return null;
  if (row.path.startsWith('storage:')) {
    return join(zoteroRoot, 'storage', row.attachmentKey, row.path.replace('storage:', ''));
  }
  return row.path;
}

function refreshSnapshot() {
  mkdirSync('/private/tmp/zotero-import-snapshot', { recursive: true });
  if (existsSync(liveZoteroDb)) copyFileSync(liveZoteroDb, zoteroDb);
}

refreshSnapshot();
mkdirSync(outDir, { recursive: true });

const attachmentRows = runSql(`
  select
    parent.itemID as itemID,
    parent.key as itemKey,
    attachment.key as attachmentKey,
    title.value as title,
    ia.path as path
  from itemAttachments ia
  join items attachment on attachment.itemID = ia.itemID
  join items parent on parent.itemID = ia.parentItemID
  join itemData titleData on titleData.itemID = parent.itemID and titleData.fieldID = 1
  join itemDataValues title on title.valueID = titleData.valueID
  where ia.contentType = 'application/pdf'
    and title.value is not null
    and ia.parentItemID is not null
    and not exists (select 1 from deletedItems d where d.itemID = parent.itemID)
`);

const attachmentsByTitle = new Map();
for (const row of attachmentRows) {
  const key = normalize(row.title);
  const pdfPath = attachmentPath(row);
  if (!pdfPath || !existsSync(pdfPath)) continue;
  if (!attachmentsByTitle.has(key)) attachmentsByTitle.set(key, pdfPath);
}

let copied = 0;
let skippedExisting = 0;
let missing = 0;

for (const file of readdirSync(papersDir)) {
  if (!file.endsWith('.md')) continue;

  const slug = basename(file, '.md');
  const mdPath = join(papersDir, file);
  const doc = matter(readFileSync(mdPath, 'utf8'));
  const pdfPath = attachmentsByTitle.get(normalize(doc.data.title));

  if (!pdfPath) {
    missing += 1;
    continue;
  }

  const outPath = join(outDir, `${slug}.pdf`);
  if (existsSync(outPath)) {
    skippedExisting += 1;
  } else {
    copyFileSync(pdfPath, outPath);
    copied += 1;
  }

  const pdf = `/papers/${slug}.pdf`;
  if (doc.data.pdf !== pdf) {
    doc.data = { ...doc.data, pdf };
    writeFileSync(mdPath, matter.stringify(doc.content, doc.data));
  }
}

console.log(JSON.stringify({
  zoteroAttachments: attachmentsByTitle.size,
  copied,
  skippedExisting,
  missing,
}, null, 2));
