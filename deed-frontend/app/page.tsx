import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import HomeDirectoryClient from '@/app/_components/HomeDirectoryClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const metadata: Metadata = {
  title: 'Find Licensed Dolil Writers in Bangladesh',
  description: 'Search and book verified licensed dolil writers across all 64 districts of Bangladesh. Compare reviews, check credentials, and book appointments online.',
  openGraph: {
    title: 'DolilBD — Find Licensed Dolil Writers in Bangladesh',
    description: 'Search and book verified licensed dolil writers across all 64 districts of Bangladesh.',
    url: 'https://dolilbd.com',
    type: 'website',
  },
};

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
    desc: 'Use our filters to find dolil writers in your district, upazila, or union. Search by name or office.',
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

interface DolilWriter {
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
  data: DolilWriter[];
  meta: { current_page: number; last_page: number; total: number };
}

async function fetchInitialWriters(): Promise<{ writers: DolilWriter[]; total: number; lastPage: number }> {
  try {
    const res = await fetch(`${API}/dolil-writers?page=1&per_page=12`, { next: { revalidate: 60 } });
    if (!res.ok) return { writers: [], total: 0, lastPage: 1 };
    const data: PaginatedResponse = await res.json();
    return {
      writers: data.data ?? [],
      total: data.meta?.total ?? 0,
      lastPage: data.meta?.last_page ?? 1,
    };
  } catch {
    return { writers: [], total: 0, lastPage: 1 };
  }
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'DolilBD',
  url: 'https://dolilbd.com',
  description: "Bangladesh's directory of licensed dolil writers",
};

export default async function HomePage() {
  const { writers, total, lastPage } = await fetchInitialWriters();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader />

      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Find Licensed<br className="hidden sm:block" /> Dolil Writers in Bangladesh
          </h1>
          <p className="text-gray-500 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-8">
            Search verified, licensed dolil writers across all 64 districts.
            Compare reviews, check credentials, and book appointments online.
          </p>
          <Link href="#directory"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-lg">
            Browse Dolil Writers
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-extrabold text-white">{value}</p>
                <p className="text-sm text-blue-200 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Directory (interactive client component) */}
      <HomeDirectoryClient
        initialWriters={writers}
        initialTotal={total}
        initialLastPage={lastPage}
      />

      {/* How it works */}
      <section className="py-14 sm:py-20 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-2">Three simple steps to find your dolil writer</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 mb-4">
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">{s.step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Are you a licensed dolil writer?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Join DolilBD and reach thousands of clients looking for verified dolil writers in their area.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            Register as Dolil Writer
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
