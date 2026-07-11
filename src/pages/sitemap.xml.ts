import { getCollection } from 'astro:content';

const staticPages = [
  '',
  'about/',
  'contact/',
  'cv/',
  'influences/',
  'ml-systems/',
  'now/',
  'papers/',
  'projects/',
  'writing/',
];

function urlXml(loc: string, priority = '0.7') {
  return `  <url>
    <loc>${loc}</loc>
    <priority>${priority}</priority>
  </url>`;
}

export async function GET({ site }) {
  const base = site?.toString() ?? 'https://olivierzach.github.io/';
  const projects = await getCollection('projects');
  const writing = await getCollection('writing');
  const books = await getCollection('books');

  const urls = [
    ...staticPages.map((path) => urlXml(new URL(path, base).toString(), path === '' ? '1.0' : '0.8')),
    ...projects.map((entry) => urlXml(new URL(`projects/${entry.id}/`, base).toString(), '0.75')),
    ...writing
      .filter((entry) => !entry.data.draft)
      .map((entry) => urlXml(new URL(`writing/${entry.id}/`, base).toString(), '0.65')),
    ...books.map((entry) => urlXml(new URL(`influences/books/${entry.id}/`, base).toString(), '0.55')),
  ];

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
