import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import matter from 'gray-matter';

const repoRoot = new URL('..', import.meta.url).pathname;
const defaultZoteroDb = '/Users/statsparrot/Zotero/zotero.sqlite';
const snapshotDir = '/private/tmp/zotero-import-snapshot';
const snapshotDb = join(snapshotDir, 'zotero.sqlite');
const papersDir = join(repoRoot, 'src/content/papers');
const thumbDir = join(repoRoot, 'public/papers/_generated');

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...valueParts] = arg.split('=');
    return [key.replace(/^--/, ''), valueParts.join('=') || 'true'];
  }),
);

const sourceDb = args.get('db') || defaultZoteroDb;
const limit = Number.parseInt(args.get('limit') || '100', 10);
const prune = args.get('prune') !== 'false';

function runSql(dbPath, sql) {
  const output = execFileSync('sqlite3', ['-json', dbPath, sql], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
  return JSON.parse(output || '[]');
}

function normalizeText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function slugify(value) {
  const slug = normalizeText(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
    .replace(/-+$/g, '');
  return slug || 'zotero-paper';
}

function yamlQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapText(value, maxChars, maxLines) {
  const words = normalizeText(value).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

function yearFromDate(value) {
  const match = String(value || '').match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}

function linkFor(row) {
  const url = normalizeText(row.url);
  if (url) return url;

  const archiveID = normalizeText(row.archiveID);
  const arxiv = archiveID.match(/(?:arXiv:)?([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)/i);
  if (arxiv) return `https://arxiv.org/abs/${arxiv[1]}`;

  const doi = normalizeText(row.DOI);
  if (doi) return `https://doi.org/${doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')}`;

  return undefined;
}

function pdfFor(link) {
  const match = String(link || '').match(/arxiv\.org\/abs\/([^?#]+)/i);
  return match ? `https://arxiv.org/pdf/${match[1]}.pdf` : undefined;
}

function tagsFor(row) {
  const base = ['zotero-import', row.typeName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)];
  const zoteroTags = String(row.tags || '')
    .split('|')
    .map((tag) => slugify(tag))
    .filter((tag) => tag && tag.length <= 40);
  return [...new Set([...base, ...zoteroTags])].slice(0, 8);
}

function existingPapers() {
  const byTitle = new Set();
  const byLink = new Set();
  const byTitleInfo = new Map();
  const byLinkInfo = new Map();
  const zoteroFiles = new Map();
  const slugs = new Set();

  for (const file of readdirSync(papersDir)) {
    if (!file.endsWith('.md')) continue;
    slugs.add(basename(file, '.md'));
    const filePath = join(papersDir, file);
    const parsed = matter(readFileSync(join(papersDir, file), 'utf8'));
    const info = { filePath, data: parsed.data };
    const tags = Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [];
    if (tags.includes('zotero-import')) zoteroFiles.set(filePath, info);
    if (parsed.data.title) {
      const titleKey = normalizeKey(parsed.data.title);
      byTitle.add(titleKey);
      byTitleInfo.set(titleKey, info);
    }
    if (parsed.data.link) {
      const linkKey = String(parsed.data.link).toLowerCase();
      byLink.add(linkKey);
      byLinkInfo.set(linkKey, info);
    }
    if (parsed.data.pdf_url) byLink.add(String(parsed.data.pdf_url).toLowerCase());
  }

  return { byTitle, byLink, byTitleInfo, byLinkInfo, zoteroFiles, slugs };
}

function ensureSnapshot() {
  mkdirSync(snapshotDir, { recursive: true });
  copyFileSync(sourceDb, snapshotDb);
  return snapshotDb;
}

function uniqueSlug(base, used) {
  let candidate = base;
  let index = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  used.add(candidate);
  return candidate;
}

const dbPath = existsSync(sourceDb) ? ensureSnapshot() : sourceDb;
const existing = existingPapers();
mkdirSync(thumbDir, { recursive: true });

function writeThumbnail(slug, row) {
  const palette = [
    ['#111111', '#1d3b35', '#6ee7d8'],
    ['#101010', '#3b2f1d', '#f4b860'],
    ['#111111', '#3b1f28', '#f97373'],
    ['#101010', '#253044', '#9db7ff'],
  ];
  const seed = [...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const [bg, band, accent] = palette[seed % palette.length];
  const titleLines = wrapText(row.title, 24, 6);
  const authorLine = wrapText(row.authors || '', 32, 1)[0] || row.typeName;
  const year = yearFromDate(row.date) || '';
  const titleSvg = titleLines
    .map((line, index) => `<text x="28" y="${88 + index * 30}" class="title">${xmlEscape(line)}</text>`)
    .join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="540" viewBox="0 0 360 540" role="img" aria-label="${xmlEscape(row.title)}">
  <style>
    .kicker{font:700 13px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0;fill:${accent}}
    .title{font:700 24px ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;letter-spacing:0;fill:#f3f1ea}
    .meta{font:500 14px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0;fill:#bbb7aa}
  </style>
  <rect width="360" height="540" fill="${bg}"/>
  <rect x="0" y="0" width="360" height="16" fill="${accent}"/>
  <rect x="24" y="54" width="312" height="392" rx="8" fill="${band}" opacity="0.72"/>
  <path d="M28 468H332" stroke="${accent}" stroke-width="2"/>
  <text x="28" y="54" class="kicker">${xmlEscape(row.typeName.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`).trim().toUpperCase())}</text>
  ${titleSvg}
  <text x="28" y="492" class="meta">${xmlEscape(authorLine)}</text>
  <text x="28" y="516" class="meta">${xmlEscape(String(year))}</text>
</svg>
`;
  writeFileSync(join(thumbDir, `${slug}.svg`), svg);
  return `/papers/_generated/${slug}.svg`;
}

const rows = runSql(dbPath, `
  select
    i.itemID,
    i.key,
    it.typeName,
    i.dateAdded,
    title.value as title,
    date.value as date,
    doi.value as DOI,
    url.value as url,
    archiveID.value as archiveID,
    (
      select group_concat(name, ', ')
      from (
        select
          case
            when c.fieldMode = 1 then c.lastName
            else trim(coalesce(c.firstName, '') || ' ' || coalesce(c.lastName, ''))
          end as name
        from itemCreators ic
        join creators c on c.creatorID = ic.creatorID
        where ic.itemID = i.itemID
        order by ic.orderIndex
      )
      where name is not null and name != ''
    ) as authors,
    (
      select group_concat(t.name, '|')
      from itemTags itemTag
      join tags t on t.tagID = itemTag.tagID
      where itemTag.itemID = i.itemID
      order by t.name
    ) as tags
  from items i
  join itemTypes it on it.itemTypeID = i.itemTypeID
  left join itemData titleData on titleData.itemID = i.itemID and titleData.fieldID = 1
  left join itemDataValues title on title.valueID = titleData.valueID
  left join itemData dateData on dateData.itemID = i.itemID and dateData.fieldID = 6
  left join itemDataValues date on date.valueID = dateData.valueID
  left join itemData doiData on doiData.itemID = i.itemID and doiData.fieldID = 8
  left join itemDataValues doi on doi.valueID = doiData.valueID
  left join itemData urlData on urlData.itemID = i.itemID and urlData.fieldID = 10
  left join itemDataValues url on url.valueID = urlData.valueID
  left join itemData archiveData on archiveData.itemID = i.itemID and archiveData.fieldID = 107
  left join itemDataValues archiveID on archiveID.valueID = archiveData.valueID
  where it.typeName in ('journalArticle', 'preprint', 'conferencePaper')
    and title.value is not null
    and not exists (select 1 from deletedItems d where d.itemID = i.itemID)
  order by i.dateAdded desc, i.itemID desc;
`);

let imported = 0;
let refreshed = 0;
let skippedDuplicate = 0;
let skippedNoLink = 0;
const keptFiles = new Set();

for (const row of rows) {
  if (Number.isFinite(limit) && keptFiles.size >= limit) break;

  const title = normalizeText(row.title);
  const link = linkFor(row);
  if (!link) {
    skippedNoLink += 1;
    continue;
  }

  const titleKey = normalizeKey(title);
  const linkKey = link.toLowerCase();
  if (existing.byTitle.has(titleKey) || existing.byLink.has(linkKey)) {
    const existingInfo = existing.byTitleInfo.get(titleKey) || existing.byLinkInfo.get(linkKey);
    const importedTags = Array.isArray(existingInfo?.data.tags) ? existingInfo.data.tags.map(String) : [];
    if (!importedTags.includes('zotero-import')) {
      skippedDuplicate += 1;
      continue;
    }
  }

  const year = yearFromDate(row.date);
  const authors = normalizeText(row.authors);
  const pdf = pdfFor(link);
  const tags = tagsFor(row);
  const existingInfo = existing.byTitleInfo.get(titleKey) || existing.byLinkInfo.get(linkKey);
  const existingTags = Array.isArray(existingInfo?.data.tags) ? existingInfo.data.tags.map(String) : [];
  const filePath = existingTags.includes('zotero-import')
    ? existingInfo.filePath
    : join(papersDir, `${uniqueSlug(slugify(title), existing.slugs)}.md`);
  const slug = basename(filePath, '.md');
  const thumbnail = writeThumbnail(slug, row);
  const frontmatter = [
    '---',
    `title: ${yamlQuote(title)}`,
    authors ? `authors: ${yamlQuote(authors)}` : null,
    year ? `year: ${year}` : null,
    `link: ${yamlQuote(link)}`,
    pdf ? `pdf_url: ${yamlQuote(pdf)}` : null,
    `thumbnail: ${yamlQuote(thumbnail)}`,
    'tags:',
    ...tags.map((tag) => `  - ${yamlQuote(tag)}`),
    '---',
    '',
  ].filter((line) => line !== null).join('\n');

  writeFileSync(filePath, frontmatter);
  keptFiles.add(filePath);
  existing.byTitle.add(titleKey);
  existing.byLink.add(linkKey);
  if (existingInfo) {
    refreshed += 1;
  } else {
    imported += 1;
  }
}

let pruned = 0;
if (prune) {
  for (const filePath of existing.zoteroFiles.keys()) {
    if (keptFiles.has(filePath)) continue;
    unlinkSync(filePath);
    pruned += 1;
  }
}

console.log(JSON.stringify({
  sourceDb,
  snapshotDb: dbPath,
  considered: rows.length,
  selected: keptFiles.size,
  imported,
  refreshed,
  pruned,
  skippedDuplicate,
  skippedNoLink,
}, null, 2));
