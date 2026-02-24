'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { IconUsers, IconDocument, IconShield } from '@/components/ui/Icons';

interface AdminStats {
  users_total: number;
  users_by_role: Record<string, number>;
  users_by_status: Record<string, number>;
  deeds_total: number;
  deeds_by_status: Record<string, number>;
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
      <div className="flex items-center gap-3">
        <IconShield />
        <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Users</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard title="Total Users" value={stats.users_total} icon={<IconUsers />} color="blue" />
          <StatCard title="Regular Users" value={stats.users_by_role?.user ?? 0} icon={<IconUsers />} color="gray" />
          <StatCard title="Deed Writers" value={stats.users_by_role?.deed_writer ?? 0} icon={<IconUsers />} color="yellow" />
          <StatCard title="Admins" value={stats.users_by_role?.admin ?? 0} icon={<IconShield />} color="red" />
        </div>
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
          Manage Users →
        </Link>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Deeds</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Deeds" value={stats.deeds_total} icon={<IconDocument />} color="blue" />
          <StatCard title="Draft" value={stats.deeds_by_status?.draft ?? 0} icon={<IconDocument />} color="gray" />
          <StatCard title="Pending" value={stats.deeds_by_status?.pending ?? 0} icon={<IconDocument />} color="yellow" />
          <StatCard title="Recorded" value={stats.deeds_by_status?.recorded ?? 0} icon={<IconDocument />} color="green" />
        </div>
      </div>
    </div>
  );
}
