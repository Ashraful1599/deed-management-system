'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { fmtDate } from '@/lib/date';
import { StatCard } from '@/components/ui/StatCard';
import { IconUsers, IconDocument, IconShield } from '@/components/ui/Icons';

interface RecentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface RecentDeed {
  id: number;
  title: string;
  status: string;
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
}

interface AdminStats {
  users_total: number;
  users_by_role: Record<string, number>;
  users_by_status: Record<string, number>;
  users_new_today: number;
  users_new_this_week: number;
  deeds_total: number;
  deeds_by_status: Record<string, number>;
  deeds_new_today: number;
  deeds_new_this_week: number;
  recent_users: RecentUser[];
  recent_deeds: RecentDeed[];
}

const roleColors: Record<string, string> = {
  admin:       'bg-red-100 text-red-700',
  deed_writer: 'bg-purple-100 text-purple-700',
  user:        'bg-gray-100 text-gray-600',
};

const roleLabels: Record<string, string> = {
  admin:       'Admin',
  deed_writer: 'Deed Writer',
  user:        'User',
};

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

const userStatusColors: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  pending:   'bg-yellow-100 text-yellow-700',
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get('/admin/stats')
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  if (!stats) return <div className="text-gray-500 py-8">Loading...</div>;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconShield />
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/users" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Manage Users
          </Link>
          <Link href="/admin/deeds" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
            Manage Deeds
          </Link>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Users"  value={stats.users_total} icon={<IconUsers />}    color="blue" />
        <StatCard title="Total Deeds"  value={stats.deeds_total} icon={<IconDocument />} color="purple" />
        <StatCard title="New Users This Week"  value={stats.users_new_this_week} icon={<IconUsers />}    color="green" />
        <StatCard title="New Deeds This Week"  value={stats.deeds_new_this_week} icon={<IconDocument />} color="yellow" />
      </div>

      {/* Users + Deeds breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Users breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Users</h3>
            <Link href="/admin/users" className="text-xs text-blue-600 hover:underline">Manage →</Link>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg py-3">
                <p className="text-xl font-bold text-gray-800">{stats.users_by_role?.user ?? 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Regular</p>
              </div>
              <div className="bg-purple-50 rounded-lg py-3">
                <p className="text-xl font-bold text-purple-700">{stats.users_by_role?.deed_writer ?? 0}</p>
                <p className="text-xs text-purple-500 mt-0.5">Deed Writers</p>
              </div>
              <div className="bg-red-50 rounded-lg py-3">
                <p className="text-xl font-bold text-red-700">{stats.users_by_role?.admin ?? 0}</p>
                <p className="text-xs text-red-500 mt-0.5">Admins</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <span className="text-green-600 font-medium">{stats.users_by_status?.active ?? 0} active</span>
                <span className="text-red-500 font-medium">{stats.users_by_status?.suspended ?? 0} suspended</span>
                <span className="text-yellow-600 font-medium">{stats.users_by_status?.pending ?? 0} pending</span>
              </div>
              <span className="text-xs text-gray-400">+{stats.users_new_today} today</span>
            </div>
          </div>
        </div>

        {/* Deeds breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Deeds</h3>
            <Link href="/admin/deeds" className="text-xs text-blue-600 hover:underline">Manage →</Link>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg py-3">
                <p className="text-xl font-bold text-gray-700">{stats.deeds_by_status?.draft ?? 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Draft</p>
              </div>
              <div className="bg-yellow-50 rounded-lg py-3">
                <p className="text-xl font-bold text-yellow-700">{stats.deeds_by_status?.under_review ?? 0}</p>
                <p className="text-xs text-yellow-500 mt-0.5">Under Review</p>
              </div>
              <div className="bg-blue-50 rounded-lg py-3">
                <p className="text-xl font-bold text-blue-700">{stats.deeds_by_status?.completed ?? 0}</p>
                <p className="text-xs text-blue-500 mt-0.5">Completed</p>
              </div>
              <div className="bg-green-50 rounded-lg py-3">
                <p className="text-xl font-bold text-green-700">{stats.deeds_by_status?.archived ?? 0}</p>
                <p className="text-xs text-green-500 mt-0.5">Archived</p>
              </div>
            </div>
            <div className="flex items-center justify-end text-xs text-gray-400 pt-2 border-t border-gray-100">
              +{stats.deeds_new_today} today
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Recent users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Recent Registrations</h3>
            <Link href="/admin/users" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recent_users.length === 0 && (
              <p className="px-6 py-6 text-sm text-gray-400 text-center">No users yet</p>
            )}
            {stats.recent_users.map((u) => (
              <div key={u.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge label={roleLabels[u.role] ?? u.role} color={roleColors[u.role] ?? 'bg-gray-100 text-gray-600'} />
                  <Badge label={u.status} color={userStatusColors[u.status] ?? 'bg-gray-100 text-gray-600'} />
                  <span className="text-xs text-gray-400 ml-1">{fmtDate(u.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent deeds */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Recent Deeds</h3>
            <Link href="/admin/deeds" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recent_deeds.length === 0 && (
              <p className="px-6 py-6 text-sm text-gray-400 text-center">No deeds yet</p>
            )}
            {stats.recent_deeds.map((d) => (
              <div key={d.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <Link href={`/dashboard/deeds/${d.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                    {d.title}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {d.created_by && `By ${d.created_by}`}
                    {d.assigned_to && ` → ${d.assigned_to}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge label={statusLabels[d.status] ?? d.status} color={statusColors[d.status] ?? 'bg-gray-100 text-gray-700'} />
                  <span className="text-xs text-gray-400 ml-1">{fmtDate(d.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
