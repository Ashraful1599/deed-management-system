'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { fmtDate } from '@/lib/date';
import { StatCard } from '@/components/ui/StatCard';
import { IconDocument } from '@/components/ui/Icons';

interface Stats {
  deeds_total?: number;
  deeds_created?: number;
  deeds_assigned?: number;
  deeds_by_status: Record<string, number>;
  recent_deeds: {
    id: number;
    title: string;
    status: string;
    created_by: string | null;
    assigned_to: string | null;
    created_at: string;
  }[];
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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback((df: string, dt: string) => {
    setStats(null);
    const params: Record<string, string> = {};
    if (df) params.date_from = df;
    if (dt) params.date_to = dt;
    api.get('/dashboard/stats', { params })
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => { load('', ''); }, []);

  if (!stats) return <div className="text-gray-500">Loading...</div>;

  const isAdmin = stats.deeds_total !== undefined;
  const totalDeeds = isAdmin ? stats.deeds_total! : (stats.deeds_created! + stats.deeds_assigned!);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <Link href="/dashboard/deeds/create" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
          + New Deed
        </Link>
      </div>

      {/* Date filter */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-500 font-medium">Filter by date:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); load(e.target.value, dateTo); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="From date"
        />
        <span className="text-gray-400 text-sm">–</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); load(dateFrom, e.target.value); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="To date"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); load('', ''); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Deeds" value={totalDeeds ?? 0} icon={<IconDocument />} color="blue" />
        <StatCard title="Draft" value={stats.deeds_by_status?.draft ?? 0} icon={<IconDocument />} color="gray" />
        <StatCard title="Under Review" value={stats.deeds_by_status?.under_review ?? 0} icon={<IconDocument />} color="yellow" />
        <StatCard title="Archived" value={stats.deeds_by_status?.archived ?? 0} icon={<IconDocument />} color="green" />
      </div>

      {!isAdmin && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Created by Me" value={stats.deeds_created ?? 0} icon={<IconDocument />} color="blue" />
          <StatCard title="Assigned to Me" value={stats.deeds_assigned ?? 0} icon={<IconDocument />} color="purple" />
        </div>
      )}

      {/* Recent deeds */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Deeds</h3>
          <Link href="/dashboard/deeds" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.recent_deeds.length === 0 && (
            <p className="px-6 py-8 text-center text-gray-400 text-sm">No deeds yet</p>
          )}
          {stats.recent_deeds.map((deed) => (
            <div key={deed.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div>
                <Link href={`/dashboard/deeds/${deed.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                  {deed.title}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5">
                  {deed.created_by && `By ${deed.created_by}`}
                  {deed.assigned_to && ` → ${deed.assigned_to}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded ${statusColors[deed.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {statusLabels[deed.status] ?? deed.status}
                </span>
                <span className="text-xs text-gray-400">
                  {fmtDate(deed.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
