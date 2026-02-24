'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'react-toastify';

interface User { id: number; name: string; email: string; }
interface Deed {
  id: number;
  title: string;
  description: string | null;
  status: string;
  created_by: User | null;
  assigned_to: User | null;
  comments_count: number;
  documents_count: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  recorded: 'bg-green-100 text-green-800',
};

const STATUSES = ['', 'draft', 'pending', 'completed', 'recorded'];

export default function DeedsPage() {
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback((s: string, st: string) => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (s) params.search = s;
    if (st) params.status = st;
    api.get('/deeds', { params })
      .then((r) => setDeeds(r.data.data))
      .catch(() => toast.error('Failed to load deeds'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(search, status); }, []);

  function handleDelete(id: number) {
    if (!confirm('Delete this deed?')) return;
    api.delete(`/deeds/${id}`)
      .then(() => { toast.success('Deed deleted'); load(search, status); })
      .catch(() => toast.error('Delete failed'));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Deeds</h2>
        <Link href="/deeds/create" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
          + New Deed
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-3 items-center">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search, status)}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); load(search, e.target.value); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
          ))}
        </select>
        <button
          onClick={() => load(search, status)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          Search
        </button>
        {(search || status) && (
          <button
            onClick={() => { setSearch(''); setStatus(''); load('', ''); }}
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
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created By</th>
                <th className="px-4 py-3 font-medium">Assigned To</th>
                <th className="px-4 py-3 font-medium text-center">Comments</th>
                <th className="px-4 py-3 font-medium text-center">Docs</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deeds.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/deeds/${d.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {d.title}
                    </Link>
                    {d.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{d.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs capitalize font-medium ${statusColors[d.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.created_by?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{d.assigned_to?.name ?? <span className="text-gray-400 italic">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{d.comments_count}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{d.documents_count}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 text-xs">
                      <Link href={`/deeds/${d.id}`} className="text-blue-600 hover:underline">View</Link>
                      <Link href={`/deeds/${d.id}/edit`} className="text-gray-600 hover:underline">Edit</Link>
                      <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {deeds.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No deeds found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
