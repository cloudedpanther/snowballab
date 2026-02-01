import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const guides = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/data/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string()
  })
});

export const collections = { guides };
