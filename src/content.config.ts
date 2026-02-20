import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const normalizeId = ({ entry }: { entry: string }) =>
  entry.replace(/\/index\.mdx?$/, '').replace(/\.mdx?$/, '');

const contentSchema = ({ image }: any) =>
  z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    heroImage: image().optional(),
  });

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}', generateId: normalizeId }),
  schema: contentSchema,
});

const talks = defineCollection({
  loader: glob({ base: './src/content/talks', pattern: '**/*.{md,mdx}', generateId: normalizeId }),
  schema: contentSchema,
});

const books = defineCollection({
  loader: glob({ base: './src/content/books', pattern: '**/*.{md,mdx}', generateId: normalizeId }),
  schema: contentSchema,
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}', generateId: normalizeId }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { blog, talks, books, pages };
