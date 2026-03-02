import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

const values = [
  {
    title: 'Verified Professionals',
    desc: 'Every dolil writer on our platform is licensed and registered with the relevant authorities. We verify credentials before listing.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Nationwide Coverage',
    desc: 'We serve all 64 districts of Bangladesh. No matter where you are, you can find a qualified dolil writer near you.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Transparent Reviews',
    desc: 'Real reviews from real clients help you make informed decisions. Ratings are verified and cannot be manipulated.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    title: 'Simple Booking',
    desc: 'Book an appointment in seconds — no phone calls needed. Submit your request online and the writer will confirm.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            About DolilBD
          </h1>
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            DolilBD is Bangladesh&apos;s first online directory for licensed dolil writers,
            making it easy for citizens to find and book verified legal professionals
            for property dolils and legal documents.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Property transactions in Bangladesh require licensed dolil writers — yet finding a
                trustworthy one has always been difficult. People rely on word of mouth,
                travel long distances, and often don&apos;t know if the professional they hire is
                properly registered.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                DolilBD changes that. We built a central platform where all licensed dolil
                writers can list their profile, and where citizens can search, compare, read reviews,
                and book appointments — from anywhere, at any time.
              </p>
              <Link
                href="/#directory"
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Browse Dolil Writers
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Stats block */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '64', label: 'Districts Covered', color: 'bg-blue-50 text-blue-700' },
                { value: '500+', label: 'Registered Writers', color: 'bg-green-50 text-green-700' },
                { value: '10K+', label: 'Clients Served', color: 'bg-purple-50 text-purple-700' },
                { value: '2026', label: 'Year Founded', color: 'bg-amber-50 text-amber-700' },
              ].map(({ value, label, color }) => (
                <div key={label} className={`rounded-2xl p-6 text-center ${color}`}>
                  <p className="text-3xl font-extrabold mb-1">{value}</p>
                  <p className="text-sm font-medium opacity-80">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-14 sm:py-20 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Why Choose Us</h2>
            <p className="text-gray-500 mt-2">What sets DolilBD apart</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-blue-100 text-blue-600 mb-4">
                  {v.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-blue-200 mb-8 max-w-xl mx-auto">
            Find a dolil writer near you or register your own profile today.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/#directory"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-sm">
              Find a Writer
            </Link>
            <Link href="/register"
              className="inline-flex items-center gap-2 border border-blue-300 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
              Register as Writer
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
