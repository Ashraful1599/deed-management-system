# SEO: DolilBD Frontend
**Date:** 2026-03-28
**Status:** Approved
**Production domain:** https://dolilbd.com

## Goal

Make the public-facing Next.js frontend fully indexable and search-engine optimized so DolilBD ranks for queries like "dolil writer Dhaka", "licensed dolil writer Bangladesh", and individual writer names.

## Scope

**In scope:** All public pages — homepage, writer profiles, about, contact, privacy, terms.

**Out of scope:** Dashboard and admin pages (auth-gated, should not be indexed).

---

## Section 1 — Server Component Conversions

The two most valuable pages are currently `'use client'` components that fetch data via `useEffect`. Googlebot sees blank HTML. Both must be converted to Server Components.

### Homepage (`app/page.tsx`)

- Remove `'use client'`
- Fetch the initial writer list server-side (no filters applied) and render it as static HTML
- Extract interactive parts into a new `app/_components/HomeSearchClient.tsx` Client Component:
  - Division / district / upazila filter dropdowns
  - Pagination controls
  - When filters change, client fetches updated results and re-renders the list
- The server-rendered initial list ensures Googlebot sees real writer cards on first load

### Writer Profile (`app/dolil-writers/[id]/page.tsx`)

- Remove `'use client'`
- Add `generateMetadata` async function that fetches writer data and returns per-writer metadata
- Fetch writer data and reviews server-side
- Extract the booking form into `app/_components/BookingFormClient.tsx` Client Component (needs form state and submit handler)
- Writer profile card and reviews render as static HTML

### Contact Page (`app/contact/page.tsx`)

- Remove `'use client'`
- Extract form submit logic into `app/_components/ContactFormClient.tsx`
- Static content (address, email, phone) renders server-side

### About, Privacy, Terms (`app/about/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`)

- Already static, no structural change needed
- Add `metadata` exports only

---

## Section 2 — Metadata Strategy

### Root Layout (`app/layout.tsx`)

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://dolilbd.com'),
  title: {
    default: 'DolilBD — Find Licensed Dolil Writers in Bangladesh',
    template: '%s | DolilBD',
  },
  description: "Bangladesh's trusted platform for finding licensed dolil writers across all 64 districts.",
  openGraph: {
    siteName: 'DolilBD',
    type: 'website',
    locale: 'en_BD',
  },
  twitter: { card: 'summary_large_image' },
};
```

### Per-page metadata exports

| Page | Title | Description |
|------|-------|-------------|
| Homepage | `Find Licensed Dolil Writers in Bangladesh` | Directory of verified licensed dolil writers. Search by division, district, and upazila. |
| About | `About DolilBD` | Bangladesh's first online directory for licensed dolil writers... |
| Contact | `Contact DolilBD` | Get in touch with the DolilBD team. |
| Privacy | `Privacy Policy` | How DolilBD collects and uses your data. |
| Terms | `Terms of Service` | Terms and conditions for using DolilBD. |

### Dynamic metadata — Writer profiles

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const writer = await fetchWriter(params.id);
  const location = [writer.upazila_name, writer.district_name].filter(Boolean).join(', ');
  return {
    title: `${writer.name} — Dolil Writer in ${writer.district_name}`,
    description: `Book an appointment with ${writer.name}, a licensed dolil writer in ${location}. ${writer.reviews_count ?? 0} client reviews.`,
    openGraph: {
      title: `${writer.name} | DolilBD`,
      description: `Licensed dolil writer in ${location}.`,
      images: writer.avatar ? [{ url: writer.avatar }] : [],
      url: `https://dolilbd.com/dolil-writers/${params.id}`,
    },
  };
}
```

---

## Section 3 — Technical SEO Files

### `app/sitemap.ts`

Dynamic sitemap with two parts:
1. Static routes: `/`, `/about`, `/contact`, `/privacy`, `/terms`
2. Dynamic routes: fetch all writer IDs from `GET /api/dolil-writers?per_page=1000` and generate `/dolil-writers/{id}` entries

Each entry includes `lastModified` (current date for static, `updated_at` from API for writers) and `priority` (1.0 for homepage, 0.8 for writer profiles, 0.5 for static pages).

### `app/robots.ts`

```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/login', '/register', '/forgot-password'],
      },
    ],
    sitemap: 'https://dolilbd.com/sitemap.xml',
  };
}
```

---

## Section 4 — Structured Data (JSON-LD)

### Homepage

`WebSite` schema injected via `<script type="application/ld+json">` in the page:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "DolilBD",
  "url": "https://dolilbd.com",
  "description": "Bangladesh's directory of licensed dolil writers"
}
```

### Writer Profile

`Person` + `LocalBusiness` schema:

```json
{
  "@context": "https://schema.org",
  "@type": ["Person", "LocalBusiness"],
  "name": "{writer.name}",
  "jobTitle": "Licensed Dolil Writer",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "{upazila_name}",
    "addressRegion": "{district_name}",
    "addressCountry": "BD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{avg_rating}",
    "reviewCount": "{reviews_count}"
  }
}
```

Only include `aggregateRating` when `reviews_count > 0`.

---

## Section 5 — Open Graph / Social Sharing

Handled via the `metadata` exports in Section 2. Each public page gets:
- `openGraph.title`, `openGraph.description`, `openGraph.url`, `openGraph.type`
- `twitter.card: 'summary_large_image'`
- Writer profiles get the writer's avatar as `openGraph.images` when available

No separate OG image generation (no `opengraph-image.tsx`) — writer avatars serve as profile images and the site description covers the rest.

---

## Files to Create / Modify

| Action | File |
|--------|------|
| Modify | `app/layout.tsx` |
| Modify | `app/page.tsx` |
| Modify | `app/dolil-writers/[id]/page.tsx` |
| Modify | `app/contact/page.tsx` |
| Modify | `app/about/page.tsx` |
| Modify | `app/privacy/page.tsx` |
| Modify | `app/terms/page.tsx` |
| Create | `app/_components/HomeSearchClient.tsx` |
| Create | `app/_components/BookingFormClient.tsx` |
| Create | `app/_components/ContactFormClient.tsx` |
| Create | `app/sitemap.ts` |
| Create | `app/robots.ts` |

---

## Success Criteria

- `curl https://dolilbd.com` returns writer cards in the HTML (not empty divs)
- `curl https://dolilbd.com/dolil-writers/1` returns writer name and details in HTML
- `https://dolilbd.com/sitemap.xml` returns valid XML with all writer profile URLs
- `https://dolilbd.com/robots.txt` disallows dashboard/admin routes
- Each page has a unique `<title>` and `<meta name="description">`
- Writer profiles have JSON-LD structured data in the HTML source
