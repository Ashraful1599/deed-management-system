import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import BookingFormClient from '@/app/_components/BookingFormClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Writer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  office_name: string | null;
  registration_number: string | null;
  district_name: string | null;
  upazila_name: string | null;
  union_name: string | null;
  avatar: string | null;
  reviews_avg_rating: number | null;
  reviews_count: number | null;
  created_at: string;
}

interface Review {
  id: number;
  rating: number;
  body: string | null;
  created_at: string;
  reviewer: { id: number; name: string; avatar: string | null } | null;
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} xmlns="http://www.w3.org/2000/svg"
          className={`${cls} ${s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
          viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API}/dolil-writers/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'Dolil Writer' };
    const data = await res.json();
    const writer: Writer = data.writer;
    const location = [writer.upazila_name, writer.district_name].filter(Boolean).join(', ');
    return {
      title: `${writer.name} — Dolil Writer in ${writer.district_name ?? 'Bangladesh'}`,
      description: `Book an appointment with ${writer.name}, a licensed dolil writer in ${location}. ${writer.reviews_count ?? 0} client reviews on DolilBD.`,
      openGraph: {
        title: `${writer.name} | DolilBD`,
        description: `Licensed dolil writer in ${location}.`,
        images: writer.avatar ? [{ url: writer.avatar }] : [],
        url: `https://dolilbd.com/dolil-writers/${id}`,
        type: 'profile',
      },
    };
  } catch {
    return { title: 'Dolil Writer | DolilBD' };
  }
}

export default async function DolilWriterDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await fetch(`${API}/dolil-writers/${id}`, { next: { revalidate: 3600 } });
  if (!res.ok) notFound();

  const data = await res.json();
  const writer: Writer = data.writer;
  const reviews: Review[] = data.reviews?.data ?? data.reviews ?? [];

  const reviewCount = writer.reviews_count ?? 0;
  const avgRating = writer.reviews_avg_rating != null ? Number(writer.reviews_avg_rating) : null;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['Person', 'LocalBusiness'],
    name: writer.name,
    jobTitle: 'Licensed Dolil Writer',
    url: `https://dolilbd.com/dolil-writers/${id}`,
    ...(writer.avatar && { image: writer.avatar }),
    address: {
      '@type': 'PostalAddress',
      ...(writer.union_name && { streetAddress: writer.union_name }),
      ...(writer.upazila_name && { addressLocality: writer.upazila_name }),
      ...(writer.district_name && { addressRegion: writer.district_name }),
      addressCountry: 'BD',
    },
    ...(avgRating != null && reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        reviewCount: String(reviewCount),
      },
    }),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader backHref="/" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Profile card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {writer.avatar ? (
              <img src={writer.avatar} alt={writer.name} className="w-24 h-24 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-3xl flex-shrink-0">
                {writer.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{writer.name}</h1>
              {writer.office_name && <p className="text-gray-500 mt-0.5">{writer.office_name}</p>}
              {writer.registration_number && (
                <span className="inline-block mt-2 text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                  Reg: {writer.registration_number}
                </span>
              )}
              {avgRating != null && reviewCount > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <StarRating rating={avgRating} size="md" />
                  <span className="font-semibold text-gray-800">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                </div>
              )}
              {(writer.district_name || writer.upazila_name || writer.union_name) && (
                <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {[writer.union_name, writer.upazila_name, writer.district_name].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {writer.phone && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Phone</p>
              <a href={`tel:${writer.phone}`} className="text-gray-800 font-medium hover:text-blue-600 transition-colors">
                {writer.phone}
              </a>
            </div>
          )}
          {writer.district_name && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Location</p>
              <div className="space-y-1">
                {writer.district_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 text-xs w-16">District</span>
                    <span className="font-medium text-gray-700">{writer.district_name}</span>
                  </div>
                )}
                {writer.upazila_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 text-xs w-16">Upazila</span>
                    <span className="font-medium text-gray-700">{writer.upazila_name}</span>
                  </div>
                )}
                {writer.union_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 text-xs w-16">Union</span>
                    <span className="font-medium text-gray-700">{writer.union_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Booking form (client component) */}
        <BookingFormClient writerId={writer.id} writerName={writer.name} />

        {/* Reviews */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              Reviews {reviewCount > 0 && <span className="text-gray-400 font-normal">({reviewCount})</span>}
            </h2>
            {avgRating != null && reviewCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                <StarRating rating={avgRating} size="sm" />
              </div>
            )}
          </div>

          {reviewCount > 0 && (
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="space-y-1.5 max-w-xs">
                {breakdown.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 w-3">{star}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full"
                        style={{ width: reviewCount > 0 ? `${(count / reviewCount) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-gray-400 w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">No reviews yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reviews.map((r) => (
                <div key={r.id} className="px-6 py-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                      {r.reviewer?.name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-800">{r.reviewer?.name ?? 'Anonymous'}</span>
                        <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                      </div>
                      <div className="mt-1"><StarRating rating={r.rating} size="sm" /></div>
                      {r.body && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.body}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pb-4">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Back to directory</Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
