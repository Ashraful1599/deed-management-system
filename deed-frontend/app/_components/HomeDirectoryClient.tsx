'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Division { id: number; name: string; bn_name: string; }
interface District { id: number; division_id: number; division: string; name: string; bn_name: string; }
interface Upazila  { id: number; district_id: number; name: string; bn_name: string; }

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

// Nominatim sometimes returns old/anglicised district & division names — map them to our DB names
const NAME_ALIASES: Record<string, string> = {
  chittagong:      'chattogram',
  comilla:         'cumilla',
  jessore:         'jashore',
  bogra:           'bogura',
  barisal:         'barishal',
  borguna:         'barguna',
  jhalokati:       'jhalokathi',
  chapainawabganj: 'chapai nawabganj',
  bandarban:       'bandarban',
  brahmanbaria:    'brahmanbaria',
  chandpur:        'chandpur',
  feni:            'feni',
  khagrachari:     'khagrachhari',
  lakshmipur:      'lakshmipur',
  noakhali:        'noakhali',
  rangamati:       'rangamati',
  pirojpur:        'pirojpur',
  patuakhali:      'patuakhali',
  habiganj:        'habiganj',
  moulvibazar:     'moulvibazar',
  sunamganj:       'sunamganj',
  sylhet:          'sylhet',
  dinajpur:        'dinajpur',
  gaibandha:       'gaibandha',
  joypurhat:       'joypurhat',
  kurigram:        'kurigram',
  lalmonirhat:     'lalmonirhat',
  nilphamari:      'nilphamari',
  panchagarh:      'panchagarh',
  rangpur:         'rangpur',
  thakurgaon:      'thakurgaon',
  faridpur:        'faridpur',
  gopalganj:       'gopalganj',
  madaripur:       'madaripur',
  manikganj:       'manikganj',
  munshiganj:      'munshiganj',
  narayanganj:     'narayanganj',
  narsingdi:       'narsingdi',
  rajbari:         'rajbari',
  shariatpur:      'shariatpur',
  tangail:         'tangail',
  kishoreganj:     'kishoreganj',
  mymensingh:      'mymensingh',
  netrokona:       'netrokona',
  sherpur:         'sherpur',
  jamalpur:        'jamalpur',
  bagerhat:        'bagerhat',
  chuadanga:       'chuadanga',
  khulna:          'khulna',
  kushtia:         'kushtia',
  magura:          'magura',
  meherpur:        'meherpur',
  narail:          'narail',
  satkhira:        'satkhira',
  naogaon:         'naogaon',
  natore:          'natore',
  pabna:           'pabna',
  rajshahi:        'rajshahi',
  sirajganj:       'sirajganj',
};

function normaliseName(raw: string): string {
  const cleaned = raw
    .replace(/\s*(division|bibhag|district|zila|jela|sadar)\s*/gi, '')
    .trim()
    .toLowerCase();
  return NAME_ALIASES[cleaned] ?? cleaned;
}

