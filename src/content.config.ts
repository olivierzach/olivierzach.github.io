import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(['active', 'paused', 'archived']).default('active'),
    tags: z.array(z.string()).default([]),
    github: z.string().url().optional(),
    demo: z.string().url().optional(),
    date: z.coerce.date().optional(),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const papers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/papers' }),
  schema: z.object({
    title: z.string(),
    authors: z.string().optional(),
    year: z.number().int().optional(),
    link: z.string().url(),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date().optional(),
  }),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({
    title: z.string(),
    authors: z.string().optional(),
    year: z.number().int().optional(),
    cover: z.string().optional(), // e.g. "/covers/mackay-itila.jpg"
    link: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    rating: z.number().min(1).max(5).optional(),
  }),
});

export const collections = { projects, writing, papers, books };
