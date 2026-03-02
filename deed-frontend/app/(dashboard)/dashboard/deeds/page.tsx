'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { fmtDate } from '@/lib/date';
import { toast } from 'react-toastify';
import { showConfirm } from '@/lib/confirm';

interface User { id: number; name: string; email: string; }
interface Deed {
  id: number;
  deed_number: string | null;
  title: string;
  description: string | null;
  status: string;
  created_by: User | null;
  assigned_to: User | null;
  comments_count: number;
  documents_count: number;
  reviews_count: number;
  reviews_avg_rating: number | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft:        'bg-gray-100 text-gray-700',
  under_review: 'bg-yellow-100 text-yellow-800',
  completed:    'bg-blue-100 text-blue-800',
  archived:     'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  draft:        'Draft',
  under_review: 'Under Review',
  completed:    'Completed',
  archived:     'Archived',
};

const STATUSES = ['', 'draft', 'under_review', 'completed', 'archived'];

type SortKey = 'id' | 'deed_number' | 'title' | 'status' | 'created_at' | 'creator' | 'assignee';
type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`inline-flex flex-col ml-1 ${active ? 'text-blue-600' : 'text-gray-300'}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className={`w-2.5 h-2.5 -mb-0.5 ${active && dir === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" className={`w-2.5 h-2.5 ${active && dir === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </span>
  );
}

export default function DeedsPage() {
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback((s: string, st: string, df: string, dt: string, sb: SortKey, sd: SortDir, p: number) => {
    setLoading(true);
    const params: Record<string, string> = { sort_by: sb, sort_dir: sd, page: String(p) };
    if (s) params.search = s;
    if (st) params.status = st;
    if (df) params.date_from = df;
    if (dt) params.date_to = dt;
    api.get('/deeds', { params })
      .then((r) => {
        setDeeds(r.data.data);
        setLastPage(r.data.meta?.last_page ?? r.data.last_page ?? 1);
        setTotal(r.data.meta?.total ?? r.data.total ?? 0);
      })
      .catch(() => toast.error('Failed to load deeds'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(search, status, dateFrom, dateTo, sortBy, sortDir, 1); }, []);

  function handleSort(col: SortKey) {
    const newDir: SortDir = sortBy === col && sortDir === 'desc' ? 'asc' : 'desc';
    setSortBy(col);
    setSortDir(newDir);
    setPage(1);
    load(search, status, dateFrom, dateTo, col, newDir, 1);
  }

  async function handleDelete(id: number) {
    if (!await showConfirm('This deed will be permanently deleted.', { title: 'Delete deed?' })) return;
    api.delete(`/deeds/${id}`)
      .then(() => { toast.success('Deed deleted'); load(search, status, dateFrom, dateTo, sortBy, sortDir, page); })
      .catch(() => toast.error('Delete failed'));
  }

  function goToPage(p: number) {
    setPage(p);
    load(search, status, dateFrom, dateTo, sortBy, sortDir, p);
  }

  function SortTh({ col, label, className }: { col: SortKey; label: string; className?: string }) {
    return (
      <th
        className={`px-4 py-3 font-medium cursor-pointer select-none hover:bg-gray-100 whitespace-nowrap ${className ?? ''}`}
        onClick={() => handleSort(col)}
      >
        <span className="inline-flex items-center">
          {label}
          <SortIcon active={sortBy === col} dir={sortDir} />
        </span>
      </th>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Deeds</h2>
        <Link href="/dashboard/deeds/create" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
          + New Deed
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by deed #, title, name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load(search, status, dateFrom, dateTo, sortBy, sortDir, 1); } }}
          className="flex-1 min-w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); load(search, e.target.value, dateFrom, dateTo, sortBy, sortDir, 1); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? (statusLabels[s] ?? s) : 'All Statuses'}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); load(search, status, e.target.value, dateTo, sortBy, sortDir, 1); }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="From date"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); load(search, status, dateFrom, e.target.value, sortBy, sortDir, 1); }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="To date"
          />
        </div>
        <button
          onClick={() => { setPage(1); load(search, status, dateFrom, dateTo, sortBy, sortDir, 1); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          Search
        </button>
        {(search || status || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearch(''); setStatus(''); setDateFrom(''); setDateTo(''); setPage(1); load('', '', '', '', sortBy, sortDir, 1); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500 py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left border-b border-gray-200">
              <tr>
                <SortTh col="id" label="#" className="w-12" />
                <SortTh col="deed_number" label="Deed No." className="w-32" />
                <SortTh col="title" label="Title" />
                <SortTh col="status" label="Status" />
                <SortTh col="creator" label="Created By" />
                <SortTh col="assignee" label="Assigned To" />
                <th className="px-4 py-3 font-medium text-center">Comments</th>
                <th className="px-4 py-3 font-medium text-center">Docs</th>
                <th className="px-4 py-3 font-medium text-center">Rating</th>
                <SortTh col="created_at" label="Date" />
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deeds.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">{d.id}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-700">
                    {d.deed_number ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/deeds/${d.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {d.title}
                    </Link>
                    {d.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{d.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[d.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {statusLabels[d.status] ?? d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.created_by?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{d.assigned_to?.name ?? <span className="text-gray-400 italic">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{d.comments_count}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{d.documents_count}</td>
                  <td className="px-4 py-3 text-center">
                    {d.reviews_avg_rating !== null ? (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <span className="text-yellow-400">★</span>
                        <span className="font-medium text-gray-700">{d.reviews_avg_rating}</span>
                        <span className="text-xs text-gray-400">({d.reviews_count})</span>
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(d.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 text-xs">
                      <Link href={`/dashboard/deeds/${d.id}`} className="text-blue-600 hover:underline">View</Link>
                      <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {deeds.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">No deeds found</td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Page {page} of {lastPage} &mdash; {total} total
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >«</button>
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >‹ Prev</button>
                {Array.from({ length: lastPage }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === lastPage || Math.abs(p - page) <= 2)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-xs text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p as number)}
                        className={`px-2.5 py-1 rounded text-xs font-medium ${
                          p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >{p}</button>
                    )
                  )}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === lastPage}
                  className="px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >Next ›</button>
                <button
                  onClick={() => goToPage(lastPage)}
                  disabled={page === lastPage}
                  className="px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >»</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
