'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

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
  reviewer: { id: number; name: string; avatar: string | null; } | null;
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

function WriterAvatar({ name, src, size = 96 }: { name: string; src?: string | null; size?: number }) {
  if (src) return <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  return (
    <div className="rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {name.charAt(0).toUpperCase()}
    </div>
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

/* ── Skeleton ── */
function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 animate-pulse">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-3 w-full">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-1/4" />
          <div className="h-4 bg-gray-100 rounded w-2/5" />
        </div>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <div className="h-3 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="h-4 bg-gray-200 rounded w-24" />
      </div>
      <div className="divide-y divide-gray-100">
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-6 py-5 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-100 rounded w-1/5" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BookingForm {
  client_name: string;
  client_phone: string;
  client_email: string;
  preferred_date: string;
  message: string;
}

function tomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export default function DeedWriterDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [writer, setWriter] = useState<Writer | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Booking form state
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    client_name: '', client_phone: '', client_email: '', preferred_date: '', message: '',
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API}/deed-writers/${id}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setWriter(data.writer);
        setReviews(data.reviews?.data ?? data.reviews ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleBooking(e: React.FormEvent) {
    e.preventDefault();
    setBookingError(null);
    setBookingSubmitting(true);
    try {
      const res = await fetch(`${API}/deed-writers/${id}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(bookingForm),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const first = body?.errors ? Object.values(body.errors as Record<string, string[]>)[0]?.[0] : null;
        setBookingError(first ?? body?.message ?? 'Failed to send appointment request.');
      } else {
        setBookingSuccess(true);
      }
    } catch {
      setBookingError('Network error. Please try again.');
    } finally {
      setBookingSubmitting(false);
    }
  }

  const reviewCount = writer?.reviews_count ?? 0;
  const avgRating   = writer?.reviews_avg_rating != null ? Number(writer.reviews_avg_rating) : null;

  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader backHref="/" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Not found */}
        {notFound && (
          <div className="py-24 text-center">
            <p className="text-lg font-semibold text-gray-700">Deed writer not found</p>
            <Link href="/" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Back to directory</Link>
          </div>
        )}

        {/* Skeleton while loading */}
        {loading && !notFound && (
          <>
            <ProfileSkeleton />
            <DetailsSkeleton />
            <ReviewsSkeleton />
          </>
        )}

        {/* Content */}
        {!loading && !notFound && writer && (
          <>
            {/* Profile card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <WriterAvatar name={writer.name} src={writer.avatar} size={96} />
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

            {/* Book an Appointment */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-800">Book an Appointment</h2>
                <p className="text-sm text-gray-500 mt-0.5">Send a request to meet with {writer.name}</p>
              </div>

              <div className="px-6 py-6">
                {bookingSuccess ? (
                  <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="font-medium text-green-800">Appointment request sent!</p>
                      <p className="text-sm text-green-700 mt-0.5">
                        {writer.name} will review your request and get back to you.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBooking} className="space-y-4">
                    {bookingError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                        {bookingError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={100}
                          value={bookingForm.client_name}
                          onChange={(e) => setBookingForm((f) => ({ ...f, client_name: e.target.value }))}
                          placeholder="Your full name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={20}
                          value={bookingForm.client_phone}
                          onChange={(e) => setBookingForm((f) => ({ ...f, client_phone: e.target.value }))}
                          placeholder="Your phone number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          maxLength={100}
                          value={bookingForm.client_email}
                          onChange={(e) => setBookingForm((f) => ({ ...f, client_email: e.target.value }))}
                          placeholder="Your email (optional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preferred Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          min={tomorrowDate()}
                          value={bookingForm.preferred_date}
                          onChange={(e) => setBookingForm((f) => ({ ...f, preferred_date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        rows={3}
                        maxLength={500}
                        value={bookingForm.message}
                        onChange={(e) => setBookingForm((f) => ({ ...f, message: e.target.value }))}
                        placeholder="Briefly describe your legal matter (optional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={bookingSubmitting}
                      className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                      {bookingSubmitting ? 'Sending...' : 'Send Appointment Request'}
                    </button>
                  </form>
                )}
              </div>
            </div>

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
          </>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
