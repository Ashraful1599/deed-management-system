import type { MetadataRoute } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const BASE = 'https://dolilbd.com';

async function fetchAllWriterIds(): Promise<number[]> {
  try {
    const res = await fetch(`${API}/dolil-writers?per_page=500&page=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const ids: number[] = (data.data ?? []).map((w: { id: number }) => w.id);

    const lastPage: number = data.meta?.last_page ?? 1;
    if (lastPage > 1) {
      const pages = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
      const rest = await Promise.all(
        pages.map((p) =>
          fetch(`${API}/dolil-writers?per_page=500&page=${p}`, { next: { revalidate: 3600 } })
            .then((r) => r.json())
            .then((d) => (d.data ?? []).map((w: { id: number }) => w.id))
            .catch(() => [] as number[])
        )
      );
      rest.forEach((pageIds) => ids.push(...pageIds));
    }
    return ids;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,        lastModified: new Date(), priority: 1.0, changeFrequency: 'daily' },
    { url: `${BASE}/about`,   lastModified: new Date(), priority: 0.5, changeFrequency: 'monthly' },
    { url: `${BASE}/contact`, lastModified: new Date(), priority: 0.5, changeFrequency: 'monthly' },
    { url: `${BASE}/privacy`, lastModified: new Date(), priority: 0.3, changeFrequency: 'yearly' },
    { url: `${BASE}/terms`,   lastModified: new Date(), priority: 0.3, changeFrequency: 'yearly' },
  ];

  const writerIds = await fetchAllWriterIds();
  const writerRoutes: MetadataRoute.Sitemap = writerIds.map((id) => ({
    url: `${BASE}/dolil-writers/${id}`,
    lastModified: new Date(),
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }));

  return [...staticRoutes, ...writerRoutes];
}
