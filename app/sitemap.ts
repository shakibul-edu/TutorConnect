/**
 * app/sitemap.ts
 *
 * Dynamic sitemap with sitemap-index support for >50,000 URLs.
 *
 * Next.js 14+ supports returning a MetadataRoute.Sitemap array OR
 * multiple sitemaps via sitemap index by exporting `generateSitemaps`.
 * We use `generateSitemaps` to chunk URLs when they exceed SITEMAP_CHUNK_SIZE.
 *
 * Revalidated every hour (ISR).
 */

import type { MetadataRoute } from 'next';
import {
  SITEMAP_CHUNK_SIZE,
  REVALIDATE,
} from '../lib/seo/config';
import { buildAllEntries } from '../lib/seo/sitemap-builder';

export const revalidate = 3600;

// ---------------------------------------------------------------------------
// generateSitemaps — called by Next.js to determine how many sitemaps to emit
// ---------------------------------------------------------------------------

/**
 * Next.js calls `generateSitemaps` first to know how many chunks exist,
 * then calls the default export once per chunk with the returned `id`.
 * If there is only one chunk we return a single `{ id: 0 }`.
 */
export async function generateSitemaps() {
  const entries = await buildAllEntries();
  const chunkCount = Math.max(1, Math.ceil(entries.length / SITEMAP_CHUNK_SIZE));
  return Array.from({ length: chunkCount }, (_, i) => ({ id: i }));
}

// ---------------------------------------------------------------------------
// Default export — returns the slice for the requested chunk id
// ---------------------------------------------------------------------------

export default async function sitemap({
  id,
}: {
  id: Promise<string> | string | number;
}): Promise<MetadataRoute.Sitemap> {
  // Await the id if it is a promise, to support Next.js 16+
  const resolvedId = typeof id === 'object' && id && 'then' in id ? await id : id;
  const numericId = Number(resolvedId) || 0;

  const entries = await buildAllEntries();
  const start = numericId * SITEMAP_CHUNK_SIZE;
  const end = start + SITEMAP_CHUNK_SIZE;
  return entries.slice(start, end);
}