function fuzzyMatch(dbName: string, query: string): boolean {
  if (!query) return false;
  const a = dbName.toLowerCase().trim();
  const b = query.toLowerCase().trim();
  return a === b || a.includes(b) || b.includes(a);
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

export default function HomeDirectoryClient({
  initialWriters,
  initialTotal,
  initialLastPage,
}: {
  initialWriters: DolilWriter[];
  initialTotal: number;
  initialLastPage: number;
}) {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [upazilas, setUpazilas]   = useState<Upazila[]>([]);

  const [divisionId, setDivisionId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [upazilaId,  setUpazilaId]  = useState('');
  const [search, setSearch]         = useState('');

  const [writers,  setWriters]  = useState<DolilWriter[]>(initialWriters);
  const [loading,  setLoading]  = useState(false);
  const [page,     setPage]     = useState(1);
  const [lastPage, setLastPage] = useState(initialLastPage);
  const [total,    setTotal]    = useState(initialTotal);

  const [locating,         setLocating]         = useState(false);
  const [locError,         setLocError]          = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation]  = useState<string | null>(null);
  const pendingGeoDistrictId = useRef<string>('');

  useEffect(() => {
    fetch(`${API}/locations/divisions`).then((r) => r.json()).then(setDivisions).catch(() => {});
  }, []);

  useEffect(() => {
    const pendingDist = pendingGeoDistrictId.current;
    pendingGeoDistrictId.current = '';
    setDistrictId(pendingDist);
    setUpazilaId('');
    setDistricts([]); setUpazilas([]);
    if (!divisionId) return;
    fetch(`${API}/locations/divisions/${divisionId}/districts`)
      .then((r) => r.json())
      .then(setDistricts)
      .catch(() => {});
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
    fetch(`${API}/dolil-writers?${params}`)
      .then((r) => r.json())
      .then((res: PaginatedResponse) => {
        setWriters(res.data);
        setLastPage(res.meta?.last_page ?? 1);
        setTotal(res.meta?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [divisionId, districtId, upazilaId, search]);

  useEffect(() => { setPage(1); fetchWriters(1); }, [divisionId, districtId, upazilaId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchWriters(1);
  }

  function handleReset() {
    setDivisionId(''); setDistrictId(''); setUpazilaId(''); setSearch('');
    setDistricts([]); setUpazilas([]);
    setDetectedLocation(null); setLocError(null);
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocError(null);
    setDetectedLocation(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
            { headers: { 'User-Agent': 'DolilManager/1.0' } }
          );
          const geo = await res.json();

          if (geo.address?.country_code !== 'bd') {
            setLocError('Your location appears to be outside Bangladesh. Please use the filters to search manually.');
            return;
          }

          const stateRaw  = geo.address?.state ?? '';
          const countyRaw = geo.address?.county ?? geo.address?.city_district ?? geo.address?.city ?? '';
          const normState  = normaliseName(stateRaw);
          const normCounty = normaliseName(countyRaw);

          const matchedDiv = divisions.find((d) => fuzzyMatch(d.name, normState));
          if (!matchedDiv) {
            setLocError(`Could not match "${stateRaw}" to a known division. Try selecting manually.`);
            return;
          }

          const distRes  = await fetch(`${API}/locations/divisions/${matchedDiv.id}/districts`);
          const distList: District[] = await distRes.json();
          const matchedDist = distList.find((d) => fuzzyMatch(d.name, normCounty));

          setDetectedLocation([matchedDist?.name, matchedDiv.name].filter(Boolean).join(', '));
          pendingGeoDistrictId.current = matchedDist ? String(matchedDist.id) : '';
          setDivisionId(String(matchedDiv.id));
          document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth' });
        } catch {
          setLocError('Could not determine your location. Please search manually.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        if (err.code === 1 /* PERMISSION_DENIED */) {
          setLocError('Location access was denied. Click the location icon in your browser address bar and choose "Allow", then try again.');
        } else if (err.code === 3 /* TIMEOUT */) {
          setLocError('Location request timed out. Please try again.');
        } else {
          const isMac = /Mac/.test(navigator.userAgent);
          const isWin = /Win/.test(navigator.userAgent);
          if (isMac) {
            setLocError('Location unavailable. On macOS, go to System Settings → Privacy & Security → Location Services and make sure your browser is enabled.');
          } else if (isWin) {
            setLocError('Location unavailable. On Windows, go to Settings → Privacy → Location and enable location access for your browser.');
          } else {
            setLocError('Location unavailable. Please search manually using the filters below.');
          }
        }
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }

  const hasFilters = !!(divisionId || districtId || upazilaId || search);

  return (
    <section id="directory" className="py-12 sm:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Browse Dolil Writers</h2>
            {total > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {total} writer{total !== 1 ? 's' : ''} found
                {detectedLocation && <span className="text-blue-600 ml-1">near {detectedLocation}</span>}
              </p>
            )}
          </div>
          <button
            onClick={detectLocation}
            disabled={locating}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {locating ? 'Detecting…' : 'Use My Location'}
          </button>
        </div>

        {locError && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3">{locError}</div>
        )}

        {/* Filters */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select value={divisionId} onChange={(e) => setDivisionId(e.target.value)} className={selectCls}>
              <option value="">All Divisions</option>
              {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={districtId} onChange={(e) => setDistrictId(e.target.value)} disabled={!divisionId} className={selectCls}>
              <option value="">All Districts</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={upazilaId} onChange={(e) => setUpazilaId(e.target.value)} disabled={!districtId} className={selectCls}>
              <option value="">All Upazilas</option>
              {upazilas.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name…"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                Search
              </button>
            </div>
          </div>
          {hasFilters && (
            <button type="button" onClick={handleReset} className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition">
              Clear filters
            </button>
          )}
        </form>

        {/* Writer grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : writers.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-500">No dolil writers found. Try adjusting your filters.</p>
            {hasFilters && (
              <button onClick={handleReset} className="mt-3 text-sm text-blue-600 hover:underline">Clear all filters</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {writers.map((w) => (
              <Link key={w.id} href={`/dolil-writers/${w.id}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:border-blue-300 hover:shadow-md transition group">
                <div className="flex items-start gap-3">
                  <WriterAvatar name={w.name} src={w.avatar} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition">{w.name}</p>
                    {w.office_name && <p className="text-xs text-gray-500 truncate mt-0.5">{w.office_name}</p>}
                  </div>
                </div>
                {(w.district_name || w.upazila_name) && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{[w.upazila_name, w.district_name].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                  {w.reviews_avg_rating != null && w.reviews_count && w.reviews_count > 0 ? (
                    <div className="flex items-center gap-1">
                      <StarRating rating={Number(w.reviews_avg_rating)} />
                      <span className="text-xs text-gray-500 ml-0.5">({w.reviews_count})</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No reviews yet</span>
                  )}
                  <span className="text-xs font-medium text-blue-600">View Profile →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => { const p = page - 1; setPage(p); fetchWriters(p); }}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {lastPage}</span>
            <button
              onClick={() => { const p = page + 1; setPage(p); fetchWriters(p); }}
              disabled={page === lastPage}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
