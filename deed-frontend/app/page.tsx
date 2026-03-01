'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Division { id: number; name: string; bn_name: string; }
interface District { id: number; division_id: number; division: string; name: string; bn_name: string; }
interface Upazila  { id: number; district_id: number; name: string; bn_name: string; }

interface DeedWriter {
  id: number;
  name: string;
  office_name: string | null;
  registration_number: string | null;
  division_name: string | null;
  district_name: string | null;
  upazila_name: string | null;
  avatar: string | null;
  reviews_avg_rating: number | null;
  reviews_count: number | null;
}

interface PaginatedResponse {
  data: DeedWriter[];
  meta: { current_page: number; last_page: number; total: number; };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} xmlns="http://www.w3.org/2000/svg"
          className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300'}`}
          viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function WriterAvatar({ name, src }: { name: string; src?: string | null }) {
  if (src) return <img src={src} alt={name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />;
  return (
    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-2/3" />
      <div className="h-3 bg-gray-100 rounded w-1/3 mt-auto pt-2 border-t border-gray-50" />
    </div>
  );
}

const selectCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

const stats = [
  { value: '64', label: 'Districts Covered' },
  { value: '500+', label: 'Registered Writers' },
  { value: '10K+', label: 'Clients Served' },
  { value: '100%', label: 'Licensed & Verified' },
];

const steps = [
  {
    step: '01',
    title: 'Search by Location',
    desc: 'Use our filters to find deed writers in your district, upazila, or union. Search by name or office.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'View Profile & Reviews',
    desc: 'Check credentials, registration numbers, location details, and real client reviews before deciding.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Book an Appointment',
    desc: 'Send a request directly from the profile page. The writer will confirm and reach out to you.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [upazilas, setUpazilas]   = useState<Upazila[]>([]);

  const [divisionId, setDivisionId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [upazilaId,  setUpazilaId]  = useState('');
  const [search, setSearch]         = useState('');

  const [writers,  setWriters]  = useState<DeedWriter[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total,    setTotal]    = useState(0);

  useEffect(() => {
    fetch(`${API}/locations/divisions`).then((r) => r.json()).then(setDivisions).catch(() => {});
  }, []);

  useEffect(() => {
    setDistrictId(''); setUpazilaId('');
    setDistricts([]); setUpazilas([]);
    if (!divisionId) return;
    fetch(`${API}/locations/divisions/${divisionId}/districts`).then((r) => r.json()).then(setDistricts).catch(() => {});
  }, [divisionId]);

  useEffect(() => {
    setUpazilaId(''); setUpazilas([]);
    if (!districtId) return;
    fetch(`${API}/locations/districts/${districtId}/upazilas`).then((r) => r.json()).then(setUpazilas).catch(() => {});
  }, [districtId]);

  const fetchWriters = useCallback((pageNum = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pageNum), per_page: '12' });
    if (divisionId) params.set('division_id', divisionId);
    if (districtId) params.set('district_id', districtId);
    if (upazilaId)  params.set('upazila_id', upazilaId);
    if (search)     params.set('search', search);
    fetch(`${API}/deed-writers?${params}`)
      .then((r) => r.json())
      .then((res: PaginatedResponse) => {
        setWriters(res.data);
        setLastPage(res.meta?.last_page ?? 1);
        setTotal(res.meta?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [divisionId, districtId, upazilaId, search]);

  useEffect(() => { setPage(1); fetchWriters(1); }, [divisionId, districtId, upazilaId]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchWriters(1);
  }

  function handleReset() {
    setDivisionId(''); setDistrictId(''); setUpazilaId(''); setSearch('');
    setDistricts([]); setUpazilas([]);
  }

  function goPage(p: number) {
    setPage(p);
    fetchWriters(p);
    document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-3xl">
            <span className="inline-block text-blue-200 text-sm font-semibold tracking-wide uppercase mb-4">
              Bangladesh&apos;s Legal Document Platform
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-5">
              Find a Licensed<br className="hidden sm:block" /> Deed Writer Near You
            </h1>
            <p className="text-blue-100 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
              Connect with verified deed writers across all 64 districts of Bangladesh.
              View credentials, read real reviews, and book an appointment — all in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#directory"
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find a Deed Writer
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 border border-blue-300 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors"
              >
                How It Works
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
            {stats.map(({ value, label }) => (
              <div key={label} className="py-6 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-blue-600">{value}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-14 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">
              Getting help from a licensed deed writer has never been easier. Three simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((s) => (
              <div key={s.step} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-4">
                  {s.icon}
                </div>
                <p className="text-xs font-bold text-blue-400 tracking-widest mb-2">STEP {s.step}</p>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Directory ── */}
      <section id="directory" className="py-12 sm:py-16 bg-white flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Find a Deed Writer</h2>
            <p className="text-gray-500 mt-1">Browse licensed deed writers across Bangladesh by location</p>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 sm:p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Division</label>
                <select value={divisionId} onChange={(e) => setDivisionId(e.target.value)} className={selectCls}>
                  <option value="">All Divisions</option>
                  {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">District</label>
                <select value={districtId} onChange={(e) => setDistrictId(e.target.value)} disabled={!divisionId}
                  className={`${selectCls} disabled:bg-gray-100 disabled:text-gray-400`}>
                  <option value="">All Districts</option>
                  {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Upazila / Thana</label>
                <select value={upazilaId} onChange={(e) => setUpazilaId(e.target.value)} disabled={!districtId}
                  className={`${selectCls} disabled:bg-gray-100 disabled:text-gray-400`}>
                  <option value="">All Upazilas</option>
                  {upazilas.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Search by Name</label>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name, office..." className={`${selectCls} flex-1`} />
                  <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
            {(divisionId || districtId || upazilaId || search) && (
              <div className="mt-3 flex justify-end">
                <button onClick={handleReset}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors cursor-pointer bg-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {!loading && total > 0 && (
            <p className="text-sm text-gray-500 mb-4">{total} deed writer{total !== 1 ? 's' : ''} found</p>
          )}

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && writers.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-500 font-medium">No deed writers found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search term</p>
            </div>
          )}

          {!loading && writers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {writers.map((w) => (
                <Link key={w.id} href={`/deed-writers/${w.id}`}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <WriterAvatar name={w.name} src={w.avatar} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{w.name}</p>
                      {w.office_name && <p className="text-xs text-gray-500 truncate mt-0.5">{w.office_name}</p>}
                      {w.registration_number && <p className="text-xs text-blue-600 mt-0.5">Reg: {w.registration_number}</p>}
                    </div>
                  </div>

                  {(w.district_name || w.upazila_name) && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{[w.upazila_name, w.district_name].filter(Boolean).join(', ')}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                    {w.reviews_avg_rating != null && w.reviews_count != null && w.reviews_count > 0 ? (
                      <>
                        <StarRating rating={w.reviews_avg_rating} />
                        <span className="text-xs text-gray-500">
                          {Number(w.reviews_avg_rating).toFixed(1)} ({w.reviews_count} review{w.reviews_count !== 1 ? 's' : ''})
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No reviews yet</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => goPage(page - 1)} disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Previous
              </button>
              <span className="text-sm text-gray-500 px-2">Page {page} of {lastPage}</span>
              <button onClick={() => goPage(page + 1)} disabled={page === lastPage}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Bottom CTA for deed writers ── */}
      <section className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Are you a licensed deed writer?</h2>
            <p className="text-blue-200 text-sm sm:text-base">
              Create a free profile and start receiving appointment requests from clients across Bangladesh.
            </p>
          </div>
          <Link
            href="/register"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-sm whitespace-nowrap"
          >
            Register Your Profile
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
